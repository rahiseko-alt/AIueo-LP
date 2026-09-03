import { test, expect, Page } from '@playwright/test';

/**
 * 受け入れ条件。値はすべて実ブラウザでの計測にもとづく。
 *
 * 認証が必要なページ（/member/**、/admin/**）は対象外。ログインなしでは
 * リダイレクトされ、レイアウトの検証にならないため。
 */

const PUBLIC_PATHS = ['/', '/events', '/register', '/contact', '/terms', '/privacy', '/disclaimer'];
const WIDTHS = [360, 390, 768, 1023, 1024, 1025, 1280, 1920];

/** body/html の overflow-x:hidden がはみ出しを隠すため、計測前に無効化する。 */
async function unclipOverflow(page: Page) {
  await page.addStyleTag({ content: 'html, body { overflow-x: visible !important; }' });
}

/** スムーススクロールは完了待ちが不定になるので、アンカー検証中は無効化する。 */
async function disableSmoothScroll(page: Page) {
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
}

/** はみ出している要素のうち、実際にページを広げているものを特定する。 */
async function measureOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;

    // overflow:hidden の祖先に切り取られている要素（カルーセルの画面外カード等）は
    // ページを広げないので、はみ出し源の候補から除外する。
    const isClipped = (el: HTMLElement) => {
      let p = el.parentElement;
      while (p && p !== document.body) {
        if (/hidden|clip|auto|scroll/.test(getComputedStyle(p).overflowX)) return true;
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
}

test.describe('横方向のはみ出し', () => {
  for (const path of PUBLIC_PATHS) {
    for (const width of WIDTHS) {
      test(`${path} @ ${width}px で横スクロールが発生しない`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await unclipOverflow(page);

        const { scrollWidth, clientWidth, widest } = await measureOverflow(page);
        expect(
          scrollWidth,
          `はみ出し源: <${widest.tag}> right=${widest.right}px "${widest.text}"`,
        ).toBeLessThanOrEqual(clientWidth);
      });
    }
  }
});

test('トップの内部アンカーが全て実在し、ジャンプ後に内容がナビの裏に隠れない', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await disableSmoothScroll(page);

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
      .map((a) => a.getAttribute('href')!)
      .filter((h) => h.length > 1),
  );
  expect(hrefs.length).toBeGreaterThan(0);

  for (const href of Array.from(new Set(hrefs))) {
    const target = page.locator(`#${href.slice(1)}`);
    await expect(target, `${href} の飛び先が存在しない`).toHaveCount(1);

    await page.evaluate((h) => {
      location.hash = '';
      location.hash = h;
    }, href);
    await page.waitForTimeout(150);

    // ナビは最上部では画面外に隠れ、スクロールすると現れる。表示・非表示は
    // トランジションなので、遷移中の値で判定しないよう整定を待ってから比べる。
    // セクション自身の上端がナビに重なっても、padding-top で内容が退避していれば読める。
    const readIntrusion = () =>
      target.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const nav = document.querySelector('nav, header');
        const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
        const contentTop = rect.top + parseFloat(getComputedStyle(el).paddingTop || '0');
        // 正の値 = 内容がナビの裏に隠れている量(px)
        return Math.round((navBottom - contentTop) * 100) / 100;
      });

    await expect
      .poll(readIntrusion, {
        message: `${href} へジャンプ後、内容がナビの裏に隠れたまま整定した`,
        timeout: 3000,
      })
      .toBeLessThanOrEqual(1);
  }
});

test('人物カードにフォールバック文言が出ない', async ({ page }) => {
  // 修正前: activityIds が解決できず、10行中6行が 'AI Sprint / Workshop' になっていた
  await page.goto('/');
  const team = page.locator('#team');
  await expect(team).toHaveCount(1);
  await expect(
    team.getByText('AI Sprint / Workshop', { exact: false }),
    'activityIds の解決に失敗しフォールバックが表示されている',
  ).toHaveCount(0);
});

test.describe('コンソールエラー・リクエスト失敗', () => {
  for (const path of PUBLIC_PATHS) {
    test(`${path} でエラーが発生しない`, async ({ page }) => {
      const problems: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
      page.on('requestfailed', (req) => {
        // Next.js は遷移候補を RSC でプリフェッチし、不要になった分を中断する。
        // ページ離脱時の ERR_ABORTED は正常な挙動なので障害として扱わない。
        const aborted = req.failure()?.errorText === 'net::ERR_ABORTED';
        if (aborted && req.url().includes('_rsc=')) return;
        problems.push(`requestfailed: ${req.url()} (${req.failure()?.errorText})`);
      });
      page.on('response', (res) => {
        if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`);
      });

      await page.goto(path, { waitUntil: 'networkidle' });
      expect(problems).toEqual([]);
    });
  }
});
