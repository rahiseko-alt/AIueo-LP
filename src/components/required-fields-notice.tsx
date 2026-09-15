'use client';

/**
 * 未入力の必須欄を、画面に日本語で出すための道具。
 *
 * ブラウザ標準の必須チェックは、送信を止めたうえで小さな吹き出しを出すだけである。
 * 吹き出しは数秒で消え、押したボタンから離れた位置に出るため、利用者には
 * 「ボタンを押しても何も起きない」と映る。2026-09-10、企画フォームで実際にこれが
 * 起きた（金銭条件の説明・精算方法が空のまま「下書き保存」を押しても、PC幅では
 * 画面のスクロール位置すら動かないことを実測した）。
 *
 * そこで、送信ボタンを押した時点でこちらでも同じ判定を行い、
 * 「どの欄が空なのか」を消えない形で残す。ブラウザ標準の動きは止めない。
 */

type ValidatableElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export type FieldLabels = Record<string, string>;

function isValidatable(element: Element): element is ValidatableElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

/**
 * 未入力・不正な必須欄の日本語名を返し、最初の欄まで画面を送る。
 *
 * 日付欄は「日付だけ選んで時刻を入れていない」状態でも不正になる。見ただけでは
 * 入っているように見えるので、その旨を名前に添える。
 */
export function collectMissingFields(form: HTMLFormElement, labels: FieldLabels): string[] {
  const missing: string[] = [];
  let firstInvalid: ValidatableElement | null = null;

  for (const element of Array.from(form.elements)) {
    if (!isValidatable(element)) continue;
    if (!element.willValidate || element.checkValidity()) continue;
    if (!firstInvalid) firstInvalid = element;
    const base = labels[element.name] ?? element.name;
    const label = element.type === 'datetime-local' ? `${base}（日付と時刻の両方）` : base;
    if (!missing.includes(label)) missing.push(label);
  }

  if (firstInvalid) {
    firstInvalid.scrollIntoView({ block: 'center' });
    firstInvalid.focus({ preventScroll: true });
  }
  return missing;
}

export function RequiredFieldsNotice({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <p role="alert" className="border border-red-300/35 bg-red-950/30 p-4 text-sm leading-7 text-red-100">
      次の項目が空のため、まだ保存していません。入力してから、もう一度ボタンを押してください。
      <span className="mt-2 block font-semibold">{items.join(' / ')}</span>
    </p>
  );
}
