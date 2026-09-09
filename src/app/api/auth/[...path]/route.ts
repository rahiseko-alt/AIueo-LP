import type { NextRequest } from 'next/server';
import { neonAuth } from '@/lib/neon/auth';

/**
 * 上流 Neon Auth への Proxy。
 *
 * ライブラリのハンドラは受け取ったパスをそのまま上流へ連結するため、素の
 * 再エクスポートは「上流APIの全面公開」と同じになる。実際に画面が使う操作
 * だけを通す。
 *
 * 通すのは Google ログインに要る3つだけである。`sign-in/social` が Google への
 * 出発点で、戻りは Neon 側の callback を経由するためこの Proxy を通らない。
 *
 * ここで通さないもの:
 * - `sign-in/email` `sign-up/email` `email-otp/*` などメール認証の一式
 *   2026-09-09 に認証を Google へ切り替え、AIueo はパスワードを預からない形に
 *   した。上流の Neon Auth 側でもメールログインを無効にしている。経路を残すと
 *   廃止したはずの登録・ログインが Proxy 経由だけ生き残る。
 * - `admin/*` などの管理系
 *   上流には利用者一覧・ロール変更・なりすましのAPIがある。通ってしまえば
 *   このアプリの `audit_log` には何も残らない。
 */
const ALLOWED_ROUTES = new Map<string, ReadonlySet<string>>([
  ['get-session', new Set(['GET'])],
  ['sign-in/social', new Set(['POST'])],
  ['sign-out', new Set(['POST'])],
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
