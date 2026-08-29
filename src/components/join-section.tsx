import { Sparkles, MessageSquare, Code2, Users, ArrowUpRight } from 'lucide-react';

export function JoinSection() {
  const options = [
    {
      icon: <Users className="h-5 w-5 text-[#c8a45a]" />,
      title: '週末の草イベントに参加する',
      description: 'ハッカソンやプロトタイピング会に参加して、一緒に手を動かしてみる。',
      action: 'イベント一覧へ',
      href: '#events',
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-[#c8a45a]" />,
      title: 'Discord / コミュニティに入る',
      description: '日々のAI検証やプロンプト談義、雑談チャンネルで交流する。',
      action: 'Discordに参加する',
      href: 'https://discord.com',
    },
    {
      icon: <Code2 className="h-5 w-5 text-[#c8a45a]" />,
      title: '共同プロジェクトを立ち上げる',
      description: 'テーマを持ち寄り、新しいAIツールやOSSを一緒に作る。',
      action: '企画を相談する',
      href: 'mailto:rahiseko@gmail.com?subject=AIueo共同企画について',
    },
    {
      icon: <Sparkles className="h-5 w-5 text-[#c8a45a]" />,
      title: '会場・環境を提供する',
      description: '開発スペース、APIクレジットなどの連携・スポンサーシップ。',
      action: '連携について連絡する',
      href: 'mailto:rahiseko@gmail.com?subject=会場・リソース提供について',
    },
  ];

  return (
    <section id="join" className="relative border-b border-[rgba(240,237,232,0.08)] bg-[#050505] py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-[radial-gradient(ellipse,rgba(200,164,90,0.06)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <div className="max-w-2xl">
          <div className="sec-eyebrow">07 / JOIN THE LEAGUE</div>
          <h2 className="sec-title text-[#f0ede8]">Join the League</h2>
          <p className="mt-4 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.75)] sm:text-base">
            まずは1つの活動から。草野球の助っ人のように、イベントへの単発参加から継続プロジェクトまで自由に関われます。
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
