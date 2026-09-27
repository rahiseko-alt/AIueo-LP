/**
 * DBに入っている英語の状態名を、画面に出す日本語へ直す対応表。
 *
 * 2026-09-11、ユーザーから「ドラフトとかpublicとかplanningじゃ分かりにくい、
 * 公開中など他のボタンと同じ表示で統一しろ」と指摘を受けて追加した。
 * 表示はここだけで決める。画面ごとに別の言い回しを書かない。
 *
 * 言葉は操作ボタンと揃える。「開催決定」「参加者満席」「終了」「中止」は
 * 企画ページのボタンと同じ文字にしてある。
 */

/** 掲載の状態（`proposals.status`）。 */
export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  published: '公開中',
  needs_revision: '修正のお願いあり',
  auto_hidden: '自動で公開停止',
  expired: '公開期限切れ',
  hidden: '管理者により非公開',
  ended: '終了',
  cancelled: '中止',
};

/** 開催の状況（`proposals.event_status`）。 */
export const EVENT_STATUS_LABELS: Record<string, string> = {
  planning: '調整中',
  confirmed: '開催決定',
  full: '参加者満席',
  cancelled: '中止',
  completed: '終了',
};

/** 公開範囲（`proposals.visibility`）。 */
export const VISIBILITY_LABELS: Record<string, string> = {
  public: '公開',
  unlisted: '限定公開',
};

/** 会員の状態（`profiles.status`）。 */
export const MEMBER_STATUS_LABELS: Record<string, string> = {
  pending_profile: '登録の途中',
  active: '有効',
  suspended: '利用停止',
  withdrawn: '退会済み',
};

/** 会員の権限（`profiles.role`）。 */
export const ROLE_LABELS: Record<string, string> = {
  member: '会員',
  admin: '管理者',
};

/**
 * 対応表に無い値は、そのまま返す。
 *
 * 状態が増えたときに空欄になるより、英語のままでも出ているほうが気づける。
 */
function label(map: Record<string, string>, value: unknown): string {
  const key = String(value ?? '');
  return map[key] ?? key;
}

export const proposalStatusLabel = (value: unknown) => label(PROPOSAL_STATUS_LABELS, value);
export const eventStatusLabel = (value: unknown) => label(EVENT_STATUS_LABELS, value);
export const visibilityLabel = (value: unknown) => label(VISIBILITY_LABELS, value);
export const memberStatusLabel = (value: unknown) => label(MEMBER_STATUS_LABELS, value);
export const roleLabel = (value: unknown) => label(ROLE_LABELS, value);

/**
 * 開催日時の表示。時刻を指定していない企画は日付だけを出す（P40）。
 *
 * 時刻なしの企画は 00:00 JST で保存しているので、そのまま時刻を出すと
 * 「深夜0時開催」に見える。**開催日時を画面へ出すときは必ずこれを通す。**
 */
export function formatStartsAt(value: unknown, timeSpecified: unknown, style: 'long' | 'short' = 'long'): string {
  const date = value instanceof Date ? value : typeof value === 'string' && value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '日程調整中';
  const withTime = timeSpecified !== false;
  const options: Intl.DateTimeFormatOptions = style === 'short'
    ? { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', weekday: 'short' }
    : { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' };
  if (withTime) Object.assign(options, { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleString('ja-JP', options) + (withTime ? '' : '（時刻は本文参照）');
}
