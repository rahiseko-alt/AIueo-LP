import { test, expect } from '@playwright/test';

test('モバイルドロワーがdialogとして開き、Escapeで閉じ、トリガーへフォーカスが戻る', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(400);
  const toggle = page.locator('button[aria-controls="mobile-drawer"]');
  await expect(toggle).toHaveAttribute('aria-controls', 'mobile-drawer');
  await toggle.click();
  const drawer = page.getByRole('dialog', { name: 'メニュー' });
  await expect(drawer).toBeVisible();
  await expect(drawer).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('スキップリンクがフォーカスで可視化し、本文へフォーカスを移動する', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: '本文へスキップ' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('未スクロール時のナビはinertでTabフォーカスされない', async ({ page }) => {
  await page.goto('/');
  const brandLink = page.getByRole('link', { name: 'AI League AIueo' });
  await expect(brandLink).toBeAttached();
  await page.keyboard.press('Tab');
  const isBrandLinkFocused = await brandLink.evaluate((el) => el === document.activeElement);
  expect(isBrandLinkFocused).toBe(false);
});
