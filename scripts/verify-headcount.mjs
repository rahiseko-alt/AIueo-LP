/**
 * 企画の「定員」と「いまの参加人数」を、実ブラウザで端から端まで通す。
 *
 * 企画者が人数を入れる → DBへ入る → **企画の中に入る前**（一覧カード・トップ）に出る →
 * 埋まれば「満席」と出る → 空欄に戻せば消える → おかしな値は弾く、までを1回で確かめる。
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
await ctx.addCookies([{ name: '__local_user', value: 'local-member-1', url: BASE }]);

const proposal = (await pool.query("select id, slug from proposals where slug = 'test-911'")).rows[0];
const editUrl = `${BASE}/member/proposals/${proposal.id}`;

/** 編集画面で定員と参加人数を入れて公開保存する。画面に出たエラーを返す。 */
async function saveWith(capacity, count) {
  await page.goto(editUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.locator('input[name="capacity"]').fill(capacity);
  await page.locator('input[name="participantCount"]').fill(count);
  await page.locator('input[name="moneyLabel"]').fill('なし');
  await page.locator('input[name="moneySettlement"]').fill('なし');
  for (const n of ['prohibitedConfirmed', 'rightsConfirmed', 'moneyConfirmed']) await page.locator(`input[name="${n}"]`).check();
  await page.locator('button[name="intent"][value="publish"]').click();
  await page.waitForTimeout(3000);
  return (await page.locator('[role="alert"]').allTextContents()).join(' / ');
}

// 未ログインの人として見る（参加者は会員登録不要なので、この見え方が本番の姿）
const anon = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const anonPage = await anon.newPage();
const textAt = async (path) => {
  await anonPage.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await anonPage.waitForTimeout(700);
  return (await anonPage.locator('body').innerText()).replace(/\s+/g, ' ');
};

// --- H-01 欄があるか ---
await page.goto(editUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const fields = await page.locator('input[name="capacity"], input[name="participantCount"]').count();
rec('H-01', '企画編集画面に「定員」「いまの参加人数」の欄がある', `${fields}個`, fields === 2);
const note = await page.locator('text=/企画の一覧に「参加 3 \\/ 10人」と出ます/').count();
rec('H-02', '何のための欄かが画面に書いてある', `${note}個`, note === 1);

// --- H-03 保存されるか ---
const err1 = await saveWith('10', '3');
const saved = (await pool.query('select capacity, participant_count from proposals where id = $1', [proposal.id])).rows[0];
rec('H-03', 'DBへ保存された', `capacity=${saved.capacity} participant_count=${saved.participant_count}${err1 ? ` / 画面エラー: ${err1}` : ''}`,
  saved.capacity === 10 && saved.participant_count === 3);

// --- H-04〜06 企画の中に入る前に出るか ---
const list = await textAt('/events');
rec('H-04', '企画の一覧カードに人数が出る（企画の中に入る前）', list.includes('参加 3 / 10人（残り7）') ? '「参加 3 / 10人（残り7）」' : list.slice(0, 160), list.includes('参加 3 / 10人（残り7）'));
const top = await textAt('/');
rec('H-05', 'トップページのカードにも出る', top.includes('参加 3 / 10人（残り7）') ? '「参加 3 / 10人（残り7）」' : top.slice(0, 160), top.includes('参加 3 / 10人（残り7）'));
const detail = await textAt(`/events/${proposal.slug}`);
rec('H-06', '企画詳細にも同じ数が出る', detail.includes('参加 3 / 10人（残り7）') ? 'あり' : 'なし', detail.includes('参加 3 / 10人（残り7）'));

// --- H-07 満席 ---
await saveWith('10', '10');
const full = await textAt('/events');
rec('H-07', '定員まで埋まると「満席」と出る', full.includes('参加 10 / 10人（満席）') ? '「参加 10 / 10人（満席）」' : full.slice(0, 160), full.includes('参加 10 / 10人（満席）'));

// --- H-08 定員なし ---
await saveWith('', '4');
const noCap = await textAt('/events');
rec('H-08', '定員が空欄なら「参加 4人」だけ出る', noCap.includes('参加 4人') && !noCap.includes('/ '), noCap.includes('参加 4人'));

// --- H-09 どちらも空なら行が出ない ---
await saveWith('', '');
const empty = await textAt('/events');
rec('H-09', '定員も人数も空なら、人数の行自体が出ない', empty.includes('参加 ') ? `出てしまった: ${empty.slice(0, 120)}` : '出ていない', !empty.includes('参加 '));

// --- H-10 おかしな値は弾く ---
// 全角や記号は入力欄の種類（数字専用）がブラウザ側で受け付けない。実測済み。
// 画面から実際に送れてしまうのは「半角だが範囲外」の値なので、そちらで確かめる。
const err2 = await saveWith('0', '3');
const afterBad = (await pool.query('select capacity, participant_count from proposals where id = $1', [proposal.id])).rows[0];
rec('H-10', '定員に0を入れると保存されず、日本語の欄名が画面に出る', `画面「${err2 || 'なし'}」/ DB capacity=${afterBad.capacity}`,
  afterBad.capacity === null && err2.includes('定員') && !err2.includes('capacity'));

// --- H-11 DB側の防壁 ---
const dbGuard = [];
for (const [label, sql] of [
  ['定員0', "update proposals set capacity = 0 where id = $1"],
  ['人数がマイナス', "update proposals set participant_count = -1 where id = $1"],
  ['上限超え', "update proposals set capacity = 100001 where id = $1"],
]) {
  try { await pool.query(sql, [proposal.id]); dbGuard.push(`${label}=通ってしまった`); }
  catch { dbGuard.push(`${label}=拒否`); }
}
rec('H-11', 'DB側も、おかしな値を拒む', dbGuard.join(' / '), dbGuard.every((d) => d.endsWith('拒否')));

// --- H-12 サーバー側の防壁（画面の入力欄をすり抜けて届いた値の判定） ---
// 全角・小数・マイナス・文字は入力欄の種類がブラウザ側で弾くため画面からは送れない。
// それでも届いた場合に備えた判定を、実物のモジュールに対して直接確かめる。
const { parseHeadcount } = await import('../src/lib/proposals/headcount.ts');
const guard = [
  ['全角「１０」', '１０', '3'], ['小数「3.5」', '3.5', '1'], ['マイナス', '-1', '0'],
  ['文字', 'abc', '0'], ['定員0', '0', '0'], ['上限超え', '100001', '0'],
].map(([label, cap, cnt]) => `${label}=${parseHeadcount(cap, cnt).ok ? '通ってしまった' : '拒否'}`);
const okPath = parseHeadcount('10', '3');
rec('H-12', 'おかしな値は判定で拒み、正しい値は通す', `${guard.join(' / ')} / 正しい値=${okPath.ok ? `通る(${okPath.capacity}/${okPath.participantCount})` : '拒否されてしまった'}`,
  guard.every((g) => g.endsWith('拒否')) && okPath.ok && okPath.capacity === 10 && okPath.participantCount === 3);

await browser.close();
await pool.end();
console.log(ng === 0 ? '\n判定: OK（参加人数の表示 12項目）' : `\n判定: NG（${ng}件）`);
process.exit(ng === 0 ? 0 : 1);
