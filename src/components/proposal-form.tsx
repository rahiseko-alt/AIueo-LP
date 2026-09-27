'use client';

import { useActionState, useState } from 'react';
import { type ProposalActionState } from '@/lib/proposals/form-values';
import { collectMissingFields, RequiredFieldsNotice, type FieldLabels } from '@/components/required-fields-notice';
import { ProposalImageField } from '@/components/proposal-image-field';
import { PUBLISH_STATEMENT_LINES } from '@/lib/proposals/publish-rules';

/** 未入力のときに画面へ出す、欄の日本語名。`name`属性と対応させる。 */
const FIELD_LABELS: FieldLabels = {
  title: '企画名',
  summary: '概要',
  format: '開催形式',
  visibility: '公開範囲',
  tentativeDate: '開催日',
  tentativeTime: '開始時刻',
  publicExpiresAt: '公開期限',
  organizerName: '主催者表示名',
  participationMethod: '参加方法',
  capacity: '定員',
  participantCount: '参加人数',
  moneyType: '金銭の種類',
  moneyLabel: '金銭条件の説明',
  moneySettlement: '精算方法',
};

export type ProposalFormAction = (previousState: ProposalActionState, formData: FormData) => Promise<ProposalActionState>;

export type ProposalDefaultValues = {
  title?: string;
  summary?: string;
  format?: string;
  visibility?: string;
  tentativeDate?: string;
  tentativeTime?: string;
  recruitmentDeadlineAt?: string;
  publicExpiresAt?: string;
  organizerName?: string;
  participationMethod?: string;
  applicationUrl?: string;
  capacity?: string;
  participantCount?: string;
  moneyType?: string;
  moneyLabel?: string;
  moneyAmount?: string;
  moneyCurrency?: string;
  moneyRecipient?: string;
  moneyCollection?: string;
  moneySettlement?: string;
  moneyRefunds?: string;
  moneyChangeTerms?: string;
};

interface ProposalFormProps {
  action: ProposalFormAction;
  defaultValues?: ProposalDefaultValues;
  proposalId?: string;
  /** 現在の掲載状態。`published` のときだけボタンの文言を「公開をやめる」側に変える。 */
  currentStatus?: string;
  /** すでに画像が付いているか。付いていれば確認用に表示し、外す選択肢も出す。 */
  hasImage?: boolean;
}

/**
 * 日付・時刻の欄をクリックしたら、その場でカレンダーを開く。
 *
 * 既定では右端の小さなアイコンを押さないと開かない。欄のどこを押しても
 * 開くようにして、「打つのではなく選ぶ」ことが分かるようにする。
 * `showPicker` は利用者操作以外から呼ぶと例外になるので、失敗しても
 * ブラウザ既定の動きに任せる。
 */
function openCalendar(event: React.MouseEvent<HTMLInputElement>) {
  const field = event.currentTarget;
  if (typeof field.showPicker !== 'function') return;
  try {
    field.showPicker();
  } catch {
    // 何もしない。アイコンからは従来どおり開ける。
  }
}

