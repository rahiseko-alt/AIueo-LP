import { test, expect, Page } from '@playwright/test';

/**
 * 受け入れ条件。値はすべて実ブラウザでの実測にもとづく。
 * 修正前の実測値をコメントに残しているので、回帰したときに何が戻ったか分かる。
 */

const WIDTHS = [360, 390, 768, 1023, 1024, 1025, 1280, 1920];
const NAV_HEIGHT_MAX = 68; // navbar.tsx: h-16 md:h-[68px]

/** body/html の overflow-x:hidden がはみ出しを隠すため、計測前に無効化する。 */
async function unclipOverflow(page: Page) {
  await page.addStyleTag({
    content: 'html, body { overflow-x: visible !important; }',
  });
}

/** スムーススクロールは完了待ちが不定になるので、アンカー検証中は無効化する。 */
async function disableSmoothScroll(page: Page) {
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
}

test.describe('横方向のはみ出し', () => {
  for (const width of WIDTHS) {
    test(`${width}px で横スクロールが発生しない`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await unclipOverflow(page);

      const { scrollWidth, clientWidth, widest } = await page.evaluate(() => {
        const doc = document.documentElement;

        // overflow:hidden の祖先に切り取られている要素（カルーセルの画面外スライド等）は
        // 実際にはページを広げないので、はみ出し源の候補から除外する。
        const isClipped = (el: HTMLElement) => {
          let p = el.parentElement;
          while (p && p !== document.body) {
            const o = getComputedStyle(p);
            if (/hidden|clip|auto|scroll/.test(o.overflowX)) return true;
            p = p.parentElement;
          }
          return false;
        };

        let widest = { tag: '(なし)', text: '', right: 0 };
        for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
          const right = el.getBoundingClientRect().right;
          if (right > widest.right && !isClipped(el)) {
            widest = {
              tag: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
              text: (el.textContent || '').trim().slice(0, 40),
              right,
            };
          }
        }
        return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, widest };
      });

      expect(
        scrollWidth,
        `はみ出し源: <${widest.tag}> right=${widest.right}px "${widest.text}"`,
      ).toBeLessThanOrEqual(clientWidth);
    });
  }
});

test.describe('WhoWeAre スライダーの高さ', () => {
  // 修正前の実測: 1023px→480 / 1024px→5 / 1025px→708
  for (const width of [1023, 1024, 1025]) {
    test(`${width}px でスライダーが潰れない`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const box = await page.getByTestId('who-slider').boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(400);
    });
  }
});

test('内部アンカーが全て実在し、ジャンプ後に見出しがナビの裏に隠れない', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await disableSmoothScroll(page);

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
      .map((a) => a.getAttribute('href')!)
      .filter((h) => h.length > 1),
  );
  expect(hrefs.length).toBeGreaterThan(0);

  const targets = Array.from(new Set(hrefs));
  for (const href of targets) {
    const id = href.slice(1);
    const target = page.locator(`#${id}`);
    await expect(target, `${href} の飛び先が存在しない`).toHaveCount(1);

    await page.evaluate((h) => {
      location.hash = '';
      location.hash = h;
    }, href);
    await page.waitForTimeout(150);

    // セクション自身の上端がナビに重なっても、padding-top で内容が退避していれば読める。
    // 判定対象は「内容の開始位置」にする。
    const contentTop = await target.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top + parseFloat(getComputedStyle(el).paddingTop || '0');
    });
    expect(
      contentTop,
      `${href} へジャンプ後、内容がナビの裏に隠れている (contentTop=${contentTop})`,
    ).toBeGreaterThanOrEqual(NAV_HEIGHT_MAX - 1);
  }
});

test('TeamMembers にフォールバック文言が出ない', async ({ page }) => {
  // 修正前の実測: "Collaborated on:" 10行中 6行が 'AI Sprint / Workshop'
  await page.goto('/');
  const team = page.locator('#team');
  await expect(team).toHaveCount(1);
  await expect(
    team.getByText('AI Sprint / Workshop', { exact: false }),
    'activityIds の解決に失敗しフォールバックが表示されている',
  ).toHaveCount(0);
});

test('コンソールエラー・リクエスト失敗が発生しない', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) =>
    problems.push(`requestfailed: ${req.url()} (${req.failure()?.errorText})`),
  );
  page.on('response', (res) => {
    if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`);
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  expect(problems).toEqual([]);
});
