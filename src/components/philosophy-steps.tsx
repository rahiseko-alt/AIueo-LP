export function PhilosophySteps() {
  const phases = [
    {
      num: '0 → 1',
      keyword: 'TRY',
      subtitle: '最初の1を、一緒につくる。',
      lines: [
        'まだやったことがなくてもいい。',
        'イベント、企画、制作。',
        'まず一度、誰かと何かをやってみる。',
      ],
    },
    {
      num: '1 → 1',
      keyword: 'PASS',
      subtitle: 'あなたの1を、誰かの1に。',
      lines: [
        '自分が経験したことを、',
        '次はまだ経験していない誰かとやってみる。',
        'ひとつの経験が、次の経験をつくる。',
      ],
    },
    {
      num: '2 × 2',
      keyword: 'COLLABORATE',
      subtitle: '1が増えたら、掛け合わせる。',
      lines: [
        '経験のある人どうしで、',
        'それぞれの得意なことを持ち寄る。',
        '一人ではできなかった企画を、一緒につくる。',
      ],
    },
  ];

  return (
    <section id="philosophy" className="border-b border-[rgba(240,237,232,0.08)] bg-[#070707] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="max-w-xl">
          <div className="sec-eyebrow">THE 3 PHASES</div>
          <h2 className="sec-title text-[#f0ede8]">
            活動が生まれる、3つの段階。
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {phases.map((phase) => (
            <div
              key={phase.num}
              className="group relative flex flex-col justify-between rounded-2xl border border-[rgba(240,237,232,0.08)] bg-[#0e0e0e] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#c8a45a] hover:bg-[#121212] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[rgba(240,237,232,0.08)] pb-4">
                  <span className="font-mono text-3xl font-light tracking-tight text-[#c8a45a] sm:text-4xl">
                    {phase.num}
                  </span>
                  <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[rgba(240,237,232,0.5)] group-hover:text-[#c8a45a]">
                    {phase.keyword}
                  </span>
                </div>

                <h3 className="mt-6 font-sans text-lg font-medium text-[#f0ede8]">
                  {phase.subtitle}
                </h3>

                <div className="mt-4 space-y-1 font-sans text-xs font-light leading-relaxed text-[rgba(240,237,232,0.7)] sm:text-sm">
                  {phase.lines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
