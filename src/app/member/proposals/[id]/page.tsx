import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActiveMember } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import { setProposalEventStatusAction, updateProposalAction } from './actions';
import { ProposalForm, type ProposalDefaultValues } from '@/components/proposal-form';

export const dynamic = 'force-dynamic';

// 管理者措置による状態。企画者は編集できず、理由の確認・異議はメッセージで行う。
const LOCKED_STATUS_LABELS: Record<string, string> = {
  hidden: '管理者により非公開',
  ended: '終了',
  cancelled: '中止',
};

function toDatetimeLocal(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return undefined;
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 16);
}

function toProposalDefaults(data: Record<string, unknown>): ProposalDefaultValues {
  const money = (data.money_details && typeof data.money_details === 'object' ? data.money_details : {}) as Record<string, unknown>;
  return {
    title: String(data.title ?? ''),
    summary: String(data.summary ?? ''),
    format: String(data.format ?? ''),
    visibility: String(data.visibility ?? ''),
    tentativeStartsAt: toDatetimeLocal(data.tentative_starts_at),
    recruitmentDeadlineAt: toDatetimeLocal(data.recruitment_deadline_at),
    publicExpiresAt: toDatetimeLocal(data.public_expires_at),
    organizerName: String(data.organizer_name ?? ''),
    participationMethod: String(data.participation_method ?? ''),
    moneyType: String(data.money_type ?? ''),
    moneyLabel: String(money.label ?? ''),
    moneyAmount: String(money.amount ?? ''),
    moneyCurrency: String(money.currency ?? ''),
    moneyRecipient: String(money.recipient ?? ''),
    moneyCollection: String(money.collection_method ?? ''),
    moneySettlement: String(money.settlement ?? ''),
    moneyRefunds: String(money.refunds ?? ''),
    moneyChangeTerms: String(money.change_terms ?? ''),
  };
}

export default async function MemberProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireActiveMember();
  const { id } = await params;
  if (!db) notFound();
  const result = await db.$client.query(
    `select id, slug, owner_id, title, summary, status, event_status, format, tentative_starts_at,
      recruitment_deadline_at, public_expires_at, organizer_name, participation_method,
      visibility, money_type, money_details, published_at, updated_at
     from proposals where id = $1 and owner_id = $2 limit 1`,
    [id, member.userId],
  );
  const data = result.rows[0] as Record<string, unknown> | undefined;
  if (!data) notFound();

  const status = String(data.status);
  const lockedLabel = LOCKED_STATUS_LABELS[status];

  let lockedReason: { reason_text: string; created_at: string } | undefined;
  if (lockedLabel && db) {
    const reasonResult = await db.$client.query(
      `select reason_text, created_at from moderation_actions
       where target_type = 'proposal' and target_id = $1 and action = 'admin_proposal_state_changed'
       order by created_at desc limit 1`,
      [String(data.id)],
    );
    lockedReason = reasonResult.rows[0] as { reason_text: string; created_at: string } | undefined;
  }

  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-4xl"><Link href="/member" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] hover:text-white">← 会員ページへ</Link><article className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:mt-10 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">YOUR PROPOSAL</p><h1 className="mt-4 text-4xl font-light">{String(data.title)}</h1><div className="mt-5 flex flex-wrap gap-3 text-xs font-mono tracking-[0.1em]"><span className="border border-[#c8a45a]/50 px-3 py-2 text-[#d7bd82]">掲載: {status}</span><span className="border border-white/20 px-3 py-2 text-white/70">開催: {String(data.event_status)}</span></div>{lockedLabel ? <section className="mt-8 border-t border-white/10 pt-7"><p className="text-sm leading-7 text-white/70">この企画は現在「{lockedLabel}」のため、内容を編集できません。{lockedReason ? <>理由: {lockedReason.reason_text}（{new Date(lockedReason.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}）</> : null} さらに確認したいことや異議は下の「管理者とのメッセージ」からお問い合わせください。</p></section> : <ProposalForm action={updateProposalAction} defaultValues={toProposalDefaults(data)} proposalId={String(data.id)} />}<section className="mt-8 border-t border-white/10 pt-7"><h2 className="text-xl font-light">開催状況を更新</h2><p className="mt-2 text-sm leading-7 text-white/60">開催決定、満席、終了、中止は企画者自身で操作します。中止の場合、参加者がいるなら主催者から説明してください。</p><form action={setProposalEventStatusAction} className="mt-5 flex flex-wrap gap-3"><input type="hidden" name="proposalId" value={String(data.id)} /><button name="eventStatus" value="confirmed" className="btn-ghost">開催決定</button><button name="eventStatus" value="full" className="btn-ghost">参加者満席</button><button name="eventStatus" value="completed" className="btn-ghost">終了</button><button name="eventStatus" value="cancelled" className="btn-ghost">中止</button></form></section><Link href={`/member/proposals/${String(data.id)}/messages`} className="btn-ghost mt-7">管理者とのメッセージ</Link></article></div></main>;
}
