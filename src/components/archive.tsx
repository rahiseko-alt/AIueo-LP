export function Archive() {
  const archiveItems = [
    { year: '2026', month: '08', title: 'AI活用型デザインシステム構築ワークショップ', tag: 'WORKSHOP' },
    { year: '2026', month: '07', title: 'コミュニティ主導型 Web3/AI 勉強会 #08', tag: 'MEETUP' },
    { year: '2026', month: '06', title: 'オープンソースUIキット共同リリース', tag: 'PROJECT' },
    { year: '2026', month: '05', title: 'Next.js & Generative UI 実装実験ゼミ', tag: 'LAB' },
    { year: '2026', month: '04', title: 'Tokyo Tech Spring Hackathon 運営協力', tag: 'COMMUNITY' },
  ];

  return (
    <section id="archive" className="border-b border-zinc-200 py-16 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-500">
              10 / Timeline
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              ARCHIVE
            </h2>
          </div>
          <span className="font-mono text-xs text-zinc-500">LOG DATABASE</span>
        </div>

        <div className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {archiveItems.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-semibold text-zinc-400">
                  {item.year}.{item.month}
                </span>
                <span className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </span>
              </div>
              <div className="mt-2 sm:mt-0">
                <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
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
