'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

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
  if (!isSupabaseConfigured()) return { error: '会員・企画基盤が未接続です。管理者設定後に再度お試しください。' };
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

  const supabase = await createSupabaseServerClient();
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
  const { data: proposalId, error: saveError } = await supabase.rpc('save_proposal', { p_proposal_id: null, p_payload: payload });
  if (saveError || typeof proposalId !== 'string') return { error: '企画を保存できませんでした。ログイン状態と入力内容を確認してください。' };
  if (input.intent === 'publish') {
    const { error: publishError } = await supabase.rpc('publish_proposal', { p_proposal_id: proposalId });
    if (publishError) return { error: '下書きは保存しましたが、公開できませんでした。必須項目と公開期限を確認してください。' };
  }
  redirect(`/member/proposals/${proposalId}`);
}
