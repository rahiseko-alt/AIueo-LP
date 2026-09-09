import { type NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@/lib/neon/auth';
import { isOAuthReturn } from '@/lib/auth/oauth-return';

/**
 * 公開ページは認証基盤に依存させない。保護はページ・Server Action・Route Handler
 * が個別に行う。ここで唯一の例外を作るのが、Google から戻ってきた1リクエストである。
 *
 * Neon Auth の OAuth は「Google → Neon の callback → こちらへリダイレクト」で戻る。
 * 戻り先で `neon_auth_session_verifier` を交換して初めてセッションCookieがこちらの
 * ドメインへ載る。その交換処理は SDK の middleware の中にしか無いため、ここで呼ばない
 * 限り Google ログインは「押しても未ログインのまま」になる。
 *
 * ただし `neonAuth.middleware()` をそのまま全リクエストに掛けてはいけない。素通しの
 * 対象は SDK 内の固定定数 `DEFAULT_AUTH_SKIP_ROUTES`（`/api/auth` や `/auth/sign-in`
 * など）だけで、設定から差し替えられない。掛けると `/`・`/events`・`/terms` まで
 * ログイン必須になる。
 *
 * そこで、OAuth の戻りと判別できたリクエストにだけ委譲する。SDK は交換が成立すると
 * 保護判定より前に OAuth 用のリダイレクトを返して抜けるので、この経路でログイン必須化は
 * 起きない。
 */

// 既定の `/auth/sign-in` はこのアプリに存在しないパスなので、会員登録画面へ寄せる。
// 上記のとおりこの経路では保護判定へ到達しないため、実際には使われない保険である。
const oauthMiddleware = neonAuth?.middleware({ loginUrl: '/register' });

export function proxy(request: NextRequest) {
  // 判定条件は `@/lib/auth/oauth-return` に切り出してテストで固定している。
  if (oauthMiddleware && isOAuthReturn(request.nextUrl.searchParams, (name) => request.cookies.has(name))) {
    return oauthMiddleware(request);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
