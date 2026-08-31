import { Sparkles, MessageSquare, Users, ArrowUpRight, PlusCircle } from 'lucide-react';

export function JoinSection() {
  const options = [
    {
      icon: <PlusCircle className="h-5 w-5 text-[#c8a45a]" />,
      title: '「こういうのやりたい！」企画を持ち込む',
      description: '主婦向け講座、子ども向け教室、勉強会、開発企画など、自分のやりたい企画を同盟に提案・募集。',
      action: '企画を提案する',
      href: '/contact',
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
      title: '企画の壁打ち・仲間集めを相談する',
      description: '「こんな企画を考えている」を、まずAIueoへ気軽に相談できます。',
      action: '相談する',
      href: '/contact',
    },
    {
      icon: <Sparkles className="h-5 w-5 text-[#c8a45a]" />,
      title: '会場・機材・案件を提供する',
      description: '公民館、コワーキング、店舗の会場提供や、AI開発の相談・依頼はこちらから。',
      action: '連携・相談する',
      href: '/contact',
    },
  ];

  return (
    <section id="join" className="section-padding relative overflow-hidden border-b border-[rgba(240,237,232,0.08)] bg-[#050505]">
      {/* Background glow (contained) */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] sm:h-[500px] w-[90vw] max-w-[800px] rounded-full bg-[radial-gradient(ellipse,rgba(200,164,90,0.06)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="max-w-2xl">
          <div className="sec-eyebrow">06 / CO-CREATION & ALLIANCE</div>
          <h2 className="sec-title text-[#f0ede8]">
            「こういうのやるんですけど、一緒にどうですか？」
          </h2>
          <p className="mt-3 sm:mt-4 font-sans text-xs sm:text-sm md:text-base font-light leading-relaxed text-[rgba(240,237,232,0.75)]">
            誰かの企画に乗っかるもよし、自分の「やりたい」を立ち上げて仲間を巻き込むもよし。
            AI League AIueo は、具体的な行動と共創が生まれるプラットフォームです。
          </p>
        </div>

        <div className="mt-10 sm:mt-12 md:mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {options.map((opt) => (
            <div
              key={opt.title}
              className="group flex flex-col justify-between rounded-2xl border border-[rgba(240,237,232,0.08)] bg-[#0d0d0d] p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#c8a45a] hover:bg-[#121212] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            >
              <div>
                <div className="mb-4 inline-flex rounded-lg border border-[rgba(200,164,90,0.2)] bg-[rgba(200,164,90,0.05)] p-2.5">
                  {opt.icon}
                </div>
                <h3 className="font-sans text-base sm:text-lg font-medium text-[#f0ede8] group-hover:text-white transition-colors">
                  {opt.title}
                </h3>
                <p className="mt-2.5 font-sans text-xs sm:text-sm font-light leading-relaxed text-[rgba(240,237,232,0.65)]">
                  {opt.description}
                </p>
              </div>

              <div className="mt-6 sm:mt-8 border-t border-[rgba(240,237,232,0.08)] pt-4">
                <a
                  href={opt.href}
                  className="flex min-h-[44px] items-center gap-1 font-mono text-xs font-semibold tracking-wider text-[#c8a45a] transition-all hover:translate-x-1 hover:underline"
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
