import { test, expect } from '@playwright/test';

/**
 * 会員登録フォームが「黙って固まらない」こと。
 *
 * 修正前は、通信が失敗すると処理が例外で中断し、`isWorking` が true のまま
 * 残っていた。その結果ボタンは押せなくなり、画面には何のメッセージも出ず、
 * 利用者は原因が分からないまま止まる（実際に発生した）。
 *
 * ここでは通信を強制的に失敗させて、
 *   1. 失敗が画面に出ること
 *   2. ボタンが再び押せること
 * を確かめる。
 *
 * 2026-09-09 に認証を Google へ切り替えたため、対象は Google ログインの
 * 開始リクエスト（`/api/auth/sign-in/social`）になった。落とす対象が変わった
 * だけで、確かめている性質は同じである。
 *
 * 【前提】このテストはフォームが有効な状態のビルドを見る。
 * `NEXT_PUBLIC_NEON_AUTH_ENABLED` はビルド時に埋め込まれるため、
 * CI では Build ステップで `true` を渡している（`.github/workflows/ci.yml`）。
 * 手元で流すときも同じ値を付けてビルドすること。
 */

test('通信が失敗したとき、理由が画面に出てボタンが押せる状態に戻る', async ({ page }) => {
  await page.goto('/register');

  const submit = page.getByRole('button', { name: 'Googleで続ける' });
  await expect(submit, '認証を有効にしてビルドされていない（NEXT_PUBLIC_NEON_AUTH_ENABLED=true でビルドすること）').toBeEnabled();

  // 通信そのものを失敗させる。修正前はここで例外が投げられ、握り潰されていた。
  await page.route('**/api/auth/sign-in/social', (route) => route.abort());

  await submit.click();

  // Next.js 自身が role="alert" のルート告知要素を1つ持つため、
  // フォームの通知だけを指す。
  const alert = page.locator('p[role="alert"]');
  await expect(alert, '失敗したのに画面へ何も出ていない').toBeVisible();
  await expect(submit, 'ボタンが押せないまま固まっている').toBeEnabled();
});

test('入力画面のボタンが押せる状態で表示される', async ({ page }) => {
  await page.goto('/register');

  await expect(page.getByRole('button', { name: 'Googleで続ける' })).toBeEnabled();
});

/**
 * メール＋パスワードの導線が画面から消えていること。
 *
 * 上流の Neon Auth 側でもメールログインを無効にしているため、UI だけ残ると
 * 「押しても必ず失敗する入口」になる。
 */
test('メール・パスワードの入力欄が残っていない', async ({ page }) => {
  await page.goto('/register');

  await expect(page.locator('#register-email')).toHaveCount(0);
  await expect(page.locator('#register-password')).toHaveCount(0);
  await expect(page.locator('#register-code')).toHaveCount(0);
});
