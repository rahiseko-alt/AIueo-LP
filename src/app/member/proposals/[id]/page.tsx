import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActiveMember } from '@/lib/auth/dal';
import { db } from '@/lib/neon/db';
import { setProposalEventStatusAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function MemberProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireActiveMember();
  const { id } = await params;
  if (!db) notFound();
  const result = await db.$client.query(
    `select id, title, summary, status, event_status, format, tentative_starts_at,
      recruitment_deadline_at, public_expires_at, organizer_name, participation_method,
      visibility, money_type, money_details, updated_at
     from proposals where id = $1 and owner_id = $2 limit 1`,
    [id, member.userId],
  );
  const data = result.rows[0] as Record<string, unknown> | undefined;
  if (!data) notFound();
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-4xl"><Link href="/member" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] hover:text-white">← 会員ページへ</Link><article className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:mt-10 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">YOUR PROPOSAL</p><h1 className="mt-4 text-4xl font-light">{String(data.title)}</h1><div className="mt-5 flex flex-wrap gap-3 text-xs font-mono tracking-[0.1em]"><span className="border border-[#c8a45a]/50 px-3 py-2 text-[#d7bd82]">掲載: {String(data.status)}</span><span className="border border-white/20 px-3 py-2 text-white/70">開催: {String(data.event_status)}</span></div><p className="mt-7 whitespace-pre-line leading-8 text-white/75">{String(data.summary)}</p><dl className="mt-8 grid gap-5 border-t border-white/10 pt-7 sm:grid-cols-2"><div><dt className="form-label">形式</dt><dd className="mt-2">{String(data.format)}</dd></div><div><dt className="form-label">主催者</dt><dd className="mt-2">{String(data.organizer_name)}</dd></div><div><dt className="form-label">候補日時</dt><dd className="mt-2">{data.tentative_starts_at ? new Date(String(data.tentative_starts_at)).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未定'}</dd></div><div><dt className="form-label">公開期限</dt><dd className="mt-2">{data.public_expires_at ? new Date(String(data.public_expires_at)).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未設定'}</dd></div><div className="sm:col-span-2"><dt className="form-label">参加方法</dt><dd className="mt-2 whitespace-pre-line leading-7 text-white/75">{String(data.participation_method)}</dd></div></dl><section className="mt-8 border-t border-white/10 pt-7"><h2 className="text-xl font-light">開催状況を更新</h2><p className="mt-2 text-sm leading-7 text-white/60">開催決定、満席、終了、中止は企画者自身で操作します。中止の場合、参加者がいるなら主催者から説明してください。</p><form action={setProposalEventStatusAction} className="mt-5 flex flex-wrap gap-3"><input type="hidden" name="proposalId" value={String(data.id)} /><button name="eventStatus" value="confirmed" className="btn-ghost">開催決定</button><button name="eventStatus" value="full" className="btn-ghost">参加者満席</button><button name="eventStatus" value="completed" className="btn-ghost">終了</button><button name="eventStatus" value="cancelled" className="btn-ghost">中止</button></form></section><Link href={`/member/proposals/${String(data.id)}/messages`} className="btn-ghost mt-7">管理者とのメッセージ</Link></article></div></main>;
}
