'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { PoolClient } from 'pg';
import { requireAdmin } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import { adminSelectableStatuses } from '@/app/admin/statuses';

const statusSchema = z.enum(adminSelectableStatuses);
const memberStatusSchema = z.enum(['active', 'suspended', 'withdrawn']);
const moneyTypeSchema = z.enum(['none', 'fixed_fee', 'range_or_upper_limit', 'reimbursement', 'reward', 'donation', 'undecided']);
const reasonSchema = z.object({ reasonCode: z.string().trim().min(1).max(80), reasonText: z.string().trim().min(1).max(2000) });
const idSchema = z.string().uuid();

/** 失敗の理由。画面の文言は `AdminNotice` が持つ。 */
type FailureCode = 'input' | 'transition' | 'failed';
type AdminActionResult = { ok: true } | { ok: false; code: FailureCode };

const OK: AdminActionResult = { ok: true };
function fail(code: FailureCode): AdminActionResult {
  return { ok: false, code };
}

/** 失敗したときだけクエリを付ける。成功時のURLは変えない。 */
function finish(path: string, result: AdminActionResult): never {
  redirect(result.ok ? path : `${path}?error=${result.code}`);
}

/**
 * 管理操作を1トランザクションで実行する。
 *
 * 失敗は呼び出し元へ返す。以前はここで握り潰していたため、非公開化や会員停止が
 * 効いていないのに管理者が成功と誤認できた。
 */
async function withAdminTransaction(
  action: string,
  work: (client: PoolClient, adminId: string) => Promise<void>,
): Promise<AdminActionResult> {
  if (!db) {
    console.error('AIueo admin action failed', { action, reason: 'database_unavailable' });
    return fail('failed');
  }
  const admin = await requireAdmin();
  const client = await db.$client.connect();
  let broken = false;
  try {
    await client.query('begin');
    await work(client, admin.userId);
    await client.query('commit');
    return OK;
  } catch (error) {
    // 個人情報は出さない。何の操作がどう失敗したかだけ残す。
    console.error('AIueo admin action failed', { action, message: error instanceof Error ? error.message : 'unknown' });
    try {
      await client.query('rollback');
    } catch {
      // rollback 自体が失敗したコネクションは、トランザクションが開いたまま
      // プールへ戻る恐れがある。破棄して再利用させない。
      broken = true;
    }
    return fail('failed');
  } finally {
    client.release(broken);
  }
}

async function recordAdminChange(client: PoolClient, adminId: string, entityType: string, entityId: string, action: string, reasonCode: string, reasonText: string, beforeState: unknown, afterState: unknown) {
  await client.query('insert into moderation_actions (actor_id, target_type, target_id, action, reason_code, reason_text, before_state, after_state) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)', [adminId, entityType, entityId, action, reasonCode, reasonText, JSON.stringify(beforeState), JSON.stringify(afterState)]);
  await client.query('insert into audit_log (actor_id, entity_type, entity_id, action, before_state, after_state) values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)', [adminId, entityType, entityId, action, JSON.stringify(beforeState), JSON.stringify(afterState)]);
}

export async function adminSetProposalStateAction(formData: FormData) {
  const proposalId = idSchema.safeParse(formData.get('proposalId'));
  const status = statusSchema.safeParse(formData.get('status'));
  const reason = reasonSchema.safeParse({ reasonCode: formData.get('reasonCode'), reasonText: formData.get('reasonText') });
  if (!proposalId.success) finish('/admin/proposals', fail('input'));
  const path = `/admin/proposals/${proposalId.data}`;
  if (!status.success || !reason.success) finish(path, fail('input'));

  let outcome: AdminActionResult = OK;
  const transaction = await withAdminTransaction('proposal_state', async (client, adminId) => {
    const current = await client.query('select * from proposals where id = $1 for update', [proposalId.data]);
    if (current.rowCount !== 1) throw new Error('proposal not found');
    // 同じ状態への変更は版履歴・監査・通知を無意味に増やすだけで、何も変えない。
    if (current.rows[0].status === status.data) {
      outcome = fail('transition');
      throw new Error('no state change');
    }
    const publishedAt = status.data === 'published' ? current.rows[0].published_at ?? new Date().toISOString() : current.rows[0].published_at;
    const updated = await client.query('update proposals set status = $1, published_at = $2 where id = $3 returning *', [status.data, publishedAt, proposalId.data]);
    await client.query('insert into proposal_versions (proposal_id, actor_id, reason_code, reason_text, snapshot) values ($1, $2, $3, $4, $5::jsonb)', [proposalId.data, adminId, reason.data.reasonCode, reason.data.reasonText, JSON.stringify(updated.rows[0])]);
    await recordAdminChange(client, adminId, 'proposal', proposalId.data, 'admin_proposal_state_changed', reason.data.reasonCode, reason.data.reasonText, current.rows[0], updated.rows[0]);
    await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5)', [current.rows[0].owner_id, proposalId.data, 'admin_proposal_state', `管理者が企画の掲載状態を「${status.data}」に変更しました。理由: ${reason.data.reasonText}`, `admin-state-${proposalId.data}-${crypto.randomUUID()}`]);
  });
  finish(path, transaction.ok ? OK : outcome.ok ? transaction : outcome);
}

