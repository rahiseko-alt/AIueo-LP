import Link from 'next/link';

export function WhoWeAre() {
  return (
    <section id="about" className="section-padding border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[0.65fr_1.35fr] md:gap-14 md:px-10">
        <div className="min-w-0 border-l-2 border-[#c8a45a] pl-5 sm:pl-7">
          <div className="sec-eyebrow">01 / WHO WE ARE</div>
          <p className="mt-4 font-mono text-xs leading-relaxed tracking-[0.08em] text-[#c8a45a] uppercase">
            A place to call people in.
          </p>
        </div>

        <div className="min-w-0">
          <h2 className="sec-title leading-tight text-[#f0ede8]">
            「今度何かやりましょう」を、<br className="hidden sm:inline" />
            「こういうのやるので、一緒にどうですか？」に変える。
          </h2>

          <div className="mt-6 max-w-2xl space-y-4 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.8)] sm:mt-8 sm:text-base">
            <p>名刺交換を重ねるよりも、まず実際の企画やイベントを1つやってみる。</p>
            <p>
              ジャンルは自由です。やりたいことを持ち込む人と、参加したい人が出会い、準備して、実行する。AIueoはその最初の呼びかけを置く場です。
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
            <a href="#philosophy" className="btn-ghost">
              AIueoの使い方 ↓
            </a>
            <Link href="/events" className="btn-solid">
              進行中の企画を見る →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
