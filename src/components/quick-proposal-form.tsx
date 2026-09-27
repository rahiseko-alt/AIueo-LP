'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { type ProposalActionState } from '@/lib/proposals/form-values';
import { collectMissingFields, RequiredFieldsNotice, type FieldLabels } from '@/components/required-fields-notice';
import { ProposalImageField } from '@/components/proposal-image-field';
import {
  deriveTitle,
  jstDaysBetween,
  jstToday,
  mentionsMoney,
  mentionsPersonalContact,
  MIN_DAYS_FOR_PLANNING_PUBLISH,
  PUBLISH_STATEMENT_LINES,
  titleIsTruncated,
} from '@/lib/proposals/publish-rules';

const FIELD_LABELS: FieldLabels = {
  body: '企画の内容',
  participationMethod: '参加方法',
  tentativeDate: '開催日',
  tentativeTime: '開始時刻',
  organizerName: '主催者名',
  moneyType: '金銭の種類',
  moneyLabel: '金銭条件の説明',
  moneyAmount: '金額・上限',
  moneyRecipient: '支払先',
  moneySettlement: '精算方法',
  capacity: '定員',
  participantCount: '参加人数',
};

type Props = {
  action: (previousState: ProposalActionState, formData: FormData) => Promise<ProposalActionState>;
  /** プロフィールの公開名。主催者名の既定値として、確認文に表示してから使う。 */
  publicName: string | null;
};

/**
 * 企画を短い手数で公開するためのフォーム（P40）。
 *
 * 最短は「本文 → 参加方法 → 開催日 → 公開ボタン」の4操作。
 * それ以外は既定値で埋めるが、**既定値は確認文に表示してから押してもらう**。
 * 表示せずに埋めると、本人が決めていない値が公開ページに出てしまう。
 */
