export function ArchiveTimeline() {
  const archives = [
    { date: '2026.08', title: 'Generative UI 実践ワークショップ', tag: 'WORKSHOP' },
    { date: '2026.07', title: 'AI同盟 Meetup #03 — 自作AIツール披露会', tag: 'MEETUP' },
    { date: '2026.06', title: 'プロンプト検証合宿 2026 夏', tag: 'LAB' },
    { date: '2026.05', title: 'AIエージェント自律タスク検証スプリント', tag: 'SPRINT' },
    { date: '2026.04', title: '草AIチーム「AIueo」発足記念ハッカソン', tag: 'ALLIANCE' },
  ];

  return (
    <section id="archive" className="border-b border-[rgba(240,237,232,0.08)] bg-[#080808] py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[rgba(240,237,232,0.08)] pb-6">
          <div>
            <div className="sec-eyebrow">08 / TIMELINE DATABASE</div>
            <h2 className="sec-title text-[#f0ede8]">Archive</h2>
          </div>
          <span className="font-mono text-xs text-[rgba(240,237,232,0.5)]">
            RECORD LOG
          </span>
        </div>

        <div className="mt-8 divide-y divide-[rgba(240,237,232,0.08)]">
          {archives.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col py-4 transition hover:bg-[#0e0e0e]/50 sm:flex-row sm:items-center sm:justify-between sm:px-4"
            >
              <div className="flex items-center gap-6">
                <span className="font-mono text-sm font-semibold tracking-wider text-[#c8a45a]">
                  {item.date}
                </span>
                <span className="font-sans text-base font-normal text-[#f0ede8]">
                  {item.title}
                </span>
              </div>
              <div className="mt-2 sm:mt-0">
                <span className="rounded border border-[rgba(240,237,232,0.1)] bg-[#141414] px-2.5 py-0.5 font-mono text-[10px] tracking-wider text-[rgba(240,237,232,0.6)]">
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
