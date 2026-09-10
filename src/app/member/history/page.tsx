import Link from 'next/link';
import { eventStatusLabel, proposalStatusLabel } from '@/lib/proposals/labels';
import { getAuthContext } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';

export const dynamic = 'force-dynamic';

type ProposalRow = { id: string; title: string; status: string; event_status: string; updated_at: string };
type MessageRow = { proposal_id: string; sender_id: string; body: string; created_at: string };
type ConsentRow = { document_type: string; version: string; accepted_at: string };
type ModerationReasonRow = { target_id: string; reason_text: string; created_at: string };

const LOCKED_STATUSES = new Set(['hidden', 'ended', 'cancelled']);

const DOCUMENT_LABELS: Record<string, string> = { terms: '会員規約', disclaimer: '免責事項', privacy: 'プライバシーポリシー' };

function formatDate(value: string) {
  return new Date(value).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

export default async function MemberHistoryPage() {
  const context = await getAuthContext();
  if (context.kind !== 'member') return <main className="min-h-screen bg-[#080808] p-8 text-[#f0ede8]"><Link href="/register" className="text-[#c8a45a] hover:text-white">ログインして履歴を見る →</Link></main>;

  const member = context;
  const isActive = member.profile.status === 'active';

  let proposals: ProposalRow[] = [];
  let messagesByProposal = new Map<string, MessageRow[]>();
  let consents: ConsentRow[] = [];
  const reasonByProposal = new Map<string, ModerationReasonRow>();

  if (db) {
    const proposalsResult = await db.$client.query(
      'select id, title, status, event_status, updated_at from proposals where owner_id = $1 order by updated_at desc',
      [member.userId],
    );
    proposals = proposalsResult.rows as ProposalRow[];

    if (proposals.length > 0) {
      const messagesResult = await db.$client.query(
        'select proposal_id, sender_id, body, created_at from proposal_messages where proposal_id = any($1::uuid[]) order by created_at asc',
        [proposals.map((proposal) => proposal.id)],
      );
      messagesByProposal = new Map();
      for (const message of messagesResult.rows as MessageRow[]) {
        const list = messagesByProposal.get(message.proposal_id) ?? [];
        list.push(message);
        messagesByProposal.set(message.proposal_id, list);
      }

      const lockedIds = proposals.filter((proposal) => LOCKED_STATUSES.has(proposal.status)).map((proposal) => proposal.id);
      if (lockedIds.length > 0) {
        const reasonResult = await db.$client.query(
          `select target_id, reason_text, created_at from moderation_actions
           where target_type = 'proposal' and target_id = any($1::text[]) and action = 'admin_proposal_state_changed'
           order by created_at desc`,
          [lockedIds],
        );
        for (const row of reasonResult.rows as ModerationReasonRow[]) {
          if (!reasonByProposal.has(row.target_id)) reasonByProposal.set(row.target_id, row);
        }
      }
    }

    const consentsResult = await db.$client.query(
      `select tv.document_type, tv.version, c.accepted_at
       from consents c join terms_versions tv on tv.id = c.terms_version_id
       where c.user_id = $1 order by c.accepted_at desc`,
      [member.userId],
    );
    consents = consentsResult.rows as ConsentRow[];
  }

  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-3xl"><Link href="/member/profile" className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-[#c8a45a] hover:text-white">← プロフィールへ</Link><section className="mt-8 border border-white/15 bg-[#12110d] p-6 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">READ-ONLY HISTORY</p><h1 className="mt-4 text-4xl font-light">企画とメッセージ</h1><p className="mt-4 leading-8 text-white/75">停止・退会後も、自分の企画、管理者とのメッセージ、同意履歴を読み返せます。{!isActive && '会員が停止・退会中のため、この画面は閲覧のみです。'}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/contact" className="btn-ghost">異議・お問い合わせ</Link><Link href="/terms" className="btn-ghost">規約を確認</Link></div></section>

    <section className="mt-8 border border-white/15 bg-[#12110d] p-6 sm:p-10">
      <h2 className="text-2xl font-light">自分の企画</h2>
      {proposals.length === 0 ? <p className="mt-4 text-sm text-white/60">企画はまだありません。</p> : <div className="mt-6 space-y-6">
        {proposals.map((proposal) => {
          const messages = messagesByProposal.get(proposal.id) ?? [];
          const reason = reasonByProposal.get(proposal.id);
          return <article key={proposal.id} className="border border-white/10 bg-black/20 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              {isActive ? <Link href={`/member/proposals/${proposal.id}`} className="text-lg font-medium text-[#d7bd82] hover:text-white">{proposal.title}</Link> : <span className="text-lg font-medium">{proposal.title}</span>}
              <span className="font-mono text-xs text-white/50">最終更新 {formatDate(proposal.updated_at)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-mono tracking-[0.1em] text-white/60">
              <span>掲載: {proposalStatusLabel(proposal.status)}</span>
              <span>開催: {eventStatusLabel(proposal.event_status)}</span>
            </div>
            {reason && <p className="mt-2 text-sm leading-6 text-white/70">理由: {reason.reason_text}（{formatDate(reason.created_at)}）</p>}
            {messages.length > 0 && <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <p className="font-mono text-[10px] tracking-[0.15em] text-white/40">管理者とのメッセージ</p>
              {messages.map((message, index) => <div key={index} className="border border-white/10 bg-black/20 p-3 text-sm"><p className="font-mono text-[10px] text-white/40">{message.sender_id === member.userId ? 'あなた' : '管理者'} · {formatDate(message.created_at)}</p><p className="mt-1 whitespace-pre-line leading-6 text-white/80">{message.body}</p></div>)}
            </div>}
          </article>;
        })}
      </div>}
    </section>

    <section className="mt-8 border border-white/15 bg-[#12110d] p-6 sm:p-10">
      <h2 className="text-2xl font-light">同意履歴</h2>
      {consents.length === 0 ? <p className="mt-4 text-sm text-white/60">同意の記録はありません。</p> : <ul className="mt-4 space-y-2 text-sm text-white/75">
        {consents.map((consent, index) => <li key={index}>{DOCUMENT_LABELS[consent.document_type] ?? consent.document_type}（{consent.version}）に {formatDate(consent.accepted_at)} 同意</li>)}
      </ul>}
    </section>
  </div></main>;
}
