import { test, expect } from '@playwright/test';

test('ヘッダーメニューが開閉でき、Home / About / Events の各導線が利用可能である', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await page.waitForFunction(() => {
    const intro = document.getElementById('intro-warp-title');
    return !intro || getComputedStyle(intro).display === 'none';
  }, { timeout: 15000 });

  const toggle = page.locator('#header-right-menu-btn');
  await expect(toggle).toBeVisible();
  await toggle.click();

  const menu = page.locator('#header-menu');
  await expect(menu).toHaveClass(/--opened/);
  await expect(menu.locator('.header-menu-link[data-page="home"]')).toBeVisible();
  await expect(menu.locator('.header-menu-link[data-page="about"]')).toBeVisible();
  await expect(menu.locator('.header-menu-link[data-page="projects"]')).toBeVisible();

  await toggle.click();
  await expect(menu).not.toHaveClass(/--opened/);
});

test('企画提案モーダルがdialogとして開き、同意前は送信不可・Escapeで閉じる', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => {
    const intro = document.getElementById('intro-warp-title');
    return !intro || getComputedStyle(intro).display === 'none';
  }, { timeout: 15000 });

  const trigger = page.locator('#home-featured-cta');
  await page.evaluate(() => {
    const el = document.getElementById('home-featured-cta');
    const sm = (window as unknown as { scrollManager?: { getDomRange?: (e: Element) => { top: number }; scrollToPixel?: (y: number, immediate?: boolean) => void } }).scrollManager;
    if (el && sm?.getDomRange && sm?.scrollToPixel) {
      sm.scrollToPixel(Math.max(0, sm.getDomRange(el).top - 200), true);
    }
  });
  await page.waitForTimeout(300);
  await trigger.click();

  const modal = page.locator('#proposal-guidelines-modal');
  await expect(modal).toHaveAttribute('aria-hidden', 'false');
  await expect(page.getByRole('dialog')).toBeVisible();

  const approveBtn = page.locator('#proposal-modal-approve');
  await expect(approveBtn).toBeDisabled();
  await page.locator('#proposal-agree-checkbox').check();
  await expect(approveBtn).toBeEnabled();

  await page.keyboard.press('Escape');
  await expect(modal).toHaveAttribute('aria-hidden', 'true');
});
