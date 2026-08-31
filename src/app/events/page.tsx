import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type PublicProposal = { id: string; slug: string; title: string; summary: string; format: string; tentative_starts_at: string | null; organizer_name: string; participation_method: string; visibility: string; money_type: string; money_details: Record<string, string> | null; published_at: string | null };

async function getPublicProposals() {
  if (!isSupabaseConfigured()) return [] as PublicProposal[];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('public_proposals').select('id, slug, title, summary, format, tentative_starts_at, organizer_name, participation_method, visibility, money_type, money_details, published_at').order('tentative_starts_at', { ascending: true });
  return (data ?? []) as PublicProposal[];
}

export default async function EventsPage() {
  const proposals = await getPublicProposals();
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-6xl"><Link href="/" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] hover:text-white">← AIueoへ戻る</Link><header className="mt-8 max-w-2xl sm:mt-12"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">PUBLIC EVENTS</p><h1 className="mt-4 text-4xl font-light sm:text-5xl">進行中の企画</h1><p className="mt-5 leading-8 text-white/75">参加だけなら会員登録は不要です。参加方法や金銭条件は、企画者のページで直接確認してください。</p></header>{proposals.length === 0 ? <section className="mt-10 border border-white/15 bg-[#12110d] p-6 sm:p-10"><p className="text-lg">現在公開中の企画はありません。</p><p className="mt-3 text-sm leading-7 text-white/60">企画が公開されると、ここに一覧表示されます。</p></section> : <div className="mt-10 grid gap-5 md:grid-cols-2">{proposals.map((proposal) => <Link key={proposal.id} href={`/events/${proposal.slug}`} className="group border border-white/15 bg-[#12110d] p-6 transition-colors hover:border-[#c8a45a]"><p className="font-mono text-xs tracking-[0.12em] text-[#c8a45a]">{proposal.format} · {proposal.money_type === 'none' ? '金銭なし' : '金銭条件あり'}</p><h2 className="mt-3 text-2xl font-light group-hover:text-[#d7bd82]">{proposal.title}</h2><p className="mt-3 line-clamp-3 leading-7 text-white/70">{proposal.summary}</p><p className="mt-5 text-sm text-white/55">主催: {proposal.organizer_name}</p></Link>)}</div>}</div></main>;
}
