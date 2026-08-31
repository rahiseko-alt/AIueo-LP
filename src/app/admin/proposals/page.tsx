import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/dal';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminProposalsPage() {
  await requireAdmin();
  let proposals: Array<{ id: string; title: string; status: string; event_status: string; owner_id: string; updated_at: string }> = [];
  if (isSupabaseConfigured()) { const supabase = await createSupabaseServerClient(); const { data } = await supabase.from('proposals').select('id, title, status, event_status, owner_id, updated_at').order('updated_at', { ascending: false }); proposals = (data ?? []) as typeof proposals; }
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-6xl"><Link href="/admin" className="inline-flex min-h-11 items-center font-mono text-xs tracking-[0.16em] text-[#c8a45a] hover:text-white">← 管理画面</Link><header className="mt-8 sm:mt-12"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">ALL PROPOSALS</p><h1 className="mt-4 text-4xl font-light">企画管理</h1></header>{proposals.length === 0 ? <section className="mt-10 border border-white/15 bg-[#12110d] p-6">企画はまだありません。</section> : <div className="mt-10 grid gap-4">{proposals.map((proposal) => <Link key={proposal.id} href={`/admin/proposals/${proposal.id}`} className="border border-white/15 bg-[#12110d] p-5 transition-colors hover:border-[#c8a45a]"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-light">{proposal.title}</h2><span className="font-mono text-xs text-[#d7bd82]">{proposal.status} · {proposal.event_status}</span></div><p className="mt-3 text-xs text-white/50">owner: {proposal.owner_id}</p></Link>)}</div>}</div></main>;
}