export function QuickProposalForm({ action, publicName }: Props) {
  const [state, formAction, isPending] = useActionState<ProposalActionState, FormData>(action, { error: null });
  const values = state.values ?? {};
  const [body, setBody] = useState(values.body ?? '');
  const [date, setDate] = useState(values.tentativeDate ?? '');
  const [organizerName, setOrganizerName] = useState(values.organizerName ?? '');
  const [hasMoney, setHasMoney] = useState(values.hasMoney === 'on');
  const [missing, setMissing] = useState<string[]>([]);

  const title = deriveTitle(body);
  const shownOrganizer = organizerName.trim() || publicName?.trim() || '';
  const daysUntil = date ? jstDaysBetween(jstToday(), date) : null;
  const planningBlocked = daysUntil !== null && daysUntil >= 0 && daysUntil < MIN_DAYS_FOR_PLANNING_PUBLISH;
  const moneyWarning = !hasMoney && mentionsMoney(body);
  const contactWarning = mentionsPersonalContact(body);

  const checkBeforeSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    if (!form) return;
    // 折りたたみの中の欄が空だと、ブラウザは閉じた欄へ移れず送信だけが黙って止まる。
    // 先に開いておく。
    for (const details of Array.from(form.querySelectorAll('details'))) {
      if (details.querySelector(':invalid')) details.open = true;
    }
    setMissing(collectMissingFields(form, FIELD_LABELS));
  };

  return (
    <form action={formAction} className="mt-8 space-y-7">
      <input type="hidden" name="hasMoney" value={hasMoney ? 'on' : ''} />

      <label className="block">
        <span className="form-label">1. 企画の内容 *</span>
        <span className="mt-1 block text-xs leading-6 text-white/55">1行目が企画名になります。2行目から、何をするか・場所・持ち物などを書いてください。</span>
        <textarea
          name="body"
          required
          maxLength={5000}
          rows={6}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="form-control"
          placeholder={'来週末、カレーを作りながらAIの話をする会\n場所は世田谷区の公民館です。材料費は各自持ち寄り。'}
        />
        {title && (
          <span data-testid="title-preview" className="mt-2 block text-sm leading-7 text-[#e4d2a6]">
            企画名として表示: {title}
            {titleIsTruncated(body) && <span className="block text-xs text-white/60">1行目が長いため、途中で切れます。1行目は短くするのがおすすめです。</span>}
          </span>
        )}
        {contactWarning && <span className="mt-2 block text-xs leading-6 text-[#f3c7a0]">電話番号やメールアドレスのような文字があります。個人の連絡先は載せないでください（会員規約）。</span>}
      </label>

      <label className="block">
        <span className="form-label">2. 参加したい人はどうすればいいですか？ *</span>
        <span className="mt-1 block text-xs leading-6 text-white/55">申し込みフォームのURLを貼ると、企画ページに「参加を申し込む」ボタンが出ます。</span>
        <input
          name="participationMethod"
          required
          maxLength={2000}
          defaultValue={values.participationMethod}
          className="form-control"
          placeholder="https://forms.gle/xxxx / 当日そのままお越しください"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">3. 開催日 *</span>
          <input
            name="tentativeDate"
            type="date"
            required
            min={jstToday()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="form-control"
          />
        </label>
        <label className="block">
          <span className="form-label">開始時刻（任意）</span>
          <input name="tentativeTime" type="time" defaultValue={values.tentativeTime} className="form-control" />
          <span className="mt-1 block text-xs leading-6 text-white/50">空欄なら日付だけを表示します。</span>
        </label>
      </div>

      <section className="border-t border-white/10 pt-6">
        <p className="form-label">お金のやり取り</p>
        {!hasMoney ? (
          <p className="mt-2 text-sm leading-7 text-white/80">
            この企画に、参加費・報酬・経費などのお金のやり取りは<strong className="font-normal text-[#e4d2a6]">ありません</strong>。
            <button type="button" onClick={() => setHasMoney(true)} className="ml-2 inline-flex min-h-11 items-center text-[#d7bd82] underline hover:text-white">お金のやり取りがある</button>
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            <button type="button" onClick={() => setHasMoney(false)} className="inline-flex min-h-11 items-center text-sm text-[#d7bd82] underline hover:text-white">お金のやり取りはない</button>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="form-label">金銭の種類 *</span><select name="moneyType" required defaultValue={values.moneyType && values.moneyType !== 'none' ? values.moneyType : 'fixed_fee'} className="form-control"><option value="fixed_fee">固定参加費</option><option value="range_or_upper_limit">幅・上限あり</option><option value="reimbursement">実費精算</option><option value="reward">報酬</option><option value="donation">寄付・カンパ</option><option value="undecided">未定（公開不可）</option></select></label>
              <label><span className="form-label">金銭条件の説明 *</span><input name="moneyLabel" required defaultValue={values.moneyLabel} className="form-control" placeholder="参加費1,000円（材料費込み）" /></label>
              <label><span className="form-label">金額・上限 *</span><input name="moneyAmount" required defaultValue={values.moneyAmount} className="form-control" placeholder="1000" /></label>
              <label><span className="form-label">支払先 *</span><input name="moneyRecipient" required defaultValue={values.moneyRecipient} className="form-control" placeholder="主催者" /></label>
              <label><span className="form-label">精算方法 *</span><input name="moneySettlement" required defaultValue={values.moneySettlement} className="form-control" placeholder="当日現金" /></label>
              <label><span className="form-label">返金・中止時の扱い</span><input name="moneyRefunds" defaultValue={values.moneyRefunds} className="form-control" /></label>
              <label className="sm:col-span-2"><span className="form-label">変更条件</span><input name="moneyChangeTerms" defaultValue={values.moneyChangeTerms} className="form-control" /></label>
            </div>
          </div>
        )}
        {moneyWarning && <p className="mt-2 text-xs leading-6 text-[#f3c7a0]">本文に金額や「参加費」などの言葉があります。お金のやり取りがあるなら「お金のやり取りがある」を押してください。</p>}
      </section>

      <details className="border-t border-white/10 pt-6">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-mono text-xs tracking-[0.15em] text-[#c8a45a]">詳しく設定する（任意）</summary>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label><span className="form-label">主催者名</span><input name="organizerName" maxLength={120} value={organizerName} onChange={(event) => setOrganizerName(event.target.value)} className="form-control" placeholder={publicName ?? ''} /><span className="mt-1 block text-xs leading-6 text-white/50">空欄なら公開名（{publicName ?? '未設定'}）を使います。</span></label>
          <label><span className="form-label">開催形式</span><select name="format" defaultValue={values.format ?? ''} className="form-control"><option value="">選ばない（本文参照）</option><option value="offline">オフライン</option><option value="online">オンライン</option><option value="hybrid">ハイブリッド</option></select></label>
          <label><span className="form-label">公開範囲</span><select name="visibility" defaultValue={values.visibility ?? 'public'} className="form-control"><option value="public">公開</option><option value="unlisted">限定公開</option></select></label>
          <label><span className="form-label">公開期限</span><input name="publicExpiresDate" type="date" defaultValue={values.publicExpiresDate} className="form-control" /><span className="mt-1 block text-xs leading-6 text-white/50">空欄なら開催日の終わり（23:59）まで公開します。</span></label>
          <label><span className="form-label">定員</span><input name="capacity" type="number" inputMode="numeric" min={1} max={100000} step={1} defaultValue={values.capacity} className="form-control" placeholder="主催者を含めた上限" /></label>
          <label><span className="form-label">参加人数</span><input name="participantCount" type="number" inputMode="numeric" min={0} max={100000} step={1} defaultValue={values.participantCount} className="form-control" placeholder="主催者を含めた人数" /></label>
          <div className="sm:col-span-2"><ProposalImageField defaultData={values.imageData} /></div>
        </div>
      </details>

      <section aria-labelledby="publish-statement" className="border border-[#c8a45a]/45 bg-black/20 p-5">
        <h2 id="publish-statement" className="form-label">公開ボタンを押す前に確認してください</h2>
        <ul data-testid="publish-statement" className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-white/80">
          <li>主催者名: <strong className="font-normal text-[#e4d2a6]">{shownOrganizer || '（未設定。「詳しく設定する」で入れてください）'}</strong>（企画ページに表示されます）</li>
          <li>金銭: <strong className="font-normal text-[#e4d2a6]">{hasMoney ? '上の欄のとおり' : 'なし'}</strong></li>
          {PUBLISH_STATEMENT_LINES.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <p className="mt-3 text-xs leading-6 text-white/55">公開ボタンを押すと、上の内容を確認したものとして記録します。<Link href="/terms" target="_blank" className="text-[#d7bd82] underline">会員規約</Link></p>

        {state.error && <p role="alert" className="mt-4 border border-red-300/35 bg-red-950/30 p-4 text-sm leading-7 text-red-100">{state.error}</p>}
        <div className="mt-4"><RequiredFieldsNotice items={missing} /></div>
        <p className="mt-4 text-xs leading-6 text-white/60">「調整中」で公開した企画は、開催日の3日前の朝までに企画ページで「開催決定」を押さないと、自動で公開から外れます。</p>
        {planningBlocked && <p className="mt-4 text-sm leading-7 text-[#f3c7a0]">開催日まで3日以内です。「調整中」のままでは翌朝に自動で公開から外れるため、「開催決定として公開」を選んでください。</p>}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button name="intent" value="publish_confirmed" type="submit" onClick={checkBeforeSubmit} disabled={isPending} className="btn-solid flex-1 disabled:opacity-45">{isPending ? '送信中…' : '4. 開催決定として公開'}</button>
          <button name="intent" value="publish_planning" type="submit" onClick={checkBeforeSubmit} disabled={isPending || planningBlocked} className="btn-solid flex-1 disabled:opacity-45">{isPending ? '送信中…' : '4. 調整中として公開'}</button>
        </div>
      </section>

      <button name="intent" value="draft" type="submit" onClick={checkBeforeSubmit} disabled={isPending} className="btn-ghost w-full disabled:opacity-45">下書きとして保存（公開しない）</button>
    </form>
  );
}
