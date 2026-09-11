/**
 * 企画に画像を添付する経路を、実ブラウザで端から端まで通す。
 *
 * 大きな画像を選ぶ → ブラウザ側で縮む → 保存される → 下書きのうちは他人に
 * 見えない → 公開すると見える → 一覧にも出る → 外せる → 監査ログが肥大化しない、
 * までを1回で確かめる。
 *
 * 単体では動かない。**`scripts/local-verify-rig.sh` から呼ぶこと。**
 */
import { chromium } from 'playwright';
import pg from 'pg';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const EXE = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let ng = 0;
const rec = (id, want, got, ok) => { if (!ok) ng++; console.log(`${ok ? 'OK  ' : 'NG  '} ${id} ${want}\n        → ${got}`); };

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// 実物の大きなPNGを作る（1800x1200）。ブラウザ側の縮小が効くかを見るため、
// わざと表示幅より大きい画像にする。
await page.goto('about:blank');
const pngBase64 = await page.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 1800; c.height = 1200;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 1800, 1200);
  grad.addColorStop(0, '#c8a45a'); grad.addColorStop(1, '#1b2f6b');
  g.fillStyle = grad; g.fillRect(0, 0, 1800, 1200);
  g.fillStyle = '#fff'; g.font = 'bold 160px sans-serif'; g.fillText('TEST IMAGE', 180, 640);
  return c.toDataURL('image/png').split(',')[1];
});
const png = Buffer.from(pngBase64, 'base64');
console.log(`用意した元画像: ${(png.length / 1024).toFixed(0)}KB / 1800x1200 PNG\n`);

await ctx.addCookies([{ name: '__local_user', value: 'local-member-1', url: BASE }]);

// --- 下書きの企画を開いて、画像を添付して保存する ---
const draft = (await pool.query("select id, slug from proposals where slug = 'test-draft'")).rows[0];
await page.goto(`${BASE}/member/proposals/${draft.id}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);

const fileInput = page.locator('input[type="file"]');
rec('I-01', '企画編集画面に画像を選ぶ欄がある', `${await fileInput.count()}個`, (await fileInput.count()) === 1);

await fileInput.setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: png });
await page.waitForTimeout(1500);
const note = await page.locator('text=/この画像を添付します/').textContent().catch(() => null);
rec('I-02', 'ブラウザ側で縮小され、画面に結果が出る', String(note), Boolean(note));

const hidden = await page.locator('input[name="imageData"]').inputValue();
const shrunkKb = Math.round((hidden.length * 3) / 4 / 1024);
rec('I-03', '送信する画像が元より小さい', `元${Math.round(png.length/1024)}KB → 送信${shrunkKb}KB`, shrunkKb > 0 && shrunkKb < png.length / 1024);

// 保存に必要な欄を埋める（金銭欄は「なし」でも入力が要る／掲載確認は編集画面では毎回外れている）
await page.locator('input[name="moneyLabel"]').fill('なし');
await page.locator('input[name="moneySettlement"]').fill('なし');
for (const n of ['prohibitedConfirmed', 'rightsConfirmed', 'moneyConfirmed']) {
  await page.locator(`input[name="${n}"]`).check();
}
await page.locator('button[name="intent"][value="draft"]').click();
await page.waitForTimeout(3000);
const err = await page.locator('[role="alert"]').allTextContents();
if (err.length) console.log('   （画面のエラー表示: ' + JSON.stringify(err) + '）');

const saved = (await pool.query('select image_mime, octet_length(image_data) as bytes from proposals where id = $1', [draft.id])).rows[0];
rec('I-04', '画像がDBへ保存された', `mime=${saved.image_mime} bytes=${saved.bytes}`, saved.image_mime === 'image/jpeg' && saved.bytes > 0);

// --- 下書きの画像は、ログインしていない人には見せない ---
const anon = await browser.newContext();
const anonPage = await anon.newPage();
const r1 = await anon.request.get(`${BASE}/api/proposals/${draft.id}/image`);
rec('I-05', '下書きの画像は未ログインに見せない', `HTTP ${r1.status()}`, r1.status() === 404);

// --- 公開すると誰でも見られる ---
await pool.query("update proposals set status = 'published', published_at = now() where id = $1", [draft.id]);
const r2 = await anon.request.get(`${BASE}/api/proposals/${draft.id}/image`);
rec('I-06', '公開後は未ログインでも画像が見られる', `HTTP ${r2.status()} ${r2.headers()['content-type']}`, r2.status() === 200 && r2.headers()['content-type'] === 'image/jpeg');

// --- 企画ページに画像が出る ---
await anonPage.goto(`${BASE}/events/${draft.slug}`, { waitUntil: 'networkidle' });
const imgOk = await anonPage.evaluate((id) => {
  const img = [...document.querySelectorAll('img')].find((i) => i.src.includes(`/api/proposals/${id}/image`));
  return img ? { found: true, w: img.naturalWidth, h: img.naturalHeight } : { found: false };
}, draft.id);
rec('I-07', '企画詳細ページに画像が実際に描画される', JSON.stringify(imgOk), imgOk.found && imgOk.w > 0);

// --- 一覧にも出る ---
await anonPage.goto(`${BASE}/events`, { waitUntil: 'networkidle' });
const listOk = await anonPage.evaluate((id) => [...document.querySelectorAll('img')].some((i) => i.src.includes(`/api/proposals/${id}/image`) && i.naturalWidth > 0), draft.id);
rec('I-08', '企画一覧のカードにも画像が出る', String(listOk), listOk);

// --- 画像を外す ---
await page.goto(`${BASE}/member/proposals/${draft.id}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
await page.locator('input[name="imageRemove"]').check();
await page.locator('input[name="moneyLabel"]').fill('なし');
await page.locator('input[name="moneySettlement"]').fill('なし');
for (const n of ['prohibitedConfirmed', 'rightsConfirmed', 'moneyConfirmed']) await page.locator(`input[name="${n}"]`).check();
await page.locator('button[name="intent"][value="publish"]').click();
await page.waitForTimeout(2500);
const removed = (await pool.query('select image_mime, image_data from proposals where id = $1', [draft.id])).rows[0];
rec('I-09', '「画像を外す」で画像が消える', `mime=${removed.image_mime}`, removed.image_mime === null && removed.image_data === null);

// --- 監査ログに画像の中身が入っていないこと ---
const big = (await pool.query("select max(length(after_state::text)) as m from audit_log where entity_id = $1", [draft.id])).rows[0];
rec('I-10', '監査ログに画像の中身が入っていない', `after_state 最大 ${big.m} 文字`, Number(big.m) < 20000);

await browser.close();
await pool.end();
console.log(`\n===== 画像 判定: ${ng === 0 ? 'OK' : 'NG'} (NG ${ng}件) =====`);
process.exit(ng === 0 ? 0 : 1);
