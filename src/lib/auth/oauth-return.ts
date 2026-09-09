/**
 * Google から戻ってきたリクエストかどうかの判定。
 *
 * `src/proxy.ts` はこの判定が真のときだけ認証SDKのmiddlewareへ委譲する。
 * 全リクエストへ掛けると、SDKの除外リストが固定で差し替えられないため
 * 公開ページまでログイン必須になる。
 *
 * ここで使う2つの名前は SDK 内部の定数で、export されていない
 * （`@neondatabase/auth/dist/server-b0OzGjXl.mjs` の `needsSessionVerification`）。
 * 追従できずにずれると Google ログインが黙って壊れるため、
 * 判定だけを純粋な関数として切り出し、`tests/oauth-return.spec.ts` で
 * 真理値表を固定する。middleware を挟んだ実挙動は実アカウントが要るので、
 * 人が本番で確認する（`HANDOFF.md` の手動確認手順）。
 */

/** OAuth の戻りに付く検索パラメータ。 */
export const OAUTH_VERIFIER_PARAM = 'neon_auth_session_verifier';

/** 出発時に置かれる Cookie。2つ目は SDK に残る旧綴り。 */
export const OAUTH_CHALLENGE_COOKIES = [
  '__Secure-neon-auth.session_challenge',
  '__Secure-neon-auth.session_challange',
] as const;

/**
 * 検索パラメータと Cookie の両方が揃ったときだけ真を返す。
 *
 * パラメータだけで真にしてはいけない。URLを打つだけで、任意のページの
 * 挙動を認証経路へ引き込めるようになる。
 */
export function isOAuthReturn(searchParams: URLSearchParams, hasCookie: (name: string) => boolean): boolean {
  if (!searchParams.has(OAUTH_VERIFIER_PARAM)) return false;
  return OAUTH_CHALLENGE_COOKIES.some((name) => hasCookie(name));
}
