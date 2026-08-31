import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) notFound();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('public_proposals').select('id, slug, title, summary, format, tentative_starts_at, recruitment_deadline_at, organizer_name, participation_method, visibility, money_type, money_details, published_at').eq('slug', slug).maybeSingle();
  if (!data) notFound();
  return <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10"><div className="mx-auto max-w-3xl"><Link href="/events" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] hover:text-white">← 企画一覧へ</Link><article className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:mt-10 sm:p-10"><p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">EVENT DETAIL</p><h1 className="mt-4 text-4xl font-light sm:text-5xl">{data.title}</h1><p className="mt-6 whitespace-pre-line leading-8 text-white/78">{data.summary}</p><dl className="mt-8 grid gap-5 border-t border-white/10 pt-7 sm:grid-cols-2"><div><dt className="form-label">開催形式</dt><dd className="mt-2">{data.format}</dd></div><div><dt className="form-label">主催者</dt><dd className="mt-2">{data.organizer_name}</dd></div><div><dt className="form-label">候補日時</dt><dd className="mt-2">{data.tentative_starts_at ? new Date(data.tentative_starts_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未定'}</dd></div><div><dt className="form-label">金銭条件</dt><dd className="mt-2">{data.money_type === 'none' ? 'なし' : JSON.stringify(data.money_details ?? {})}</dd></div><div className="sm:col-span-2"><dt className="form-label">参加方法</dt><dd className="mt-2 whitespace-pre-line leading-7 text-white/75">{data.participation_method}</dd></div></dl><p className="mt-8 border-l-2 border-[#c8a45a] pl-4 text-sm leading-7 text-white/60">AIueoは企画の主催者・参加者・決済者ではありません。参加前に主催者へ内容を直接確認し、自己責任で参加してください。</p></article></div></main>;
}
