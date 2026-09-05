'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireActiveMember } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';

const moneyTypes = ['none', 'fixed_fee', 'range_or_upper_limit', 'reimbursement', 'reward', 'donation', 'undecided'] as const;
const eventFormats = ['offline', 'online', 'hybrid'] as const;
const proposalSchema = z.object({
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

export type ProposalActionState = { error: string | null };

function toJstIso(value: string | undefined) {
  if (!value) return null;
  const withZone = value.includes('T') && !/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? `${value}:00+09:00` : value;
  const date = new Date(withZone);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function collectMoneyDetails(input: z.infer<typeof proposalSchema>) {
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

export async function saveProposalAction(_previousState: ProposalActionState, formData: FormData): Promise<ProposalActionState> {
  if (!db) return { error: '会員・企画基盤が未接続です。時間をおいて再度お試しください。' };
  const raw = Object.fromEntries(formData.entries());
  const parsed = proposalSchema.safeParse(raw);
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

  const payload = {
    slug: `proposal-${crypto.randomUUID()}`,
    title: input.title,
    summary: input.summary,
    format: input.format,
    tentative_starts_at: tentativeStartsAt,
    recruitment_deadline_at: recruitmentDeadlineAt,
    public_expires_at: publicExpiresAt,
    organizer_name: input.organizerName,
    participation_method: input.participationMethod,
    visibility: input.visibility,
    money_type: input.moneyType,
    money_details: collectMoneyDetails(input),
    publishing_declarations: { prohibited_confirmed: true, rights_confirmed: true, money_confirmed: true },
  };
  const member = await requireActiveMember();
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
      return { error: '最新の会員規約・免責事項・プライバシーポリシーへの同意を確認できません。会員情報ページで再同意してください。' };
    }
    const status = input.intent === 'publish' ? 'published' : 'draft';
    const inserted = await client.query(
      `insert into proposals (
        owner_id, slug, title, summary, format, tentative_starts_at, recruitment_deadline_at,
        public_expires_at, organizer_name, participation_method, visibility, money_type,
        money_details, publishing_declarations, status, published_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13::jsonb, $14::jsonb, $15, case when $15 = 'published' then now() else null end
      ) returning id`,
      [
        member.userId, payload.slug, payload.title, payload.summary, payload.format,
        payload.tentative_starts_at, payload.recruitment_deadline_at, payload.public_expires_at,
        payload.organizer_name, payload.participation_method, payload.visibility, payload.money_type,
        JSON.stringify(payload.money_details), JSON.stringify(payload.publishing_declarations), status,
      ],
    );
    proposalId = inserted.rows[0]?.id ?? null;
    if (!proposalId) throw new Error('proposal creation failed');
    const snapshot = { ...payload, id: proposalId, owner_id: member.userId, status, event_status: 'planning' };
    await client.query(
      'insert into proposal_versions (proposal_id, actor_id, reason_code, snapshot) values ($1, $2, $3, $4::jsonb)',
      [proposalId, member.userId, input.intent === 'publish' ? 'initial_publish' : 'initial_draft', JSON.stringify(snapshot)],
    );
    await client.query(
      'insert into audit_log (actor_id, entity_type, entity_id, action, after_state) values ($1, $2, $3, $4, $5::jsonb)',
      [member.userId, 'proposal', proposalId, input.intent === 'publish' ? 'proposal_published' : 'proposal_drafted', JSON.stringify(snapshot)],
    );
    await client.query('commit');
  } catch {
    try {
      await client.query('rollback');
    } catch {
      // rollback に失敗したコネクションはトランザクションが開いたまま残りうる。
      broken = true;
    }
    return { error: '企画を保存できませんでした。ログイン状態と入力内容を確認してください。' };
  } finally {
    client.release(broken);
  }
  redirect(`/member/proposals/${proposalId}`);
}
