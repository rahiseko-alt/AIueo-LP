const guidelines = [
  {
    title: '費用・会員登録',
    body: 'AIueoの利用料は完全0円です。イベント登録やメンバーとしての登録を希望する場合は、会員登録が必要です。',
  },
  {
    title: '自己責任での参加',
    body: 'AIueoは、やりたいことを呼びかける場を提供するだけです。企画の実施・参加・成果・事故・トラブルについて、AIueoは一切の責任を負いません。参加者・主催者が内容を確認し、自己責任で行ってください。',
  },
  {
    title: 'イベントの取り消し',
    body: 'イベントの取り消しは主催者に一任します。参加者が1名でも集まっている場合、主催者は自己責任でメンバーへ説明してください。無断で取り消すなど、場を乱す行為があった場合は、事前通告なくメンバー登録を取り消すことがあります。',
  },
  {
    title: '著作権',
    body: 'AIueoに掲載・登録された文章、画像、企画情報などの著作権は、別途明記がない限りAIueoに帰属します。',
  },
  {
    title: '禁止事項',
    body: 'マルチ商法などのビジネスへの利用、アダルト系イベントの登録は禁止します。違法行為、迷惑行為、他の参加者を不安にさせる行為も認めません。',
  },
  {
    title: '案件・お金の条件',
    body: '案件の受注や依頼は自由ですが、報酬・経費・交通費など、お金に関する条件は事前に企画ページへ記載してください。分からない場合は、まずは全て割り勘から始めることをおすすめします。',
  },
];

export function OperatingGuidelines() {
  return (
    <section id="guidelines" className="section-padding border-b border-[rgba(240,237,232,0.08)] bg-[#0b0b0b]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="max-w-3xl border-b border-[rgba(240,237,232,0.08)] pb-6 sm:pb-8">
          <div className="sec-eyebrow">09 / OPERATING GUIDELINES</div>
          <h2 className="sec-title text-[#f0ede8]">運営のかかわり方</h2>
          <p className="mt-4 max-w-2xl font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.72)] sm:text-base">
            AIueoは、やりたいことを持つ人と参加したい人が出会う「呼びかけの場」です。安心して使うために、以下の方針を確認してください。
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="flex h-fit flex-col gap-5 border-l-2 border-[#c8a45a] pl-5 sm:pl-7">
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#c8a45a] uppercase">
              OUR POSITION
            </p>
            <p className="font-sans text-xl font-light leading-relaxed text-[#f0ede8] sm:text-2xl">
              場をつくる。<br />
              行動は、それぞれの責任で。
            </p>
            <p className="font-sans text-xs font-light leading-relaxed text-[rgba(240,237,232,0.55)] sm:text-sm">
              主催者と参加者は、企画内容・条件・安全面を自分で確認したうえで参加してください。
            </p>
          </div>

          <div className="divide-y divide-[rgba(240,237,232,0.09)] border-t border-[rgba(240,237,232,0.09)]">
            {guidelines.map((item, index) => (
              <div key={item.title} className="grid gap-3 py-5 sm:grid-cols-[4.5rem_1fr] sm:gap-5 sm:py-6">
                <span className="font-mono text-xs font-semibold tracking-wider text-[#c8a45a]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-sans text-base font-medium text-[#f0ede8] sm:text-lg">{item.title}</h3>
                  <p className="mt-2 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.68)]">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 border-t border-[rgba(240,237,232,0.08)] pt-5 font-mono text-[10px] leading-relaxed tracking-wide text-[rgba(240,237,232,0.4)] sm:text-xs">
          AIueoは、必要に応じて掲載内容・メンバー登録・企画の公開を見直すことがあります。利用前に、主催者が提示する個別の条件も必ず確認してください。
        </p>
      </div>
    </section>
  );
}
