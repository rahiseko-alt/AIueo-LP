import { test, expect } from '@playwright/test';

/**
 * 管理画面は未認証で開けない。
 *
 * 認可の正本は `src/proxy.ts` ではなく各ページ・各 Server Action の
 * `requireAdmin()` にある。ここが外れると、画面で隠しているだけの
 * 状態に戻る。
 */

const ADMIN_PAGES = [
  '/admin',
  '/admin/proposals',
  '/admin/members',
  '/admin/moderation',
];

for (const path of ADMIN_PAGES) {
  test(`${path} は未認証で開けない`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });

    expect(res.status(), `${path} が未認証で 200 を返している`).not.toBe(200);
    expect([302, 303, 307, 308], `${path} が拒否されていない`).toContain(res.status());
  });
}
