import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import { sendAdminMessageAction } from '@/app/admin/actions';
import { AdminNotice } from '@/components/admin-notice';

export const dynamic = 'force-dynamic';

export default async function AdminProposalMessagesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin(); const { id } = await params; const { error } = await searchParams; if (!db) return <main className="min-h-screen bg-[#080808] p-8 text-[#f0ede8]">データベース接続後に利用できます。</main>;
  const proposalResult = await db.$client.query('select id, title from proposals where id = $1 limit 1', [id]); const proposal = proposalResult.rows[0] as { id: string; title: string } | undefined; if (!proposal) return <main className="min-h-screen bg-[#080808] p-8 text-[#f0ede8]">企画が見つかりません。</main>;
  const messageResult = await db.$client.query('select id, sender_id, body, created_at from proposal_messages where proposal_id = $1 order by created_at asc', [id]); const messages = messageResult.rows as Array<{ id: string; sender_id: string; body: string; created_at: string }>;
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-3xl"><Link href={`/admin/proposals/${id}`} className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-[#c8a45a] hover:text-white">← 企画へ戻る</Link><section className="mt-8 border border-white/15 bg-[#12110d] p-6 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">PRIVATE THREAD</p><h1 className="mt-4 text-3xl font-light">{proposal.title}</h1><AdminNotice code={error} /><div className="mt-8 space-y-4">{messages.length === 0 ? <p className="text-sm text-white/55">まだメッセージはありません。</p> : messages.map((message) => <article key={message.id} className="border border-white/10 bg-black/20 p-4"><p className="font-mono text-[10px] text-white/40">{message.sender_id} · {new Date(message.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p><p className="mt-2 whitespace-pre-line leading-7 text-white/80">{message.body}</p></article>)}</div><form action={sendAdminMessageAction} className="mt-8 border-t border-white/10 pt-6"><input type="hidden" name="proposalId" value={id} /><label><span className="form-label">メッセージ</span><textarea name="body" required maxLength={5000} rows={5} className="form-control" /></label><button className="btn-solid mt-4 w-full">送信する</button></form></section></div></main>;
}
