import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] uppercase transition-colors hover:text-[#f0ede8]"
        >
          ← AIueoへ戻る
        </Link>

        <section className="mt-10 border border-[rgba(200,164,90,0.4)] bg-[rgba(200,164,90,0.06)] p-6 sm:mt-14 sm:p-10">
          <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#c8a45a] uppercase">Contact</p>
          <h1 className="mt-4 font-sans text-3xl font-medium tracking-tight text-[#f0ede8] sm:text-5xl">お問い合わせ</h1>
          <p className="mt-5 max-w-xl font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.72)] sm:text-base">
            AIueoについてのご連絡、企画掲載に関するご相談、掲載内容のご連絡は以下のアドレスへお願いします。
          </p>

          <a
            href="mailto:info@kouheikosehira.com"
            className="mt-8 block break-all font-mono text-xl font-semibold tracking-tight text-[#f0ede8] underline decoration-[#c8a45a] decoration-2 underline-offset-8 transition-colors hover:text-[#c8a45a] sm:text-2xl"
          >
            info@kouheikosehira.com
          </a>
        </section>
      </div>
    </main>
  );
}
