import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/neon/db';
import { ReportForm } from '@/components/report-form';

export const dynamic = 'force-dynamic';

// 通報ページは検索結果にもSNSカードにも出さない。企画そのものの窓口であって、
// 見つけて読むためのページではない。
export const metadata: Metadata = { title: '管理者へ連絡', robots: { index: false, follow: false } };

/**
 * 掲載内容を管理者へ知らせる画面。
 *
 * 企画詳細ページに直接置いていたものを、1階層下げてこのページへ移した。
 * 詳細ページでは通報の入力欄が企画本文より目立ち、ページ全体が通報のための
 * ページに見えていたためである。企画詳細からは「管理者へ連絡」ボタンだけを
 * 出し、押した人だけがここへ来る。
 */
export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!db) notFound();
  // 企画詳細ページと同じ絞り込み条件で引く。条件を緩めると、下書きや期限切れの
  // 企画名がこのページから漏れる。
  const result = await db.$client.query(
    `select id, slug, title from proposals
     where slug = $1 and status = 'published' and visibility = 'public' and public_expires_at > now()
     limit 1`,
    [slug],
  );
  const proposal = result.rows[0] as { id: string; slug: string; title: string } | undefined;
  if (!proposal) notFound();

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10">
      <div className="mx-auto max-w-2xl">
        <nav aria-label="現在地" className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a]">
          <Link href="/events" className="inline-flex min-h-11 items-center hover:text-white">企画一覧</Link>
          <span aria-hidden className="text-white/30">/</span>
          <Link href={`/events/${proposal.slug}`} className="inline-flex min-h-11 items-center hover:text-white">この企画</Link>
          <span aria-hidden className="text-white/30">/</span>
          <span className="text-white/55">管理者へ連絡</span>
        </nav>

        <section className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:mt-10 sm:p-10">
          <p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">REPORT</p>
          <h1 className="mt-4 text-3xl font-light sm:text-4xl">管理者へ連絡</h1>
          <p className="mt-4 text-sm leading-7 text-white/70">
            対象の企画: <span className="text-[#e4d2a6]">{proposal.title}</span>
          </p>
          <p className="mt-5 leading-8 text-white/75">
            危険・違法・禁止事項の疑いがある掲載を、運営へ知らせるための窓口です。
            会員登録は要りません。内容を確認し、必要があれば掲載をただちに止めます。
          </p>
          <p className="mt-5 border-l-2 border-[#c8a45a] pl-4 text-sm leading-7 text-white/70">
            <strong className="font-normal text-[#e4d2a6]">緊急時は、まず警察・救急へ連絡してください。</strong>
            このページは通報を受け付けるだけで、その場の危険を止めるものではありません。
          </p>

          <ReportForm proposalId={proposal.id} slug={proposal.slug} />

          <p className="mt-8 border-t border-white/10 pt-6 text-sm leading-7 text-white/55">
            掲載内容についてではないお問い合わせは <Link href="/contact" className="text-[#d7bd82] underline">問い合わせページ</Link> をご利用ください。
          </p>
        </section>

        <div className="mt-8">
          <Link href={`/events/${proposal.slug}`} className="btn-ghost">送らずに企画へ戻る</Link>
        </div>
      </div>
    </main>
  );
}