export async function adminSetMemberStatusAction(formData: FormData) {
  const userId = formData.get('userId');
  const status = memberStatusSchema.safeParse(formData.get('status'));
  const reason = reasonSchema.safeParse({ reasonCode: formData.get('reasonCode'), reasonText: formData.get('reasonText') });
  if (typeof userId !== 'string' || !userId || !status.success || !reason.success) finish('/admin/members', fail('input'));

  let outcome: AdminActionResult = OK;
  const transaction = await withAdminTransaction('member_status', async (client, adminId) => {
    const current = await client.query('select * from profiles where id = $1 for update', [userId]);
    if (current.rowCount !== 1) throw new Error('member not found');
    if (current.rows[0].status === status.data) {
      outcome = fail('transition');
      throw new Error('no state change');
    }
    const updated = await client.query('update profiles set status = $1 where id = $2 returning *', [status.data, userId]);
    await recordAdminChange(client, adminId, 'member', userId, 'admin_member_status_changed', reason.data.reasonCode, reason.data.reasonText, current.rows[0], updated.rows[0]);
    await client.query('insert into notifications (recipient_id, kind, body, dedupe_key) values ($1, $2, $3, $4)', [userId, 'admin_member_status', `管理者が会員状態を「${status.data}」に変更しました。理由: ${reason.data.reasonText}`, `admin-member-${userId}-${crypto.randomUUID()}`]);
  });
  finish('/admin/members', transaction.ok ? OK : outcome.ok ? transaction : outcome);
}

export async function adminResolveReportAction(formData: FormData) {
  const reportId = idSchema.safeParse(formData.get('reportId'));
  const reason = reasonSchema.safeParse({ reasonCode: formData.get('reasonCode'), reasonText: formData.get('reasonText') });
  if (!reportId.success || !reason.success) finish('/admin/moderation', fail('input'));

  const transaction = await withAdminTransaction('resolve_report', async (client, adminId) => {
    const current = await client.query('select * from reports where id = $1 for update', [reportId.data]);
    if (current.rowCount !== 1) throw new Error('report not found');
    const updated = await client.query('update reports set resolved_at = now(), resolved_by = $1, resolution_reason = $2 where id = $3 returning *', [adminId, reason.data.reasonText, reportId.data]);
    await recordAdminChange(client, adminId, 'report', reportId.data, 'admin_report_resolved', reason.data.reasonCode, reason.data.reasonText, current.rows[0], updated.rows[0]);
  });
  finish('/admin/moderation', transaction);
}

export async function sendAdminMessageAction(formData: FormData) {
  const proposalId = idSchema.safeParse(formData.get('proposalId'));
  const body = z.string().trim().min(1).max(5000).safeParse(formData.get('body'));
  if (!proposalId.success) finish('/admin/proposals', fail('input'));
  const path = `/admin/proposals/${proposalId.data}/messages`;
  if (!body.success) finish(path, fail('input'));

  const transaction = await withAdminTransaction('admin_message', async (client, adminId) => {
    const proposal = await client.query('select id, owner_id from proposals where id = $1 for update', [proposalId.data]);
    if (proposal.rowCount !== 1) throw new Error('proposal not found');
    const message = await client.query('insert into proposal_messages (proposal_id, sender_id, body) values ($1, $2, $3) returning *', [proposalId.data, adminId, body.data]);
    await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5)', [proposal.rows[0].owner_id, proposalId.data, 'admin_message', '管理者から企画についてのメッセージが届きました。', `admin-message-${message.rows[0].id}`]);
    await client.query('insert into audit_log (actor_id, entity_type, entity_id, action, after_state) values ($1, $2, $3, $4, $5::jsonb)', [adminId, 'proposal_message', message.rows[0].id, 'admin_message_sent', JSON.stringify({ proposalId: proposalId.data })]);
  });
  finish(path, transaction);
}

