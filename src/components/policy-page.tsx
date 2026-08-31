import Link from 'next/link';
import type { TermsDocumentKey } from '@/lib/terms-content';
import { termsDocuments } from '@/lib/terms-content';

export function PolicyPage({ document }: { document: TermsDocumentKey }) {
  const content = termsDocuments[document];

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] transition-colors hover:text-white">
          ← AIueoへ戻る
        </Link>
        <article className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:mt-10 sm:p-10">
          <p className="font-mono text-xs font-semibold tracking-[0.22em] text-[#c8a45a]">{content.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">{content.title}</h1>
          <p className="mt-5 leading-8 text-[rgba(240,237,232,0.78)]">{content.summary}</p>
          <p className="mt-5 border-l-2 border-[#c8a45a] pl-4 text-sm leading-7 text-[rgba(240,237,232,0.62)]">この文書はサービス公開前の運用案です。正式な公開・会員登録開始前に、保持期間を含めた最終確認を行います。</p>
          <div className="mt-10 space-y-8">
            {content.sections.map(([heading, body], index) => (
              <section key={heading}>
                <p className="font-mono text-xs tracking-[0.15em] text-[#c8a45a]">{String(index + 1).padStart(2, '0')}</p>
                <h2 className="mt-2 text-xl font-medium">{heading}</h2>
                <p className="mt-3 whitespace-pre-line leading-8 text-[rgba(240,237,232,0.75)]">{body}</p>
              </section>
            ))}
          </div>
        </article>
        <nav aria-label="関連文書" className="mt-8 flex flex-wrap gap-4 font-mono text-xs tracking-[0.1em] text-[#c8a45a]">
          <Link className="min-h-11 content-center hover:text-white" href="/terms">会員規約</Link>
          <Link className="min-h-11 content-center hover:text-white" href="/disclaimer">免責事項</Link>
          <Link className="min-h-11 content-center hover:text-white" href="/privacy">プライバシー</Link>
          <Link className="min-h-11 content-center hover:text-white" href="/contact">お問い合わせ</Link>
        </nav>
      </div>
    </main>
  );
}
