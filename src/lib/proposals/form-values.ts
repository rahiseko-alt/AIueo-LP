/**
 * 企画フォームの入力値を、検証に落ちたときに画面へ戻すための道具。
 *
 * これが無いと、送信のたびに書いた内容が消えて何度も入力し直しになる。
 * 2026-09-10、ユーザーが実際にこれで詰まった（「登録ボタンを押すと既に記入して
 * いた日付などが未入力になり、登録できない」）。
 *
 * `'use server'` のファイルは非同期関数以外を export できないため、
 * Server Action とフォームの両方から使えるこの場所に置いてある。
 */

/** フォームから来た生の入力値。型変換や検証の前に、そのまま画面へ戻すために使う。 */
export type ProposalRawValues = Record<string, string>;

/**
 * 企画フォームの結果。
 *
 * `values` があるときは、DBの値ではなくこちらを画面の初期値に使う。
 */
export type ProposalActionState = { error: string | null; values?: ProposalRawValues };

/**
 * 戻す対象の入力欄。**送られてきた生の値だけを戻す。** サーバーが補った既定値
 * （主催者名や「なし」）は混ぜない。本人が入れていない値を、入れた値として見せないため。
 */
const ECHO_FIELDS = [
  'title', 'summary', 'format', 'visibility', 'tentativeStartsAt', 'recruitmentDeadlineAt',
  'publicExpiresAt', 'organizerName', 'participationMethod', 'applicationUrl', 'capacity', 'participantCount', 'moneyType', 'moneyLabel',
  'moneyAmount', 'moneyCurrency', 'moneyRecipient', 'moneyCollection', 'moneySettlement',
  'moneyRefunds', 'moneyChangeTerms',
  // 短い登録画面（P40）の欄。本文・開催日・時刻が消えると最初から書き直しになる。
  'body', 'tentativeDate', 'tentativeTime', 'publicExpiresDate', 'hasMoney',
  // 選んだ画像も戻す。戻さないと、検証に落ちるたびに画像だけ選び直しになる。
  'imageData', 'imageRemove',
] as const;

/** 画面へ戻す入力値を作る。送られてきた文字列だけを拾い、それ以外の型は捨てる。 */
export function echoValues(formData: FormData): ProposalRawValues {
  const values: ProposalRawValues = {};
  for (const key of ECHO_FIELDS) {
    const value = formData.get(key);
    if (typeof value === 'string') values[key] = value;
  }
  return values;
}
