import { type NextRequest, NextResponse } from 'next/server';

/**
 * 公開ページは認証基盤に依存させない。保護はページ・Server Action・Route Handler
 * が個別に行う。
 *
 * Google ログインの戻り（`?neon_auth_session_verifier=…`）もここでは扱わない。
 * 認証SDKのクライアントが `getSession()` の中で、キャッシュの回避・パラメータの
 * 上流への転送・アドレスバーからの除去まで自前で行う
 * （`@neondatabase/auth/dist/adapter-core-*.mjs` の `getSession` フック）。
 * 受け口は許可済みの `GET /api/auth/get-session` で、Proxy が検索文字列をそのまま
 * 上流へ渡し、返ってきた Set-Cookie をこちらのドメインへ載せる。実際に呼ぶのは
 * `src/components/oauth-session-sync.tsx`。
 *
 * ここで `neonAuth.middleware()` を使ってはいけない。理由は2つある。
 * 1. 素通しの対象がSDK内の固定定数で差し替えられず、`/` や `/events` まで
 *    ログイン必須になる。
 * 2. 交換に失敗したときは保護判定まで進み、公開ページが `/register` へ飛ばされる。
 *    「戻りのときだけ委譲する」条件を足しても、この失敗経路は残る。
 */
export function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
