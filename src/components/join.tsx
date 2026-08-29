import { ArrowRight, Sparkles } from 'lucide-react';

export function Join() {
  const joinOptions = [
    {
      title: 'イベントに参加する',
      description: '次回のハッカソンや勉強会に参加して、一緒に手を動かしてみる。',
      action: 'イベント一覧を見る',
      href: '#next',
    },
    {
      title: '一緒に企画・共催する',
      description: 'テーマを持ち寄り、新しい実験やワークショップを共催する。',
      action: '企画を相談する',
      href: 'mailto:contact@example.com?subject=企画・共催のご相談',
    },
    {
      title: 'プロジェクトに参加する',
      description: '継続中のラボやプロトタイピングにメンバーとして合流する。',
      action: 'プロジェクトを見る',
      href: '#projects',
    },
    {
      title: '会場・リソースを提供する',
      description: '開催スペースやツール・環境などの提供・スポンサー連携。',
      action: '連携を問い合わせる',
      href: 'mailto:contact@example.com?subject=会場・リソース提供について',
    },
  ];

  return (
    <section id="join" className="border-b border-zinc-200 bg-zinc-950 py-20 text-white dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400">
          <Sparkles className="h-4 w-4" />
          <span>09 / Call for Participation</span>
        </div>

        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          JOIN & COLLABORATE
        </h2>
        <p className="mt-4 max-w-2xl text-base text-zinc-400">
          まずは1つの活動から。イベントへの参加、実験の共催、プロジェクトへの合流など、関わり方は自由です。
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {joinOptions.map((opt) => (
            <div
              key={opt.title}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <div>
                <h3 className="text-lg font-bold text-white">{opt.title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                  {opt.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80">
                <a
                  href={opt.href}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <span>{opt.action}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
