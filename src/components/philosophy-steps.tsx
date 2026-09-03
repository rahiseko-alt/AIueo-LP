export function PhilosophySteps() {
  const flows = [
    {
      title: 'AIueoの使い方',
      label: 'WITH AIUEO',
      featured: true,
      steps: [
        'やりたい事をAIueoに掲載',
        '準備を進める',
        '参加者含めて準備が出来たら実行',
      ],
    },
    {
      title: '通常の行動',
      label: 'STANDARD FLOW',
      featured: false,
      steps: [
        '企画を具体化する',
        '準備を進める',
        '告知する',
        '実行',
      ],
    },
  ];

  return (
    <section
      id="philosophy"
      className="section-padding border-b border-[rgba(240,237,232,0.08)] bg-[#070707]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="max-w-2xl">
          <div className="sec-eyebrow">HOW IT WORKS</div>
          <h2 className="sec-title text-[#f0ede8]">
            やりたいことを、実行まで。
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-2 md:gap-6 lg:mt-16">
          {flows.map((flow) => (
            <div
              key={flow.title}
              className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 lg:p-10 ${
                flow.featured
                  ? 'border-[rgba(200,164,90,0.42)] bg-[linear-gradient(145deg,#17140d_0%,#0e0e0e_58%)] shadow-[0_20px_60px_rgba(0,0,0,0.32)]'
                  : 'border-[rgba(240,237,232,0.08)] bg-[#0e0e0e]'
              }`}
            >
              {flow.featured && (
                <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[rgba(200,164,90,0.1)] blur-3xl" />
              )}

              <div className="relative">
                <span
                  className={`font-mono text-[10px] font-semibold tracking-[0.2em] sm:text-xs ${
                    flow.featured
                      ? 'text-[#c8a45a]'
                      : 'text-[rgba(240,237,232,0.42)]'
                  }`}
                >
                  {flow.label}
                </span>
                <h3 className="mt-3 font-sans text-xl font-medium tracking-tight text-[#f0ede8] sm:text-2xl">
                  {flow.title}
                </h3>

                <ol className="mt-7 space-y-0 sm:mt-9">
                  {flow.steps.map((step, index) => (
                    <li
                      key={step}
                      className="relative flex min-h-16 items-start gap-4 pb-5 last:min-h-0 last:pb-0 sm:gap-5 sm:pb-6"
                    >
                      {index < flow.steps.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={`absolute left-[17px] top-9 h-[calc(100%-2rem)] w-px sm:left-[19px] ${
                            flow.featured
                              ? 'bg-[rgba(200,164,90,0.28)]'
                              : 'bg-[rgba(240,237,232,0.12)]'
                          }`}
                        />
                      )}
                      <span
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-sm sm:h-10 sm:w-10 ${
                          flow.featured
                            ? 'border-[#c8a45a] bg-[#c8a45a] text-[#080808]'
                            : 'border-[rgba(240,237,232,0.18)] bg-[#141414] text-[rgba(240,237,232,0.68)]'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <p className="pt-1.5 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.82)] sm:pt-2 sm:text-base">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
