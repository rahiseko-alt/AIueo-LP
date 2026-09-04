import { test, expect } from '@playwright/test';

/**
 * 全レスポンスにセキュリティヘッダが付くこと。
 *
 * 会員セッションと管理画面を持つアプリなので、クリックジャッキング耐性と
 * リファラ制御が外れたら気付ける必要がある。next.config.ts の headers() が
 * 消えたり source のパターンが狭まったりすると、ここが落ちる。
 */

const PATHS = ['/', '/events', '/register', '/member/profile', '/terms'];

const EXPECTED: Record<string, string> = {
  'x-frame-options': 'DENY',
  'content-security-policy': "frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

for (const path of PATHS) {
  test(`${path} にセキュリティヘッダが付く`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });
    const headers = res.headers();

    for (const [name, value] of Object.entries(EXPECTED)) {
      expect(headers[name], `${path} に ${name} が無いか値が違う`).toBe(value);
    }

    // スタックとバージョンを開示しない
    expect(headers['x-powered-by'], `${path} が X-Powered-By を返している`).toBeUndefined();
  });
}
