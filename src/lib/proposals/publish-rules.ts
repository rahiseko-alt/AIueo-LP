/**
 * 企画を公開するときの決まりごとを1か所にまとめたもの（P40）。
 *
 * 新規作成・編集・画面の表示のすべてがここを読む。画面ごとに別の判定を書くと、
 * 片方だけ直して食い違う（2026-09-27の敵対検証で、新規側だけ過去日を通す、
 * 編集側だけ公開期限を見る、といった不一致が見つかった）。
 *
 * 日付はすべて日本時間（JST）で扱う。Vercelのサーバー時刻はUTCなので、
 * `new Date("2026-10-01")` のように書くと UTC 0時＝JST 9時になってしまう。
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

/** 「調整中」のまま公開できる、開催日までの最小日数。これ未満は翌朝の自動処理で公開から外れる。 */
export const MIN_DAYS_FOR_PLANNING_PUBLISH = 4;

/** 日時を、JSTの日付（`YYYY-MM-DD`）にする。 */
export function jstDateOf(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 今日のJSTの日付。 */
export function jstToday(now: number = Date.now()): string {
  return jstDateOf(now);
}

/** JSTの日付どうしの差（日）。`to` が `from` より後なら正。 */
export function jstDaysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/**
 * 日付（必須）と時刻（任意）から、保存する日時を組み立てる。
 * 時刻が無ければ 00:00 JST とし、`timeSpecified: false` を返す。
 */
export function combineJstDateTime(date: string, time?: string | null): { iso: string; timeSpecified: boolean } | null {
  if (!DATE_PATTERN.test(date)) return null;
  const hasTime = typeof time === 'string' && time.length > 0;
  if (hasTime && !TIME_PATTERN.test(time)) return null;
  const parsed = new Date(`${date}T${hasTime ? time : '00:00'}:00+09:00`);
  if (Number.isNaN(parsed.valueOf()) || jstDateOf(parsed) !== date) return null;
  return { iso: parsed.toISOString(), timeSpecified: hasTime };
}

/** 公開期限の既定値。開催日の 23:59:59 JST。 */
export function defaultPublicExpiry(date: string): string {
  return new Date(`${date}T23:59:59+09:00`).toISOString();
}

/**
 * 本文の最初の空でない行から企画名を作る。文字（コードポイント）単位で140字。
 * 絵文字を途中で切らないよう、`slice` ではなく配列にしてから切る。
 */
export const TITLE_MAX = 140;
export function deriveTitle(body: string): string {
  const firstLine = body.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0) ?? '';
  return Array.from(firstLine).slice(0, TITLE_MAX).join('');
}

/** 企画名が1行目の途中で切れるか。画面で知らせるために使う。 */
export function titleIsTruncated(body: string): boolean {
  const firstLine = body.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0) ?? '';
  return Array.from(firstLine).length > TITLE_MAX;
}

export type ScheduleCheck = {
  startsAt: string;
  publicExpiresAt: string;
  recruitmentDeadlineAt?: string | null;
  /** 公開後の開催状況。`confirmed` 以外は開催日の3日前に自動で公開から外れる。 */
  eventStatus: string;
  now?: number;
};

/**
 * 公開してよい日程かを判定する。問題があれば、画面にそのまま出す日本語を返す。
 * 新規作成・編集の両方から、公開するときだけ呼ぶ（下書きには掛けない）。
 */
export function checkPublishSchedule(input: ScheduleCheck): string | null {
  const now = input.now ?? Date.now();
  const today = jstToday(now);
  const startDate = jstDateOf(input.startsAt);
  const daysUntil = jstDaysBetween(today, startDate);
  if (daysUntil < 0) return '開催日が過ぎています。今日以降の日付にしてください。';
  if (Date.parse(input.publicExpiresAt) <= now) return '公開期限が過ぎています。将来の日時にしてください。';
  if (Date.parse(input.publicExpiresAt) < Date.parse(input.startsAt)) return '公開期限が開催日より前になっています。開催日以降にしてください。';
  if (input.recruitmentDeadlineAt && Date.parse(input.recruitmentDeadlineAt) > Date.parse(input.publicExpiresAt)) {
    return '募集期限が公開期限より後になっています。';
  }
  if (input.eventStatus !== 'confirmed' && daysUntil < MIN_DAYS_FOR_PLANNING_PUBLISH) {
    return '開催日まで3日以内のため、「調整中」のままでは翌朝に自動で公開から外れます。「開催決定」にしてから公開してください。';
  }
  return null;
}

/**
 * 公開ボタンの直上に出す確認文。**ボタンを押すことを、この3点の確認とみなす**
 * （2026-09-27 ユーザー決定。MEMBERSHIP_FEATURE_SPEC.md 必須設計1項）。
 *
 * 文言を変えたら必ず版を上げる。押した時点の版とハッシュを記録に残すため、
 * 版が同じまま文言だけ変わると、誰が何に同意したのかが分からなくなる。
 */
export const PUBLISH_STATEMENT_VERSION = '2026-09-27';
export const PUBLISH_STATEMENT_LINES = [
  '禁止事項（マルチ商法等の勧誘、アダルト系、違法行為、無断のイベント、場を乱す行為）に当たりません。',
  '載せる文章・画像・会場情報を掲載する権利と必要な同意があり、個人の連絡先・自宅の正確な住所・子どもの情報は載せていません。',
  'AIueoは金銭を受け取らず、お金のやり取りは主催者と参加者が直接確認することを理解しています。',
] as const;

/** 本文に金銭らしい言葉があるか。「お金のやり取りはない」のまま公開しようとしたときの注意に使う。 */
export function mentionsMoney(text: string): boolean {
  return /[0-9０-９][,，0-9０-９]*\s*円|¥|￥|参加費|会費|有料|料金|実費|報酬|謝礼/.test(text);
}

/** 本文に電話番号やメールアドレスらしきものがあるか（止めはせず、注意だけ出す）。 */
export function mentionsPersonalContact(text: string): boolean {
  return /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text) || /0\d{1,4}[-‐ー−\s]?\d{1,4}[-‐ー−\s]?\d{3,4}/.test(text);
}
