import { test, expect, type Page } from '@playwright/test';

const STUB_EXTERNAL_RE =
  /^https:\/\/(player\.vimeo\.com|f\.vimeocdn\.com|www\.googletagmanager\.com|static\.cloudflareinsights\.com)\//;

async function prepareLpPage(page: Page, readySelector: string): Promise<void> {
  test.slow();
  await page.route(STUB_EXTERNAL_RE, (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: '' })
  );
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForSelector(readySelector);
  await page.evaluate(() => {
    const intro = document.getElementById('intro-warp-title');
    if (intro) intro.style.display = 'none';
  });
  await page.waitForFunction(
    (sel) => {
      const w = window as unknown as { properties?: { hasStarted?: boolean } };
      const pre = document.getElementById('preloader');
      const preHidden =
        !pre ||
        getComputedStyle(pre).display === 'none' ||
        getComputedStyle(pre).pointerEvents === 'none';
      return !!document.querySelector(sel) && !!w.properties?.hasStarted && preHidden;
    },
    readySelector,
    { timeout: 30000 }
  );
}

test('ヘッダーメニューが開閉でき、Home / About / Events の各導線が利用可能である', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await prepareLpPage(page, '#header-right-menu-btn');

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
  await prepareLpPage(page, '#home-featured-cta');
  await page.waitForFunction(
    () => {
      const w = window as unknown as {
        scrollManager?: { contentSizePixel?: number; getDomRange?: (e: Element) => { top: number } };
      };
      const el = document.getElementById('home-featured-cta');
      return !!el && !!w.scrollManager && (w.scrollManager.contentSizePixel ?? 0) > 0 && (w.scrollManager.getDomRange?.(el)?.top ?? 0) > 0;
    },
    null,
    { timeout: 20000 }
  );
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
  await page.waitForFunction(
    () => {
      const el = document.getElementById('home-featured-cta');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.height <= 0 || r.top < 0 || r.bottom > window.innerHeight) return false;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && el.contains(hit);
    },
    null,
    { timeout: 10000 }
  );

  const trigger = page.locator('#home-featured-cta');
  await trigger.click({ force: true });

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
