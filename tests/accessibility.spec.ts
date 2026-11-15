import { test, expect } from '@playwright/test';

test('ヘッダーメニューが開閉でき、Home / About / Events の各導線が利用可能である', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForSelector('#header-right-menu-btn');
  await page.evaluate(() => {
    const intro = document.getElementById('intro-warp-title');
    if (intro) intro.style.display = 'none';
  });

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
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForSelector('#home-featured-cta');
  await page.evaluate(() => {
    const intro = document.getElementById('intro-warp-title');
    if (intro) intro.style.display = 'none';
  });
  await page
    .waitForFunction(
      () => {
        const sm = (window as unknown as {
          scrollManager?: { contentSizePixel?: number; getDomRange?: (e: Element) => { top: number } };
        }).scrollManager;
        const el = document.getElementById('home-featured-cta');
        const pre = document.getElementById('preloader');
        const preHidden =
          !pre ||
          getComputedStyle(pre).display === 'none' ||
          getComputedStyle(pre).pointerEvents === 'none';
        return !!el && !!sm && (sm.contentSizePixel ?? 0) > 0 && (sm.getDomRange?.(el)?.top ?? 0) > 0 && preHidden;
      },
      null,
      { timeout: 20000 }
    )
    .catch(() => {});
  await page.evaluate(() => {
    const el = document.getElementById('home-featured-cta');
    const sm = (window as unknown as {
      scrollManager?: { getDomRange?: (e: Element) => { top: number }; scrollToPixel?: (y: number, immediate?: boolean) => void };
    }).scrollManager;
    if (el && sm?.getDomRange && sm?.scrollToPixel) {
      sm.scrollToPixel(Math.max(0, sm.getDomRange(el).top - 200), true);
    } else if (el) {
      el.scrollIntoView({ block: 'center' });
    }
  });
  await page
    .waitForFunction(
      () => {
        const el = document.getElementById('home-featured-cta');
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
      },
      null,
      { timeout: 5000 }
    )
    .catch(() => {});

  const trigger = page.locator('#home-featured-cta');
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
