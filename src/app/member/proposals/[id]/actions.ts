'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireActiveMember } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import type { ProposalActionState } from '@/app/member/proposals/new/actions';

const stateSchema = z.enum(['planning', 'confirmed', 'full', 'cancelled', 'completed']);

// 企画者自身が編集・下書き保存・公開できる状態。hidden(管理者の緊急非公開)、
// ended/cancelled(開催状況フォームで終端済み)は編集不可。
const EDITABLE_STATUSES = new Set(['draft', 'published', 'needs_revision', 'auto_hidden', 'expired']);

const moneyTypes = ['none', 'fixed_fee', 'range_or_upper_limit', 'reimbursement', 'reward', 'donation', 'undecided'] as const;
const eventFormats = ['offline', 'online', 'hybrid'] as const;
const updateProposalSchema = z.object({
  proposalId: z.string().uuid(),
  title: z.string().trim().min(1).max(140),
  summary: z.string().trim().min(1).max(5000),
  format: z.enum(eventFormats),
  tentativeStartsAt: z.string().min(1),
  recruitmentDeadlineAt: z.string().optional(),
  publicExpiresAt: z.string().min(1),
  organizerName: z.string().trim().min(1).max(120),
  participationMethod: z.string().trim().min(1).max(2000),
  visibility: z.enum(['public', 'unlisted']),
  moneyType: z.enum(moneyTypes),
  moneyLabel: z.string().trim().max(500),
  moneyAmount: z.string().trim().max(120),
  moneyCurrency: z.string().trim().max(20),
  moneyRecipient: z.string().trim().max(300),
  moneyCollection: z.string().trim().max(500),
  moneySettlement: z.string().trim().max(500),
  moneyRefunds: z.string().trim().max(500),
  moneyChangeTerms: z.string().trim().max(500),
  prohibitedConfirmed: z.literal('on'),
  rightsConfirmed: z.literal('on'),
  moneyConfirmed: z.literal('on'),
  intent: z.enum(['draft', 'publish']),
});

function toJstIso(value: string | undefined) {
  if (!value) return null;
  const withZone = value.includes('T') && !/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? `${value}:00+09:00` : value;
  const date = new Date(withZone);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function collectMoneyDetails(input: z.infer<typeof updateProposalSchema>) {
  const fields = {
    label: input.moneyLabel,
    amount: input.moneyAmount,
    currency: input.moneyCurrency,
    recipient: input.moneyRecipient,
    collection_method: input.moneyCollection,
    settlement: input.moneySettlement,
    refunds: input.moneyRefunds,
    change_terms: input.moneyChangeTerms,
  };
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value.length > 0));
}

export async function setProposalEventStatusAction(formData: FormData) {
  if (!db) return;
  const proposalId = formData.get('proposalId');
  const eventStatus = stateSchema.safeParse(formData.get('eventStatus'));
  if (typeof proposalId !== 'string' || !eventStatus.success) return;
  const member = await requireActiveMember();
  const client = await db.$client.connect();
  let broken = false;
  try {
    await client.query('begin');
    const current = await client.query('select * from proposals where id = $1 and owner_id = $2 for update', [proposalId, member.userId]);
    if (current.rowCount !== 1) {
      await client.query('rollback');
      return;
    }
    // 管理者による緊急非公開(hidden)は、企画者の開催状況操作で上書きさせない。
    if (current.rows[0].status === 'hidden') {
      await client.query('rollback');
      return;
    }
    const status = eventStatus.data === 'completed' ? 'ended' : eventStatus.data === 'cancelled' ? 'cancelled' : current.rows[0].status;
    const updated = await client.query(
      'update proposals set event_status = $1, status = $2 where id = $3 returning *',
      [eventStatus.data, status, proposalId],
    );
    await client.query(
      'insert into proposal_versions (proposal_id, actor_id, reason_code, snapshot) values ($1, $2, $3, $4::jsonb)',
      [proposalId, member.userId, 'organizer_event_status', JSON.stringify(updated.rows[0])],
    );
    await client.query(
      'insert into audit_log (actor_id, entity_type, entity_id, action, before_state, after_state) values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)',
      [member.userId, 'proposal', proposalId, 'organizer_event_status_changed', JSON.stringify(current.rows[0]), JSON.stringify(updated.rows[0])],
    );
    await client.query('commit');
  } catch {
    try {
      await client.query('rollback');
    } catch {
      // rollback に失敗したコネクションはトランザクションが開いたまま残りうる。
      broken = true;
    }
    return;
  } finally {
    client.release(broken);
  }
  redirect(`/member/proposals/${proposalId}`);
}

