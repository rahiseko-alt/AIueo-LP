import { expect, test } from '@playwright/test';

/**
 * 「この場での立場は3つだけ」の表が、登録の前に読めること。
 *
 * 2026-09-12、ユーザーから「権限の曖昧を明確に統一しよう。俺の認識は
 * ①管理者②登録者③一般の3つ」と指示があった。3つの言葉が画面から消えると、
 * 登録が何のために要るのかが読み取れなくなる。
 */
test('/register に3つの立場が同じ言葉で並ぶ', async ({ page }) => {
  await page.goto('/register');
  const guide = page.getByRole('heading', { name: 'この場での立場は3つだけです' });
  await expect(guide, '立場の説明そのものが無い').toBeVisible();

  const body = page.locator('body');
  for (const standing of ['一般', '登録者', '管理者']) {
    await expect(body, `「${standing}」が画面に無い`).toContainText(standing);
  }
});

test('/register は、未登録の人に「いまのあなた」を示す', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByText('いまのあなた'), '自分がどの立場かが示されていない').toBeVisible();
});

test('参加に登録が要らないことが /register に書いてある', async ({ page }) => {
  await page.goto('/register');
  await expect(page.locator('body')).toContainText('参加するだけなら、この登録は要りません');
});
