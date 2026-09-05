import type { NextRequest } from 'next/server';
import { neonAuth } from '@/lib/neon/auth';

/**
 * 上流 Neon Auth への Proxy。
 *
 * ライブラリのハンドラは受け取ったパスをそのまま上流へ連結するため、素の
 * 再エクスポートは「上流APIの全面公開」と同じになる。実際に画面が使う操作
 * だけを通す。
 *
 * ここで通さないもの:
 * - `sign-up/email` と `email-otp/send-verification-otp`
 *   登録と確認コード送信は `/api/membership/registration` に一本化している。
 *   そこには回数制限（1アドレス3回/時・1IP 10回/時）と、登録済みかどうかを
 *   漏らさない同一応答がある。この Proxy から素通しできると、その両方を
 *   迂回して上流の共有枠を食い潰せる。アプリ本体は上流をサーバー側から直接
 *   呼ぶので、ここを塞いでも登録導線は動く。
 * - `admin/*` などの管理系
 *   上流には利用者一覧・ロール変更・なりすましのAPIがある。通ってしまえば
 *   このアプリの `audit_log` には何も残らない。
 */
const ALLOWED_ROUTES = new Map<string, ReadonlySet<string>>([
  ['get-session', new Set(['GET'])],
  ['sign-in/email', new Set(['POST'])],
  ['sign-out', new Set(['POST'])],
  ['email-otp/verify-email', new Set(['POST'])],
]);

type RouteContext = { params: Promise<{ path: string[] }> };

const handler = neonAuth?.handler();

const unavailable = () => new Response('Authentication is not configured.', { status: 503 });
// 許可していないパスの存在有無を外から区別させない。
const notFound = () => new Response('Not Found', { status: 404 });

function guard(method: 'GET' | 'POST') {
  return async (request: NextRequest, context: RouteContext) => {
    // 許可判定を設定の有無より先に行う。順序を逆にすると、未設定の環境で
    // 応答が 503 に揃ってしまい、何を通し何を塞いでいるかを検証できない。
    const { path } = await context.params;
    const route = (path ?? []).join('/');
    if (!ALLOWED_ROUTES.get(route)?.has(method)) return notFound();
    if (!handler) return unavailable();
    return handler[method](request, context);
  };
}

export const GET = guard('GET');
export const POST = guard('POST');
