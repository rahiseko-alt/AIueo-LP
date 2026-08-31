import Link from 'next/link';
import { requireActiveMember } from '@/lib/auth/dal';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function MemberProposalsPage() {
  const member = await requireActiveMember();
  let proposals: Array<{ id: string; title: string; status: string; event_status: string; updated_at: string }> = [];
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from('proposals').select('id, title, status, event_status, updated_at').eq('owner_id', member.userId).order('updated_at', { ascending: false });
    proposals = (data ?? []) as typeof proposals;
  }
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-4xl"><Link href="/member" className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-[#c8a45a] hover:text-white">← 会員ページへ</Link><header className="mt-8 flex flex-col justify-between gap-5 sm:mt-12 sm:flex-row sm:items-end"><div><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">YOUR PROPOSALS</p><h1 className="mt-4 text-4xl font-light">自分の企画</h1></div><Link href="/member/proposals/new" className="btn-solid">新しい企画</Link></header>{proposals.length === 0 ? <section className="mt-10 border border-white/15 bg-[#12110d] p-6 sm:p-10"><p>まだ企画はありません。</p></section> : <div className="mt-10 grid gap-4">{proposals.map((proposal) => <Link key={proposal.id} href={`/member/proposals/${proposal.id}`} className="border border-white/15 bg-[#12110d] p-5 transition-colors hover:border-[#c8a45a]"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-light">{proposal.title}</h2><span className="font-mono text-xs text-[#d7bd82]">{proposal.status} · {proposal.event_status}</span></div></Link>)}</div>}</div></main>;
}
