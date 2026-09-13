/**
 * 参加申し込みフォームのURLを、実ブラウザで端から端まで通す。
 *
 * 企画者が申し込みフォームのURLを貼る → 保存される → 公開ページに
 * 「参加を申し込む」ボタンが出る → 押すと外部サイトが別タブで開く →
 * 危険なURLは弾かれる → 空欄に戻すとボタンが消える、までを1回で確かめる。
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

const FORM_URL = 'https://forms.gle/aiueo-test-form';

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await ctx.addCookies([{ name: '__local_user', value: 'local-member-1', url: BASE }]);

const proposal = (await pool.query("select id, slug from proposals where slug = 'test-911'")).rows[0];
const editUrl = `${BASE}/member/proposals/${proposal.id}`;

/** 編集画面を開き、必須欄を埋めたうえで申し込みURLを入れて保存する。 */
async function saveWith(url) {
  await page.goto(editUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.locator('input[name="applicationUrl"]').fill(url);
  await page.locator('input[name="moneyLabel"]').fill('なし');
  await page.locator('input[name="moneySettlement"]').fill('なし');
  for (const n of ['prohibitedConfirmed', 'rightsConfirmed', 'moneyConfirmed']) {
    await page.locator(`input[name="${n}"]`).check();
  }
  await page.locator('button[name="intent"][value="publish"]').click();
  await page.waitForTimeout(3000);
  return (await page.locator('[role="alert"]').allTextContents()).join(' / ');
}

// --- A-01 欄そのものがあるか ---
await page.goto(editUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const field = page.locator('input[name="applicationUrl"]');
rec('A-01', '企画編集画面に申し込みフォームURLの欄がある', `${await field.count()}個`, (await field.count()) === 1);
const desc = await page.locator('text=/申し込んだ人の名前や連絡先はAIueoには届きません/').count();
rec('A-02', 'AIueoが申し込みを受け取らないと画面に書いてある', `${desc}個`, desc === 1);

// --- A-03 保存できるか ---
const err1 = await saveWith(FORM_URL);
const stored = (await pool.query('select application_url from proposals where id = $1', [proposal.id])).rows[0];
rec('A-03', 'DBへ保存された', `application_url=${stored.application_url}${err1 ? ` / 画面エラー: ${err1}` : ''}`, stored.application_url === FORM_URL);

// --- A-04/05/06 公開ページにボタンが出るか（未ログインの人として見る） ---
const anon = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const anonPage = await anon.newPage();
await anonPage.goto(`${BASE}/events/${proposal.slug}`, { waitUntil: 'domcontentloaded' });
await anonPage.waitForTimeout(600);
const btn = anonPage.locator(`a[href="${FORM_URL}"]`);
rec('A-04', '公開ページに「参加を申し込む」ボタンが出る', `${await btn.count()}個 / 文言「${(await btn.first().textContent().catch(() => '')) ?? ''}」`, (await btn.count()) === 1);
// ボタンが無いときに例外で落ちると、他の項目の結果が読めなくなる。NGとして先へ進む。
const hasBtn = (await btn.count()) === 1;
const target = hasBtn ? await btn.first().getAttribute('target') : null;
const rel = hasBtn ? await btn.first().getAttribute('rel') : null;
rec('A-05', '別タブで開き、元ページの乗っ取りを防ぐ印が付いている', `target=${target} rel=${rel}`, target === '_blank' && String(rel).includes('noopener'));
const warn = await anonPage.locator('text=/AIueoの外にあるページ/').count();
rec('A-06', '外部サイトへ移ることが画面に書いてある', `${warn}個`, warn === 1);

// --- A-07 実際に押すと、そのURLが別タブで開くか ---
// forms.gle は実在しない検証用の値で、この環境からは到達できない。押した結果を
// 見るために、ここだけ到達できるURLへ入れ替えて押す（仕組みは同じ）。
const REACHABLE = `${BASE}/events?from=form`;
await saveWith(REACHABLE);
await anonPage.goto(`${BASE}/events/${proposal.slug}`, { waitUntil: 'domcontentloaded' });
await anonPage.waitForTimeout(600);
const reachableBtn = anonPage.locator(`a[href="${REACHABLE}"]`);
const [popup] = (await reachableBtn.count()) === 1
  ? await Promise.all([
      anon.waitForEvent('page', { timeout: 15000 }).catch(() => null),
      reachableBtn.first().click(),
    ])
  : [null];
if (popup) await popup.waitForLoadState('domcontentloaded').catch(() => {});
rec('A-07', '押すと申し込みフォームが別タブで開く', popup ? popup.url() : '開かなかった', Boolean(popup) && popup.url().includes('from=form'));

// 以降の検証のためにフォームURLを戻す
await saveWith(FORM_URL);

// --- A-08 危険なURLは弾かれるか（画面から入れても、DBの値が変わらない） ---
const err2 = await saveWith('javascript:alert(document.cookie)');
const after = (await pool.query('select application_url from proposals where id = $1', [proposal.id])).rows[0];
rec('A-08', 'javascript: のURLは保存されない', `画面のエラー「${err2 || 'なし'}」/ DB=${after.application_url}`, after.application_url === FORM_URL);
rec('A-09', '弾いた理由が画面に出る', `「${err2 || 'なし'}」`, err2.includes('https://'));

// --- A-10 空欄に戻すとボタンが消えるか ---
await saveWith('');
const cleared = (await pool.query('select application_url from proposals where id = $1', [proposal.id])).rows[0];
await anonPage.goto(`${BASE}/events/${proposal.slug}`, { waitUntil: 'domcontentloaded' });
await anonPage.waitForTimeout(600);
const gone = await anonPage.locator('text=/参加を申し込む/').count();
rec('A-10', '空欄に戻すとボタンが消える', `DB=${cleared.application_url} / 画面のボタン=${gone}個`, cleared.application_url === null && gone === 0);

// 後片付け（他の検証が使うので元に戻す）
await pool.query('update proposals set application_url = null where id = $1', [proposal.id]);

await browser.close();
await pool.end();
console.log(ng === 0 ? '\n判定: OK（申し込みフォームURL 10項目）' : `\n判定: NG（${ng}件）`);
process.exit(ng === 0 ? 0 : 1);
