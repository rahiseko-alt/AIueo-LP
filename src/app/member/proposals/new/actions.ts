'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireActiveMember } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import { echoValues, type ProposalActionState } from '@/lib/proposals/form-values';
import { parseImageUpload } from '@/lib/proposals/image';
import { parseApplicationUrl } from '@/lib/proposals/application-url';
import { parseHeadcount } from '@/lib/proposals/headcount';
import { checkPublishSchedule, combineJstDateTime, defaultPublicExpiry, deriveTitle } from '@/lib/proposals/publish-rules';
import { buildPublishDeclaration } from '@/lib/proposals/publish-declaration';

export type { ProposalActionState } from '@/lib/proposals/form-values';

const paidMoneyTypes = ['fixed_fee', 'range_or_upper_limit', 'reimbursement', 'reward', 'donation', 'undecided'] as const;
const eventFormats = ['offline', 'online', 'hybrid'] as const;

/**
 * 短い登録画面（P40）から来る値。
 *
 * **欠けた値を既定値で補わない。** 補う作りにすると、有料企画の送信から金銭の欄を
 * 抜くだけで「金銭なし」として公開できてしまう。既定値はフォーム側の表示で決め、
 * ここでは送られた値だけを検証する。例外は、本人が「お金のやり取りはない」の
 * ままにした（`hasMoney` が空）ときに「なし」を記録することだけである。
 */
const quickSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  participationMethod: z.string().trim().min(1).max(2000),
  tentativeDate: z.string().min(1),
  tentativeTime: z.string().optional().default(''),
  organizerName: z.string().trim().max(120).optional().default(''),
  format: z.union([z.enum(eventFormats), z.literal('')]).optional().default(''),
  visibility: z.enum(['public', 'unlisted']).optional().default('public'),
  publicExpiresDate: z.string().optional().default(''),
  hasMoney: z.union([z.literal('on'), z.literal('')]),
  intent: z.enum(['draft', 'publish_confirmed', 'publish_planning']),
});

const paidSchema = z.object({
  moneyType: z.enum(paidMoneyTypes),
  moneyLabel: z.string().trim().min(1).max(500),
  moneyAmount: z.string().trim().min(1).max(120),
  moneyRecipient: z.string().trim().min(1).max(300),
  moneySettlement: z.string().trim().min(1).max(500),
  moneyRefunds: z.string().trim().max(500).optional().default(''),
  moneyChangeTerms: z.string().trim().max(500).optional().default(''),
});

