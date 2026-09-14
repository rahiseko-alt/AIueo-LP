/**
 * 企画の「定員」と「いまの参加人数」。
 *
 * 企画の一覧カード（企画の中に入る前）で、何人集まっているかを見せるための値である。
 * **応募者の氏名・連絡先はAIueoに保存しない**（`MEMBERSHIP_FEATURE_SPEC.md` 実装前提）。
 * 数を入れるのは企画者本人で、AIueoが自動で数えることはしない。
 *
 * DB側にも同じ範囲のCHECK制約がある（`drizzle/0005_proposal_headcount.sql`）。
 */

export const MAX_HEADCOUNT = 100000;

export type HeadcountResult =
  | { ok: true; capacity: number | null; participantCount: number }
  | { ok: false; error: string };

function parseOptionalInteger(raw: unknown): number | null | 'invalid' {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (value.length === 0) return null;
  // 全角数字や小数点、マイナスを弾く。`Number()` は " 3 " や "3e2" も通すため使わない。
  if (!/^\d+$/.test(value)) return 'invalid';
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : 'invalid';
}

export function parseHeadcount(rawCapacity: unknown, rawParticipantCount: unknown): HeadcountResult {
  const capacity = parseOptionalInteger(rawCapacity);
  if (capacity === 'invalid') return { ok: false, error: '定員は半角の数字で入力してください（空欄なら「上限なし」になります）。' };
  if (capacity !== null && (capacity < 1 || capacity > MAX_HEADCOUNT)) {
    return { ok: false, error: `定員は1人から${MAX_HEADCOUNT.toLocaleString('ja-JP')}人までで入力してください。` };
  }

  const count = parseOptionalInteger(rawParticipantCount);
  if (count === 'invalid') return { ok: false, error: 'いまの参加人数は半角の数字で入力してください（空欄なら0人になります）。' };
  const participantCount = count ?? 0;
  if (participantCount > MAX_HEADCOUNT) {
    return { ok: false, error: `いまの参加人数は${MAX_HEADCOUNT.toLocaleString('ja-JP')}人までで入力してください。` };
  }

  return { ok: true, capacity, participantCount };
}

function toCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

/**
 * 一覧カードに出す1行。出すものが無いときは `null` を返す（空の行を作らない）。
 *
 * - 定員あり … 「参加 3 / 10人（残り7）」。埋まっていれば「満席」
 * - 定員なし … 「参加 3人」。0人なら何も出さない（まだ誰も入れていないだけなので）
 */
export function headcountLabel(rawCapacity: unknown, rawParticipantCount: unknown): string | null {
  const capacity = toCount(rawCapacity);
  const count = toCount(rawParticipantCount) ?? 0;
  if (capacity === null) return count > 0 ? `参加 ${count}人` : null;
  const remaining = capacity - count;
  return remaining > 0 ? `参加 ${count} / ${capacity}人（残り${remaining}）` : `参加 ${count} / ${capacity}人（満席）`;
}
