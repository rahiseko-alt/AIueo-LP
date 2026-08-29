import { Sparkles, MessageSquare, Code2, Users, ArrowUpRight, PlusCircle } from 'lucide-react';

export function JoinSection() {
  const options = [
    {
      icon: <PlusCircle className="h-5 w-5 text-[#c8a45a]" />,
      title: '「こういうのやりたい！」企画を持ち込む',
      description: '主婦向け講座、子ども向け教室、勉強会、開発企画など、自分のやりたい企画を同盟に提案・募集。',
      action: '企画を提案する',
      href: 'mailto:rahiseko@gmail.com?subject=【AIueo】新しい企画・イベントの持ち込み',
    },
    {
      icon: <Users className="h-5 w-5 text-[#c8a45a]" />,
      title: '進行中の企画に助っ人・参加する',
      description: '受託案件の開発チーム、セミナーのアシスタント、LT登壇など、具体的な活動に合流。',
      action: '企画一覧を見る',
      href: '#events',
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-[#c8a45a]" />,
      title: 'Discordで企画の壁打ち・仲間集め',
      description: '「こんな企画考えてるんだけど誰か興味ある？」を気軽に投げて相談できるオンライン同盟。',
      action: 'Discordに参加',
      href: 'https://discord.com',
    },
    {
      icon: <Sparkles className="h-5 w-5 text-[#c8a45a]" />,
      title: '会場・機材・案件を提供する',
      description: '公民館、コワーキング、店舗の会場提供や、AI開発の相談・依頼はこちらから。',
      action: '連携・相談する',
      href: 'mailto:rahiseko@gmail.com?subject=【AIueo】会場・リソース提供のご相談',
    },
  ];

  return (
    <section id="join" className="relative border-b border-[rgba(240,237,232,0.08)] bg-[#050505] py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-[radial-gradient(ellipse,rgba(200,164,90,0.06)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <div className="max-w-2xl">
          <div className="sec-eyebrow">07 / CO-CREATION & ALLIANCE</div>
          <h2 className="sec-title text-[#f0ede8]">
            「こういうのやるんですけど、一緒にどうですか？」
          </h2>
          <p className="mt-4 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.75)] sm:text-base">
            誰かの企画に乗っかるもよし、自分の「やりたい」を立ち上げて仲間を巻き込むもよし。
            AI League AIueo は、具体的な行動と共創が生まれるプラットフォームです。
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {options.map((opt) => (
            <div
              key={opt.title}
              className="flex flex-col justify-between rounded-2xl border border-[rgba(240,237,232,0.08)] bg-[#0d0d0d] p-7 transition hover:border-[#c8a45a] hover:bg-[#121212]"
            >
              <div>
                <div className="mb-4 inline-flex rounded-lg border border-[rgba(200,164,90,0.2)] bg-[rgba(200,164,90,0.05)] p-2.5">
                  {opt.icon}
                </div>
                <h3 className="font-sans text-lg font-medium text-[#f0ede8]">
                  {opt.title}
                </h3>
                <p className="mt-2.5 font-sans text-xs font-light leading-relaxed text-[rgba(240,237,232,0.65)]">
                  {opt.description}
                </p>
              </div>

              <div className="mt-8 border-t border-[rgba(240,237,232,0.08)] pt-4">
                <a
                  href={opt.href}
                  className="inline-flex items-center gap-1 font-mono text-xs font-semibold tracking-wider text-[#c8a45a] hover:underline"
                >
                  <span>{opt.action}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
