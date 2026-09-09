/**
 * Google から戻ってきたリクエストに付く検索パラメータの名前。
 *
 * SDK 内部の定数で export されていない
 * （`@neondatabase/auth/dist/better-auth-helpers-*.mjs` の
 * `NEON_AUTH_SESSION_VERIFIER_PARAM_NAME`）。ずれると
 * `src/components/oauth-session-sync.tsx` が戻りを検知できず、Google ログインが
 * 「押しても未ログインのまま」に戻る。`tests/oauth-return.spec.ts` で値を固定する。
 *
 * 交換そのものは認証SDKのクライアントが `getSession()` の中で行うため、
 * ここで持つのは名前だけでよい。
 */
export const OAUTH_VERIFIER_PARAM = 'neon_auth_session_verifier';