export async function updateProposalAction(_previousState: ProposalActionState, formData: FormData): Promise<ProposalActionState> {
  if (!db) return { error: '会員・企画基盤が未接続です。時間をおいて再度お試しください。' };
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateProposalSchema.safeParse(raw);
  if (!parsed.success) return { error: '必須項目、日付、金銭条件、3つの掲載確認を確認してください。' };

  const input = parsed.data;
  const tentativeStartsAt = toJstIso(input.tentativeStartsAt);
  const recruitmentDeadlineAt = toJstIso(input.recruitmentDeadlineAt);
  const publicExpiresAt = toJstIso(input.publicExpiresAt);
  if (!tentativeStartsAt || !publicExpiresAt) return { error: '開催候補日時と公開期限を正しく入力してください。' };
  if (input.moneyType === 'none' && !input.moneyLabel) return { error: '金銭がない場合は、金銭条件に「なし」と明記してください。' };
  if (input.moneyType !== 'none' && input.moneyType !== 'undecided' && (!input.moneyAmount || !input.moneyRecipient || !input.moneySettlement)) {
    return { error: '金銭が発生する場合は、金額、支払先、精算方法を入力してください。' };
  }
  if (input.moneyType === 'undecided' && input.intent === 'publish') {
    return { error: '金銭条件が未定のままでは公開できません。下書き保存のみ可能です。' };
  }
  if (input.intent === 'publish' && new Date(publicExpiresAt).valueOf() <= Date.now()) {
    return { error: '公開するには、公開期限を将来の日時に更新してください。' };
  }

  const member = await requireActiveMember();
  const client = await db.$client.connect();
  let broken = false;
  try {
    await client.query('begin');
    const currentTerms = await client.query(
      `select count(*)::integer as count
       from terms_versions tv
       join consents c on c.terms_version_id = tv.id and c.user_id = $1
       where tv.is_current = true`,
      [member.userId],
    );
    if (Number(currentTerms.rows[0]?.count) !== 3) {
      await client.query('rollback');
      return { error: '最新の会員規約・免責事項・プライバシーポリシーへの同意を確認できません。会員情報ページで再同意してください。' };
    }
    const current = await client.query('select * from proposals where id = $1 and owner_id = $2 for update', [input.proposalId, member.userId]);
    if (current.rowCount !== 1) {
      await client.query('rollback');
      return { error: '対象の企画が見つかりません。' };
    }
    if (!EDITABLE_STATUSES.has(current.rows[0].status)) {
      await client.query('rollback');
      return { error: 'この企画は今は編集できません。管理者による措置、終了、または中止となっている企画は編集できません。' };
    }
    // auto_hiddenは「候補日3日前まで開催決定なし」で自動除外された状態。日時を
    // 据え置いたまま再公開すると、次回cron実行で即座に再びauto_hiddenへ戻る。
    if (
      input.intent === 'publish' &&
      current.rows[0].status === 'auto_hidden' &&
      new Date(tentativeStartsAt).valueOf() - Date.now() < 3 * 24 * 60 * 60 * 1000
    ) {
      await client.query('rollback');
      return { error: '再掲載するには、開催候補日を3日より先の日時に更新してください。' };
    }

    const status = input.intent === 'publish' ? 'published' : 'draft';
    const publishedAt = status === 'published' ? current.rows[0].published_at ?? new Date().toISOString() : current.rows[0].published_at;
    const moneyDetails = collectMoneyDetails(input);
    const updated = await client.query(
      `update proposals set title = $1, summary = $2, format = $3, tentative_starts_at = $4,
        recruitment_deadline_at = $5, public_expires_at = $6, organizer_name = $7, participation_method = $8,
        visibility = $9, money_type = $10, money_details = $11::jsonb, status = $12, published_at = $13
       where id = $14 and owner_id = $15 returning *`,
      [
        input.title, input.summary, input.format, tentativeStartsAt, recruitmentDeadlineAt, publicExpiresAt,
        input.organizerName, input.participationMethod, input.visibility, input.moneyType,
        JSON.stringify(moneyDetails), status, publishedAt, input.proposalId, member.userId,
      ],
    );
    const reasonCode = input.intent === 'publish' ? 'organizer_edit_publish' : 'organizer_edit_draft';
    await client.query(
      'insert into proposal_versions (proposal_id, actor_id, reason_code, snapshot) values ($1, $2, $3, $4::jsonb)',
      [input.proposalId, member.userId, reasonCode, JSON.stringify(updated.rows[0])],
    );
    await client.query(
      'insert into audit_log (actor_id, entity_type, entity_id, action, before_state, after_state) values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)',
      [member.userId, 'proposal', input.proposalId, reasonCode, JSON.stringify(current.rows[0]), JSON.stringify(updated.rows[0])],
    );
    await client.query('commit');
  } catch {
    try {
      await client.query('rollback');
    } catch {
      broken = true;
    }
    return { error: '企画を保存できませんでした。ログイン状態と入力内容を確認してください。' };
  } finally {
    client.release(broken);
  }
  redirect(`/member/proposals/${input.proposalId}`);
}
