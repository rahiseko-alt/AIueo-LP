import { test, expect } from '@playwright/test';

/**
 * 検索結果とSNS共有に出る情報。
 *
 * 以前は `title` と `description` の2項目しか無く、全ページが同じ文言だった。
 * OGP・canonical・robots・sitemap はどれも存在しなかったため、URLを貼っても
 * 画像も説明も出なかった。
 *
 * 注意: テストは 127.0.0.1:3100 に対して走るため、URLの完全一致は見ない
 * （本番の住所は `src/lib/site.ts` の `siteUrl`）。ここで確かめるのは、
 * 必要な情報が「在ること」と「ページごとに違うこと」である。
 */

async function meta(page: import('@playwright/test').Page, property: string) {
  return page.locator(`meta[property="${property}"]`).first().getAttribute('content');
}

test('トップに OGP と canonical が出ている', async ({ page }) => {
  await page.goto('/');

  expect(await meta(page, 'og:title'), 'og:title が無い').toBeTruthy();
  expect(await meta(page, 'og:description'), 'og:description が無い').toBeTruthy();
  expect(await meta(page, 'og:type'), 'og:type が無い').toBe('website');
  expect(await meta(page, 'og:image'), 'og:image が無い').toBeTruthy();

  const twitterCard = await page.locator('meta[name="twitter:card"]').first().getAttribute('content');
  expect(twitterCard, 'twitter:card が無い').toBe('summary_large_image');

  const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
  expect(canonical, 'canonical が無い').toBeTruthy();
});

test('OGP画像が実際に取得できる', async ({ page, request }) => {
  await page.goto('/');
  const imageUrl = await meta(page, 'og:image');
  expect(imageUrl, 'og:image が無い').toBeTruthy();

  // 本番の住所で出力されるので、パスだけをテスト用サーバーへ向け直す。
  const res = await request.get(new URL(imageUrl!).pathname);
  expect(res.status(), 'OGP画像が取得できない').toBe(200);
  expect(res.headers()['content-type'], 'OGP画像が画像ではない').toContain('image/');
});

test('ページごとに title が違う', async ({ page }) => {
  await page.goto('/');
  const home = await page.title();
  await page.goto('/terms');
  const terms = await page.title();
  await page.goto('/events');
  const events = await page.title();

  expect(terms, '規約ページがトップと同じ title').not.toBe(home);
  expect(events, '企画一覧がトップと同じ title').not.toBe(home);
  expect(terms, '規約ページと企画一覧が同じ title').not.toBe(events);
});

test('説明文が旧コピーのままになっていない', async ({ page }) => {
  await page.goto('/');
  const description = await page.locator('meta[name="description"]').first().getAttribute('content');
  // 「週末に集まり、AIを触り、プロトタイプで遊ぶ同盟。」は本文と食い違っていた。
  expect(description, '説明文が旧コピーのまま').not.toContain('週末に集まり');
});

test('robots.txt が会員・管理経路を除いている', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status(), 'robots.txt が無い').toBe(200);

  const body = await res.text();
  expect(body, '管理画面を除いていない').toContain('Disallow: /admin/');
  expect(body, '会員画面を除いていない').toContain('Disallow: /member/');
  expect(body, 'sitemap を案内していない').toContain('Sitemap:');
});

test('sitemap.xml に公開ページが載っている', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status(), 'sitemap.xml が無い').toBe(200);

  const body = await res.text();
  expect(body, '規約ページが載っていない').toContain('/terms');
  expect(body, '企画一覧が載っていない').toContain('/events');
  expect(body, '管理画面が載っている').not.toContain('/admin');
});
