export function About() {
  return (
    <section id="about" className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-500">
              11 / Organizer
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              ABOUT
            </h2>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6 md:flex-row md:items-center dark:border-zinc-800 dark:bg-zinc-900/20">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-zinc-950 dark:text-white">
              Kouhei Kosehira / AIueo
            </h3>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              Builder / Organizer / Experimenter
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              新しい技術やアイデアを実践的な場・プロトタイプ・共同企画として具現化し、人と活動をつなげるプラットフォームを運営しています。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <a
                href="https://github.com/rahiseko-alt"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-zinc-950 dark:hover:text-white"
              >
                GitHub
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-zinc-950 dark:hover:text-white"
              >
                X (Twitter)
              </a>
              <a
                href="mailto:rahiseko@gmail.com"
                className="underline hover:text-zinc-950 dark:hover:text-white"
              >
                rahiseko@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
