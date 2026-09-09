import { test, expect } from '@playwright/test';
import { OAUTH_VERIFIER_PARAM } from '../src/lib/auth/oauth-return';

/**
 * Google ログインの戻り経路。
 *
 * 戻りの交換は認証SDKのクライアントが `getSession()` の中で行い、受け口は
 * 許可済みの `GET /api/auth/get-session` である。middleware は使わない
 * （理由は `src/proxy.ts` のコメント）。
 *
 * ここで固定するのは3つ。
 *   1. 公開ページが認証に依存していないこと（middleware を挟む実装へ戻していない）
 *   2. 戻りを検知するパラメータ名が SDK の内部定数からずれていないこと
 *   3. 戻り先ページに交換用のコードが載っていること
 *
 * 実際に Google のアカウントで通す確認は、実アカウントが要るため人が行う
 * （`HANDOFF.md` の手動確認手順）。この環境には認証情報が無く、そこまでは踏めない。
 */

test('戻りを検知するパラメータ名がSDKの内部定数と一致している', () => {
  // ここがずれると、戻ってきても交換が始まらず「押しても未ログインのまま」に戻る。
  expect(OAUTH_VERIFIER_PARAM).toBe('neon_auth_session_verifier');
});

const PUBLIC_PATHS = ['/', '/events', '/terms', '/register'];

for (const path of PUBLIC_PATHS) {
  test(`${path} は認証を要求しない`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.status(), `${path} が認証で弾かれている`).toBe(200);
    expect(new URL(page.url()).pathname, `${path} からログイン画面へ飛ばされている`).toBe(path);
  });

  test(`${path} は検証パラメータが付いても素通しする`, async ({ page }) => {
    // middleware を挟む実装へ戻すと、交換の失敗時にここが /register へ飛ぶ。
    const response = await page.goto(`${path}?${OAUTH_VERIFIER_PARAM}=not-a-real-token`);

    expect(response?.status(), `${path} が検証パラメータで挙動を変えている`).toBe(200);
    expect(new URL(page.url()).pathname, `${path} から飛ばされている`).toBe(path);
  });
}

/**
 * 戻り先ページが、実際に交換リクエストを出すこと。
 *
 * 「待ち表示が出ていない」だけを見るテストは、実装が丸ごと無くても通ってしまう。
 * 交換の受け口へリクエストが飛ぶかどうかを直接見る。
 */
test('戻り先ページは検証パラメータ付きで交換リクエストを出す', async ({ page }) => {
  const exchanges: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/get-session')) exchanges.push(request.url());
  });

  await page.goto(`/member/profile?${OAUTH_VERIFIER_PARAM}=fake-token`);
  await expect
    .poll(() => exchanges.length, { message: '戻ってきても交換が始まらない（未ログインのままになる）' })
    .toBeGreaterThan(0);

  expect(exchanges[0], '検証パラメータが上流へ渡っていない').toContain(`${OAUTH_VERIFIER_PARAM}=fake-token`);
});

test('検証パラメータが無ければ交換リクエストを出さない', async ({ page }) => {
  const exchanges: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/get-session')) exchanges.push(request.url());
  });

  await page.goto('/member/profile');
  await expect(page.getByText('ログイン処理をしています', { exact: false })).toHaveCount(0);
  expect(exchanges, '毎回の表示で交換を走らせている').toHaveLength(0);
});
