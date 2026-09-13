/**
 * 参加申し込みフォームのURL。
 *
 * AIueoは申し込みを受け取らない（`MEMBERSHIP_FEATURE_SPEC.md` 実装前提）。
 * 主催者が自分で用意した外部フォームへ、公開ページから1押しで行けるように
 * するためだけの値である。応募者の情報はAIueo側に一切保存しない。
 *
 * `http`/`https` 以外は受け付けない。`javascript:` や `data:` を公開ページの
 * リンクに置くと、押した人の画面で任意のコードが動きうるため。
 * DB側にも同じ条件のCHECK制約がある（`drizzle/0004_proposal_application_url.sql`）。
 */

export const MAX_APPLICATION_URL_LENGTH = 2000;

export type ApplicationUrlResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

export function parseApplicationUrl(raw: unknown): ApplicationUrlResult {
  if (typeof raw !== 'string') return { ok: true, value: null };
  const value = raw.trim();
  if (value.length === 0) return { ok: true, value: null };
  if (value.length > MAX_APPLICATION_URL_LENGTH) {
    return { ok: false, error: `申し込みフォームのURLが長すぎます（${MAX_APPLICATION_URL_LENGTH}文字まで）。` };
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: '申し込みフォームのURLは、https:// から始まる形で入力してください。' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: '申し込みフォームのURLは、https:// から始まる形で入力してください。' };
  }
  if (/\s/.test(value)) {
    return { ok: false, error: '申し込みフォームのURLに空白が含まれています。もう一度貼り直してください。' };
  }
  return { ok: true, value };
}
