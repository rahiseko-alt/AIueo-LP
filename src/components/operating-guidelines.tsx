const guidelines = [
  {
    title: 'AIueoの立場',
    body: 'AIueoは、やりたいことを呼びかける場です。企画の主催者・共同主催者・代理人・参加者ではありません。企画・参加・成果・事故・トラブルは、それぞれの主催者と参加者が自分の責任で対応してください。',
  },
  {
    title: 'イベント登録と参加',
    body: 'イベントを登録・主催する場合は、AIueoのメンバー登録が必要です。イベントへの参加だけなら、メンバー登録は必要ありません。メンバー登録なしで勝手にイベントを打つことはできません。',
  },
  {
    title: '個人情報・認証',
    body: 'AIueoは、氏名・住所・電話番号などの個人情報を収集・保管しません。イベント登録と権限管理には外部認証サービスを利用し、AIueoは必要最小限の認証識別子と権限情報だけを利用します。',
  },
  {
    title: '禁止事項と措置',
    body: 'AIueoは、この場を乱す行為を認めません。無断でイベントを立てる、参加者を困らせる、虚偽の告知をする、他人を傷つける、マルチ商法などの勧誘に使う、アダルト系イベントを登録するといった行為は禁止です。違反する掲載、またはAIueoがこの場に不適切と判断した掲載は、予告なく非公開・削除します。違反したメンバーは、予告なく登録を取り消します。',
  },
  {
    title: '費用',
    body: 'AIueoは、利用料・会費・イベント参加費など、いかなる金銭も受け取りません。参加費・報酬・経費・交通費などの決定、支払い、精算にも関与しません。イベントごとの金銭条件は、主催者が事前に明記してください。分からない場合は、まずは全て割り勘から始めることをおすすめします。',
  },
  {
    title: 'イベントの取り消し',
    body: 'イベントの取り消しは主催者に一任します。参加者が1名でも集まっている場合、主催者は自己責任でメンバーへ説明してください。',
  },
  {
    title: '著作権・禁止事項',
    body: 'AIueoに掲載・登録された文章、画像、企画情報などの著作権の一切はAIueoに帰属します。掲載内容に問題がある場合は、AIueoへお知らせください。AIueoは常時すべての掲載を監視するものではありませんが、把握した内容を確認し、必要に応じて非公開・削除などの対応を行います。',
  },
];

export function OperatingGuidelines() {
  return (
    <section id="guidelines" className="section-padding border-b border-[rgba(240,237,232,0.08)] bg-[#0b0b0b]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="max-w-3xl border-b border-[rgba(240,237,232,0.08)] pb-6 sm:pb-8">
          <div className="sec-eyebrow">07 / OPERATING GUIDELINES</div>
          <h2 className="sec-title text-[#f0ede8]">運営のかかわり方</h2>
          <p className="mt-4 max-w-2xl font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.72)] sm:text-base">
            AIueoは、やりたいことを持つ人と参加したい人が出会う「呼びかけの場」です。場を乱さず、決められた入口から使ってください。
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="flex h-fit flex-col gap-5 border-l-2 border-[#c8a45a] pl-5 sm:pl-7">
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#c8a45a] uppercase">
              OUR POSITION
            </p>
            <p className="font-sans text-xl font-light leading-relaxed text-[#f0ede8] sm:text-2xl">
              場をつくる。<br />
              場を乱さない。
            </p>
            <p className="font-sans text-xs font-light leading-relaxed text-[rgba(240,237,232,0.55)] sm:text-sm">
              AIueoは企画・参加・金銭の当事者ではありません。主催者と参加者が、それぞれの責任で行動してください。
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
          AIueoは、必要に応じて掲載内容・メンバー登録・企画の公開を見直し、非公開・削除・登録取消の措置を行うことがあります。利用前に、主催者が提示する個別の条件も必ず確認してください。
        </p>

        <div className="mt-8 flex flex-col gap-4 border border-[rgba(200,164,90,0.35)] bg-[rgba(200,164,90,0.06)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.18em] text-[#c8a45a] uppercase">Contact</p>
            <h3 className="mt-2 font-sans text-lg font-medium text-[#f0ede8]">お問い合わせ</h3>
            <p className="mt-1 font-sans text-sm font-light text-[rgba(240,237,232,0.68)]">
              掲載内容やAIueoについてのご連絡はこちらへ。
            </p>
          </div>
          <a
            href="mailto:info@kouheikosehira.com"
            className="inline-flex min-h-[44px] w-fit items-center border-b border-[#c8a45a] py-2 font-mono text-sm font-semibold tracking-wide text-[#f0ede8] transition-colors hover:text-[#c8a45a]"
          >
            info@kouheikosehira.com
          </a>
        </div>
      </div>
    </section>
  );
}