export async function saveProposalAction(_previousState: ProposalActionState, formData: FormData): Promise<ProposalActionState> {
  const fail = (error: string): ProposalActionState => ({ error, values: echoValues(formData) });
  if (!db) return fail('会員・企画基盤が未接続です。時間をおいて再度お試しください。');
  const raw = Object.fromEntries(formData.entries());
  const parsed = quickSchema.safeParse(raw);
  if (!parsed.success) return fail('企画の内容・参加方法・開催日を入れてください。');
  const input = parsed.data;

  const title = deriveTitle(input.body);
  if (!title) return fail('1行目に企画名を書いてください。');
  const starts = combineJstDateTime(input.tentativeDate, input.tentativeTime);
  if (!starts) return fail('開催日（と開始時刻）を正しく入れてください。');
  const publicExpiresAt = input.publicExpiresDate
    ? defaultPublicExpiry(input.publicExpiresDate)
    : defaultPublicExpiry(input.tentativeDate);
  if (input.publicExpiresDate && !combineJstDateTime(input.publicExpiresDate)) return fail('公開期限の日付を正しく入れてください。');

  let moneyType: string;
  let moneyDetails: Record<string, string>;
  if (input.hasMoney === 'on') {
    const paid = paidSchema.safeParse(raw);
    if (!paid.success) return fail('お金のやり取りがある場合は、種類・説明・金額・支払先・精算方法を入れてください。');
    moneyType = paid.data.moneyType;
    moneyDetails = Object.fromEntries(Object.entries({
      label: paid.data.moneyLabel,
      amount: paid.data.moneyAmount,
      currency: 'JPY',
      recipient: paid.data.moneyRecipient,
      settlement: paid.data.moneySettlement,
      refunds: paid.data.moneyRefunds,
      change_terms: paid.data.moneyChangeTerms,
    }).filter(([, value]) => value.length > 0));
  } else {
    moneyType = 'none';
    moneyDetails = { label: 'なし' };
  }

  const publishing = input.intent !== 'draft';
  const eventStatus = input.intent === 'publish_confirmed' ? 'confirmed' : 'planning';
  if (publishing && moneyType === 'undecided') return fail('金銭条件が未定のままでは公開できません。下書き保存のみ可能です。');
  if (publishing) {
    const scheduleError = checkPublishSchedule({ startsAt: starts.iso, publicExpiresAt, eventStatus });
    if (scheduleError) return fail(scheduleError);
  }

  const image = parseImageUpload(formData);
  if (image.kind === 'invalid') return fail(image.error);
  // 参加方法にURLだけが書かれていれば、申し込みボタンにも使う。
  const methodLooksLikeUrl = /^https?:\/\/\S+$/.test(input.participationMethod);
  const applicationUrl = parseApplicationUrl(methodLooksLikeUrl ? input.participationMethod : formData.get('applicationUrl'));
  if (!applicationUrl.ok) return fail(applicationUrl.error);
  const headcount = parseHeadcount(formData.get('capacity'), formData.get('participantCount'));
  if (!headcount.ok) return fail(headcount.error);

  const member = await requireActiveMember();
  // 主催者名はフォームから既定値を受け取らない。本人が書き換えたときだけ使い、
  // 空ならサーバーが自分の公開名を入れる（確認文に表示した値と同じ）。
  const organizerName = input.organizerName || member.profile.public_name?.trim() || '';
  if (!organizerName) return fail('主催者名がありません。「詳しく設定する」で主催者名を入れてください。');

  const client = await db.$client.connect();
  let proposalId: string | null = null;
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
      return fail('最新の会員規約・免責事項・プライバシーポリシーへの同意を確認できません。会員情報ページで再同意してください。');
    }
    const status = publishing ? 'published' : 'draft';
    // 確認の記録は公開するときだけ残す。下書き保存は確認とみなさない。
    const declarations = publishing ? buildPublishDeclaration(member.userId, { organizerName, moneyType }) : {};
    const payload = {
      slug: `proposal-${crypto.randomUUID()}`,
      title,
      summary: input.body,
      format: input.format || 'offline',
      format_specified: input.format !== '',
      tentative_starts_at: starts.iso,
      tentative_time_specified: starts.timeSpecified,
      public_expires_at: publicExpiresAt,
      organizer_name: organizerName,
      participation_method: input.participationMethod,
      application_url: applicationUrl.value,
      capacity: headcount.capacity,
      participant_count: headcount.participantCount,
      visibility: input.visibility,
      money_type: moneyType,
      money_details: moneyDetails,
      publishing_declarations: declarations,
      event_status: eventStatus,
    };
    const inserted = await client.query(
      `insert into proposals (
        owner_id, slug, title, summary, format, tentative_starts_at, recruitment_deadline_at,
        public_expires_at, organizer_name, participation_method, visibility, money_type,
        money_details, publishing_declarations, status, published_at,
        image_data, image_mime, image_updated_at, application_url, capacity, participant_count,
        event_status, tentative_time_specified, format_specified
      ) values (
        $1, $2, $3, $4, $5, $6, null, $7, $8, $9, $10, $11,
        $12::jsonb, $13::jsonb, $14, case when $14 = 'published' then now() else null end,
        $15::bytea, $16::text, case when $16::text is null then null else now() end, $17::text,
        $18::integer, $19::integer, $20, $21::boolean, $22::boolean
      ) returning id`,
      [
        member.userId, payload.slug, payload.title, payload.summary, payload.format,
        payload.tentative_starts_at, payload.public_expires_at,
        payload.organizer_name, payload.participation_method, payload.visibility, payload.money_type,
        JSON.stringify(payload.money_details), JSON.stringify(payload.publishing_declarations), status,
        image.kind === 'replace' ? image.data : null,
        image.kind === 'replace' ? image.mime : null,
        applicationUrl.value,
        headcount.capacity,
        headcount.participantCount,
        payload.event_status,
        payload.tentative_time_specified,
        payload.format_specified,
      ],
    );
    proposalId = inserted.rows[0]?.id ?? null;
    if (!proposalId) throw new Error('proposal creation failed');
    // 画像の中身はスナップショットへ入れない。付いているかどうかだけ残す。
    const snapshot = { ...payload, id: proposalId, owner_id: member.userId, status, has_image: image.kind === 'replace' };
    await client.query(
      'insert into proposal_versions (proposal_id, actor_id, reason_code, snapshot) values ($1, $2, $3, $4::jsonb)',
      [proposalId, member.userId, publishing ? 'initial_publish' : 'initial_draft', JSON.stringify(snapshot)],
    );
    await client.query(
      'insert into audit_log (actor_id, entity_type, entity_id, action, after_state) values ($1, $2, $3, $4, $5::jsonb)',
      [member.userId, 'proposal', proposalId, publishing ? 'proposal_published' : 'proposal_drafted', JSON.stringify(snapshot)],
    );
    await client.query('commit');
  } catch (error) {
    console.error('saveProposalAction failed', error instanceof Error ? error.message : 'unknown');
    try {
      await client.query('rollback');
    } catch {
      // rollback に失敗したコネクションはトランザクションが開いたまま残りうる。
      broken = true;
    }
    return fail('企画を保存できませんでした。ログイン状態と入力内容を確認してください。');
  } finally {
    client.release(broken);
  }
  redirect(`/member/proposals/${proposalId}${publishing ? '?published=1' : ''}`);
}