export function ProposalForm({ action, defaultValues, proposalId, currentStatus, hasImage }: ProposalFormProps) {
  const [state, formAction, isPending] = useActionState<ProposalActionState, FormData>(action, { error: null });
  // 検証に落ちたときは、DBの値ではなく「利用者が今書いた値」を出す。
  // これが無いと、送信のたびに書いた内容が消えて入力し直しになる。
  const values: ProposalDefaultValues = { ...defaultValues, ...(state.values ?? {}) };
  // 空の必須欄があるとブラウザが送信を黙って止める。何が空なのかを画面に残す。
  const [missing, setMissing] = useState<string[]>([]);
  // 公開中の企画では、同じ「下書き保存」が公開の取り下げになる。押す前に
  // 何が起きるかが分かるよう、ボタンの文言そのものを変える。
  const isPublished = currentStatus === 'published';
  const checkBeforeSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    if (form) setMissing(collectMissingFields(form, FIELD_LABELS));
  };
  return <form action={formAction} className="mt-8 space-y-8">
    {proposalId && <input type="hidden" name="proposalId" value={proposalId} />}
    <div className="grid gap-6 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="form-label">企画名 *</span><input name="title" required maxLength={140} defaultValue={values.title} className="form-control" /></label>
      <label className="sm:col-span-2"><span className="form-label">概要 *</span><textarea name="summary" required maxLength={5000} rows={6} defaultValue={values.summary} className="form-control" /></label>
      <label><span className="form-label">開催形式</span><select name="format" defaultValue={values.format ?? ''} className="form-control"><option value="">選ばない（本文参照）</option><option value="offline">オフライン</option><option value="online">オンライン</option><option value="hybrid">ハイブリッド</option></select></label>
      <label><span className="form-label">公開範囲 *</span><select name="visibility" required defaultValue={values.visibility ?? 'public'} className="form-control"><option value="public">公開</option><option value="unlisted">限定公開</option></select></label>
      <label><span className="form-label">開催日 *</span><span className="mt-1 block text-xs leading-6 text-white/50">欄をクリックするとカレンダーが開きます</span><input name="tentativeDate" required type="date" onClick={openCalendar} defaultValue={values.tentativeDate} className="form-control" /></label><label><span className="form-label">開始時刻（任意）</span><span className="mt-1 block text-xs leading-6 text-white/50">空欄なら日付だけを表示します</span><input name="tentativeTime" type="time" defaultValue={values.tentativeTime} className="form-control" /></label>
      <label><span className="form-label">募集期限（任意）</span><input name="recruitmentDeadlineAt" type="datetime-local" onClick={openCalendar} defaultValue={values.recruitmentDeadlineAt} className="form-control" /></label>
      <label><span className="form-label">公開期限 *</span><input name="publicExpiresAt" required type="datetime-local" onClick={openCalendar} defaultValue={values.publicExpiresAt} className="form-control" /></label>
      <label><span className="form-label">主催者表示名 *</span><input name="organizerName" required maxLength={120} defaultValue={values.organizerName} className="form-control" /></label>
      <label className="sm:col-span-2"><span className="form-label">参加方法 *</span><textarea name="participationMethod" required maxLength={2000} rows={3} defaultValue={values.participationMethod} className="form-control" placeholder="メールでご連絡ください / 当日直接お越しください / 定員20名 など" /></label>
      <label><span className="form-label">定員（任意）</span><span className="mt-1 block text-xs leading-6 text-white/50">主催者を含めた上限です。空欄なら「上限なし」。半角の数字で入れてください。</span><input name="capacity" type="number" inputMode="numeric" min={1} max={100000} step={1} defaultValue={values.capacity} className="form-control" placeholder="10" /></label><label><span className="form-label">参加人数（任意）</span><span className="mt-1 block text-xs leading-6 text-white/50"><strong className="font-normal text-[#e4d2a6]">主催者を含めた人数です。</strong>1なら主催者だけ、2なら主催者ともう1人。企画の一覧に「参加人数 3 / 10人」と出ます。集まったらご自分で書き換えてください。空欄なら出しません。</span><input name="participantCount" type="number" inputMode="numeric" min={0} max={100000} step={1} defaultValue={values.participantCount} className="form-control" placeholder="1" /></label><label className="sm:col-span-2"><span className="form-label">参加申し込みフォームのURL（任意）</span><span className="mt-1 block text-xs leading-6 text-white/50">Googleフォームなど、ご自分で用意した申し込みページのURLを貼ると、企画ページに「参加を申し込む」ボタンが出ます。申し込んだ人の名前や連絡先はAIueoには届きません。空欄でもかまいません。</span><input name="applicationUrl" type="url" inputMode="url" maxLength={2000} defaultValue={values.applicationUrl} className="form-control" placeholder="https://forms.gle/xxxxxxxx" /></label>
    </div>
    <fieldset className="space-y-4 border-t border-white/10 pt-7"><legend className="font-mono text-xs tracking-[0.15em] text-[#c8a45a]">金銭条件（公開前に必ず明記）</legend><label><span className="form-label">金銭の種類 *</span><select name="moneyType" required defaultValue={values.moneyType ?? 'none'} className="form-control"><option value="none">なし</option><option value="fixed_fee">固定参加費</option><option value="range_or_upper_limit">幅・上限あり</option><option value="reimbursement">実費精算</option><option value="reward">報酬</option><option value="donation">寄付・カンパ</option><option value="undecided">未定（公開不可）</option></select></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="form-label">金銭条件の説明 *</span><input name="moneyLabel" required placeholder="なし / 参加費1,000円 など" defaultValue={values.moneyLabel} className="form-control" /></label><label><span className="form-label">金額・上限</span><input name="moneyAmount" defaultValue={values.moneyAmount} className="form-control" /></label><label><span className="form-label">通貨</span><input name="moneyCurrency" defaultValue={values.moneyCurrency ?? 'JPY'} className="form-control" /></label><label><span className="form-label">支払先</span><input name="moneyRecipient" defaultValue={values.moneyRecipient} className="form-control" /></label><label><span className="form-label">徴収方法</span><input name="moneyCollection" defaultValue={values.moneyCollection} className="form-control" /></label><label><span className="form-label">精算方法（お金がある場合は必須）</span><input name="moneySettlement" placeholder="なし / 当日現金 / 振込 など" defaultValue={values.moneySettlement} className="form-control" /></label><label><span className="form-label">返金・中止時の扱い</span><input name="moneyRefunds" defaultValue={values.moneyRefunds} className="form-control" /></label><label><span className="form-label">変更条件</span><input name="moneyChangeTerms" defaultValue={values.moneyChangeTerms} className="form-control" /></label></div></fieldset>
    <ProposalImageField currentImageUrl={hasImage && proposalId ? `/api/proposals/${proposalId}/image` : undefined} defaultData={state.values?.imageData} />
    <section aria-labelledby="publish-statement" className="border border-[#c8a45a]/45 bg-black/20 p-5"><h2 id="publish-statement" className="form-label">公開ボタンを押す前に確認してください</h2><ul data-testid="publish-statement" className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-white/80">{PUBLISH_STATEMENT_LINES.map((line) => <li key={line}>{line}</li>)}</ul><p className="mt-3 text-xs leading-6 text-white/55">公開ボタンを押すと、上の内容を確認したものとして記録します。下書き保存では記録しません。</p></section>
    {state.error && <p role="alert" className="border border-red-300/35 bg-red-950/30 p-4 text-sm leading-7 text-red-100">{state.error}</p>}
    <RequiredFieldsNotice items={missing} />
    {isPublished && <p className="text-sm leading-7 text-white/70">この企画はいま公開中です。書き直した内容をそのまま公開し続けるなら「公開したまま保存」、公開を取り下げるなら「下書きとして保存（公開はやめます）」を押してください。</p>}
    <div className="flex flex-col gap-3 sm:flex-row"><button name="intent" value="draft" type="submit" onClick={checkBeforeSubmit} disabled={isPending} className="btn-ghost flex-1 disabled:opacity-45">{isPending ? '保存中…' : isPublished ? '下書きとして保存（公開はやめます）' : '下書き保存'}</button><button name="intent" value="publish" type="submit" onClick={checkBeforeSubmit} disabled={isPending} className="btn-solid flex-1 disabled:opacity-45">{isPublished ? '上記を確認して、公開したまま保存' : '上記を確認して公開する'}</button></div>
  </form>;
}