const editSchema = z.object({ proposalId: z.string().uuid(), title: z.string().trim().min(1).max(140), summary: z.string().trim().min(1).max(5000), format: z.enum(['offline', 'online', 'hybrid']), tentativeStartsAt: z.string().min(1), recruitmentDeadlineAt: z.string(), publicExpiresAt: z.string().min(1), organizerName: z.string().trim().min(1).max(120), participationMethod: z.string().trim().min(1).max(2000), visibility: z.enum(['public', 'unlisted']), moneyType: moneyTypeSchema, moneyDetails: z.string(), reasonCode: z.string().trim().min(1).max(80), reasonText: z.string().trim().min(1).max(2000) });
function toIso(value: string) { const date = new Date(value.includes('T') && !/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? `${value}:00+09:00` : value); return Number.isNaN(date.valueOf()) ? null : date.toISOString(); }

/** `money_details` は必ずオブジェクト。配列や数値が入ると公開ページの金銭条件表示が壊れる。 */
function parseMoneyDetails(value: string): Record<string, unknown> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value || '{}');
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}

export async function adminUpdateProposalAction(formData: FormData) {
  const parsed = editSchema.safeParse(Object.fromEntries(formData.entries()));
  const rawId = formData.get('proposalId');
  const path = typeof rawId === 'string' && idSchema.safeParse(rawId).success ? `/admin/proposals/${rawId}` : '/admin/proposals';
  if (!parsed.success) finish(path, fail('input'));
  const value = parsed.data; const tentative = toIso(value.tentativeStartsAt); const expiry = toIso(value.publicExpiresAt); const deadline = value.recruitmentDeadlineAt ? toIso(value.recruitmentDeadlineAt) : null;
  if (!tentative || !expiry || (value.recruitmentDeadlineAt && !deadline)) finish(path, fail('input'));
  const moneyDetails = parseMoneyDetails(value.moneyDetails);
  if (!moneyDetails) finish(path, fail('input'));

  const transaction = await withAdminTransaction('proposal_edit', async (client, adminId) => {
    const current = await client.query('select * from proposals where id = $1 for update', [value.proposalId]);
    if (current.rowCount !== 1) throw new Error('proposal not found');
    const updated = await client.query(`update proposals set title = $1, summary = $2, format = $3, tentative_starts_at = $4, recruitment_deadline_at = $5, public_expires_at = $6, organizer_name = $7, participation_method = $8, visibility = $9, money_type = $10, money_details = $11::jsonb where id = $12 returning *`, [value.title, value.summary, value.format, tentative, deadline, expiry, value.organizerName, value.participationMethod, value.visibility, value.moneyType, JSON.stringify(moneyDetails), value.proposalId]);
    await client.query('insert into proposal_versions (proposal_id, actor_id, reason_code, reason_text, snapshot) values ($1, $2, $3, $4, $5::jsonb)', [value.proposalId, adminId, value.reasonCode, value.reasonText, JSON.stringify(updated.rows[0])]);
    await recordAdminChange(client, adminId, 'proposal', value.proposalId, 'admin_proposal_edited', value.reasonCode, value.reasonText, current.rows[0], updated.rows[0]);
    await client.query('insert into notifications (recipient_id, proposal_id, kind, body, dedupe_key) values ($1, $2, $3, $4, $5)', [current.rows[0].owner_id, value.proposalId, 'admin_proposal_edit', `管理者が企画内容を変更しました。理由: ${value.reasonText}`, `admin-edit-${value.proposalId}-${crypto.randomUUID()}`]);
  });
  finish(path, transaction);
}
