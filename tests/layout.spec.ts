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

test('トップのメンバー表示とSNSリンクが正しく設定されている', async ({ page }) => {
  await page.goto('/');
  const members = page.locator('#home-members');
  await expect(members).toHaveCount(1);
  await expect(members).toContainText('渡部 裕太');
  await expect(members).not.toContainText('渡辺 裕太');

  const kosehiraSns = await members.locator('.member-card[data-id="kosehira"] .sns-btn').evaluateAll((els) =>
    els.map((el) => el.getAttribute('href')),
  );
  expect(kosehiraSns).toEqual(['https://x.com/kosehirax', 'https://kouheikosehira.com']);

  const placeholders = await members.locator('a[href]').evaluateAll((els) =>
    els
      .map((el) => el.getAttribute('href'))
      .filter((h) => h && ['https://x.com', 'https://note.com', 'https://github.com', 'https://twitter.com/kosehirakouhei'].includes(h)),
  );
  expect(placeholders).toEqual([]);
});

test.describe('コンソールエラー・リクエスト失敗', () => {
  for (const path of PUBLIC_PATHS) {
    test(`${path} でエラーが発生しない`, async ({ page }) => {
      const problems: string[] = [];
      if (path === '/') {
        await page.route(
          /^https:\/\/(www\.googletagmanager\.com|www\.google-analytics\.com|player\.vimeo\.com|.*\.challenges\.cloudflare\.com|challenges\.cloudflare\.com)\//,
          (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '' }),
        );
      }
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

      // `networkidle` で待ってはいけない。App Router は画面内のリンクを次々に RSC で
      // プリフェッチするため、リンクが最も多い `/` では「500ms 通信が無い」状態に
      // 到達しないことがある。2026-09-06 と 2026-09-10 に、文書だけを変えた PR で
      // この行が30秒のタイムアウトで落ちた（どちらもアプリのコードは1行も触っていない）。
      //
      // このテストが見たいのは「遅れて出るコンソールエラーと失敗リクエストが無いこと」
      // である。通信が完全に止まることは条件ではない。`load` まで待ち、そのあと
      // 短く待って遅れて出る分を拾う。
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load');
      await page.waitForTimeout(1500);
      expect(problems).toEqual([]);
    });
  }
});
