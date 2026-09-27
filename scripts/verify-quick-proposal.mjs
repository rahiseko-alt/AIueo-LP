/**
 * 企画登録の短縮（P40）を、実ブラウザとDBで端から端まで確かめる。
 *
 * 受け入れ条件（ユーザー承認 2026-09-27）の実測項目を、肯定・否定・改ざんの3方向で通す。
 * 単体では動かない。**`scripts/local-verify-rig.sh` から呼ぶこと。**
 */
import { chromium } from 'playwright';
import pg from 'pg';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const EXE = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let ng = 0;
const rec = (id, want, got, ok) => { if (!ok) ng++; console.log(`${ok ? 'OK  ' : 'NG  '} ${id} ${want}\n        → ${got}`); };

const jstDate = (offsetDays) => new Date(Date.now() + 9 * 3600e3 + offsetDays * 86400e3).toISOString().slice(0, 10);
const count = async () => Number((await pool.query("select count(*) from proposals where owner_id = 'local-member-1'")).rows[0].count);
const latest = async () => (await pool.query("select * from proposals where owner_id = 'local-member-1' order by created_at desc limit 1")).rows[0];

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await ctx.addCookies([{ name: '__local_user', value: 'local-member-1', url: BASE }]);

async function openNew() {
  await page.goto(`${BASE}/member/proposals/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('textarea[name="body"]');
  await page.waitForTimeout(800);
}

// ---- Q-01 最短の4操作で公開できる（開催決定） ----
const date10 = jstDate(10);
await openNew();
const before = await count();
await page.fill('textarea[name="body"]', 'カレーを作りながらAIの話をする会\n世田谷の公民館でやります。');
await page.fill('input[name="participationMethod"]', '当日そのままお越しください');
await page.fill('input[name="tentativeDate"]', date10);
await page.click('button[name="intent"][value="publish_confirmed"]');
await page.waitForURL('**/member/proposals/*?published=1', { timeout: 30000 }).catch(() => {});
let p = await latest();
rec('Q-01', '本文・参加方法・開催日・公開の4操作で公開される', `件数 ${before}→${await count()} / status=${p?.status} / event=${p?.event_status}`, (await count()) === before + 1 && p.status === 'published' && p.event_status === 'confirmed');
rec('Q-02', '企画名は本文の1行目', p?.title, p?.title === 'カレーを作りながらAIの話をする会');
const startIso = new Date(p.tentative_starts_at).toISOString();
const wantStart = new Date(`${date10}T00:00:00+09:00`).toISOString();
rec('Q-03', `日付だけの入力は JST 0時で保存（${wantStart}）`, startIso, startIso === wantStart);
const wantExpiry = new Date(`${date10}T23:59:59+09:00`).toISOString();
rec('Q-04', '公開期限の既定は開催日の23:59:59 JST', new Date(p.public_expires_at).toISOString(), new Date(p.public_expires_at).toISOString() === wantExpiry);
rec('Q-05', '時刻・形式は「指定なし」で記録', `time=${p.tentative_time_specified} format=${p.format_specified}`, p.tentative_time_specified === false && p.format_specified === false);
rec('Q-06', '金銭は「なし」で記録', `${p.money_type} ${JSON.stringify(p.money_details)}`, p.money_type === 'none' && p.money_details?.label === 'なし');
rec('Q-07', '主催者名は公開名', p.organizer_name, p.organizer_name === 'テスト会員');
const decl = p.publishing_declarations ?? {};
rec('Q-08', '公開の確認記録（方式・版・ハッシュ・日時・実行者）', JSON.stringify(decl).slice(0, 160), decl.method === 'button' && decl.statement_version && /^[0-9a-f]{64}$/.test(decl.statement_hash ?? '') && decl.actor_id === 'local-member-1' && decl.confirmed_at);
const banner = await page.locator('[role="status"]').first().textContent().catch(() => '');
rec('Q-09', '公開直後に「公開しました」と公開ページへの導線', banner?.trim().slice(0, 40), /公開しました/.test(banner ?? ''));
const quickSlug = p.slug;

// ---- 表示: 時刻なしは日付だけ、形式は断定しない ----
await page.goto(`${BASE}/events/${quickSlug}`, { waitUntil: 'domcontentloaded' });
const detail = await page.locator('dl').first().innerText();
rec('Q-10', '企画詳細: 時刻なしで 0:00 を出さず、形式を断定しない', detail.replace(/\s+/g, ' ').slice(0, 120), !/0:00|00:00/.test(detail) && /本文参照/.test(detail) && !/オフライン/.test(detail));
await page.goto(`${BASE}/events`, { waitUntil: 'domcontentloaded' });
const card = await page.locator(`a[href="/events/${quickSlug}"]`).innerText();
rec('Q-11', '企画一覧: 日付が出て、0:00 は出ない', card.split('\n')[0], new RegExp(`${Number(date10.slice(5, 7))}/${Number(date10.slice(8, 10))}`).test(card) && !/00:00/.test(card));
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
const top = await page.locator('#events').innerText().catch(() => '');
rec('Q-12', 'トップ: 0:00 は出ない', top.includes('カレー') ? '企画あり' : '企画なし', top.includes('カレー') && !/00:00/.test(top));
await page.goto(`${BASE}/member/proposals`, { waitUntil: 'domcontentloaded' });
const mine = await page.locator('main').innerText();
rec('Q-13', '自分の企画一覧: 開催日が出る', /開催日:/.test(mine) ? 'あり' : 'なし', /開催日:/.test(mine) && !/00:00/.test(mine));

// ---- Q-14 時刻を入れれば時刻が出る ----
await openNew();
await page.fill('textarea[name="body"]', '時刻ありの会\n内容');
await page.fill('input[name="participationMethod"]', 'https://forms.gle/example');
await page.fill('input[name="tentativeDate"]', jstDate(12));
await page.fill('input[name="tentativeTime"]', '19:30');
await page.click('button[name="intent"][value="publish_planning"]');
await page.waitForURL('**/member/proposals/*?published=1', { timeout: 30000 }).catch(() => {});
p = await latest();
await page.goto(`${BASE}/events/${p.slug}`, { waitUntil: 'domcontentloaded' });
const timed = await page.locator('dl').first().innerText();
rec('Q-14', '時刻を入れた企画は時刻が出る・調整中で公開・URLは申込ボタンになる', `${p.event_status} / ${/19:30/.test(timed) ? '19:30あり' : '時刻なし'} / url=${p.application_url}`, p.event_status === 'planning' && /19:30/.test(timed) && p.application_url === 'https://forms.gle/example');

// ---- Q-15 3日以内は「調整中」を押せず、改ざんしてもサーバーが拒む ----
await openNew();
await page.fill('textarea[name="body"]', '近い日の会\n内容');
await page.fill('input[name="participationMethod"]', '当日どうぞ');
await page.fill('input[name="tentativeDate"]', jstDate(2));
const disabled = await page.locator('button[name="intent"][value="publish_planning"]').isDisabled();
const n15 = await count();
await page.evaluate(() => document.querySelector('button[name="intent"][value="publish_planning"]').removeAttribute('disabled'));
await page.click('button[name="intent"][value="publish_planning"]');
await page.waitForTimeout(2500);
const err15 = await page.locator('[role="alert"]').first().textContent().catch(() => '');
rec('Q-15', '3日以内: 調整中ボタンは無効、改ざんして押しても保存されない', `disabled=${disabled} / 件数 ${n15}→${await count()} / ${err15?.slice(0, 30)}`, disabled && (await count()) === n15 && /3日以内/.test(err15 ?? ''));
rec('Q-16', '失敗しても本文・参加方法・日付が残る', await page.inputValue('input[name="tentativeDate"]'), (await page.inputValue('textarea[name="body"]')).startsWith('近い日の会') && (await page.inputValue('input[name="participationMethod"]')) === '当日どうぞ' && (await page.inputValue('input[name="tentativeDate"]')) === jstDate(2));
// 同じ日付でも「開催決定」なら公開できる
await page.click('button[name="intent"][value="publish_confirmed"]');
await page.waitForURL('**/member/proposals/*?published=1', { timeout: 30000 }).catch(() => {});
rec('Q-17', '3日以内でも「開催決定として公開」は通る', `件数 ${n15}→${await count()}`, (await count()) === n15 + 1 && (await latest()).event_status === 'confirmed');

// ---- Q-18 下書きは確認記録が空 ----
await openNew();
await page.fill('textarea[name="body"]', '下書きの会\n内容');
await page.fill('input[name="participationMethod"]', '未定');
await page.fill('input[name="tentativeDate"]', jstDate(20));
await page.click('button[name="intent"][value="draft"]');
await page.waitForURL(/\/member\/proposals\/[0-9a-f-]{36}$/, { timeout: 30000 }).catch(() => {});
p = await latest();
rec('Q-18', '下書き保存では確認記録が {}', `${p.status} ${JSON.stringify(p.publishing_declarations)}`, p.status === 'draft' && JSON.stringify(p.publishing_declarations) === '{}');

// ---- Q-19 編集画面から公開すると確認記録が入る ----
await page.goto(`${BASE}/member/proposals/${p.id}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const editTime = await page.inputValue('input[name="tentativeTime"]');
const editFormat = await page.inputValue('select[name="format"]');
await page.click('button[name="intent"][value="publish"]');
await page.waitForTimeout(3000);
const p19 = (await pool.query('select * from proposals where id = $1', [p.id])).rows[0];
rec('Q-19', '編集から公開: 確認記録が入り、時刻・形式は未指定のまま', `time欄="${editTime}" format欄="${editFormat}" / ${p19.status} ${p19.publishing_declarations?.method} / time=${p19.tentative_time_specified} format=${p19.format_specified}`, editTime === '' && editFormat === '' && p19.status === 'published' && p19.publishing_declarations?.method === 'button' && p19.tentative_time_specified === false && p19.format_specified === false);

// ---- Q-20 改ざん: 金銭の種類を抜くと保存されない ----
await openNew();
await page.fill('textarea[name="body"]', '有料の会\n内容');
await page.fill('input[name="participationMethod"]', '当日どうぞ');
await page.fill('input[name="tentativeDate"]', jstDate(15));
await page.click('button:has-text("お金のやり取りがある")');
for (const [n, v] of [['moneyLabel', '参加費1000円'], ['moneyAmount', '1000'], ['moneyRecipient', '主催者'], ['moneySettlement', '当日現金']]) await page.fill(`input[name="${n}"]`, v);
await page.evaluate(() => document.querySelector('select[name="moneyType"]').remove());
const n20 = await count();
await page.click('button[name="intent"][value="publish_confirmed"]');
await page.waitForTimeout(2500);
rec('Q-20', '【改ざん】お金ありで金銭の種類を抜くと保存されない（「なし」にならない）', `件数 ${n20}→${await count()}`, (await count()) === n20);

// ---- Q-21 改ざん: title を送っても本文の1行目が企画名 ----
await openNew();
await page.fill('textarea[name="body"]', '本物の企画名\n内容');
await page.fill('input[name="participationMethod"]', '当日どうぞ');
await page.fill('input[name="tentativeDate"]', jstDate(15));
await page.evaluate(() => { const i = document.createElement('input'); i.type = 'hidden'; i.name = 'title'; i.value = '偽の企画名'; document.querySelector('form').appendChild(i); });
await page.click('button[name="intent"][value="publish_confirmed"]');
await page.waitForURL('**/member/proposals/*?published=1', { timeout: 30000 }).catch(() => {});
rec('Q-21', '【改ざん】title を送っても無視される', (await latest()).title, (await latest()).title === '本物の企画名');

// ---- Q-22 確認文が公開ボタンの直上にある（360px幅） ----
await ctx.close();
const small = await browser.newContext({ viewport: { width: 360, height: 740 } });
await small.addCookies([{ name: '__local_user', value: 'local-member-1', url: BASE }]);
const sp = await small.newPage();
await sp.goto(`${BASE}/member/proposals/new`, { waitUntil: 'domcontentloaded' });
await sp.waitForSelector('[data-testid="publish-statement"]');
const st = await sp.locator('[data-testid="publish-statement"]').boundingBox();
const bt = await sp.locator('button[name="intent"][value="publish_confirmed"]').boundingBox();
const items = await sp.locator('[data-testid="publish-statement"] li').count();
const hscroll = await sp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
rec('Q-22', '360px: 確認文（5行）が公開ボタンの上、横はみ出し0', `項目${items} 確認文下端${Math.round(st.y + st.height)} ボタン上端${Math.round(bt.y)} はみ出し${hscroll}px`, st && bt && items === 5 && st.y + st.height <= bt.y && bt.y - (st.y + st.height) < 400 && hscroll <= 0);
await sp.goto(`${BASE}/member`, { waitUntil: 'domcontentloaded' });
await sp.waitForTimeout(800);
const sc = await sp.locator('a[href="/member/proposals/new"][aria-label="新しい企画を立てる"]').boundingBox();
const bd = await sp.locator('a[aria-label^="会員ページ"]').boundingBox();
const overlap = sc && bd ? Math.max(0, Math.min(sc.x + sc.width, bd.x + bd.width) - Math.max(sc.x, bd.x)) * Math.max(0, Math.min(sc.y + sc.height, bd.y + bd.height) - Math.max(sc.y, bd.y)) : -1;
rec('Q-23', '360px: 右上の「＋企画」がバッジと重ならない', `重なり面積 ${overlap}`, overlap === 0);
await sp.click('a[aria-label="新しい企画を立てる"]');
await sp.waitForURL('**/member/proposals/new', { timeout: 30000 }).catch(() => {});
rec('Q-24', '「＋企画」1タップで登録画面が開く', sp.url(), sp.url().endsWith('/member/proposals/new'));
const shortcutOnNew = await sp.locator('a[aria-label="新しい企画を立てる"]').count();
rec('Q-25', '登録画面では「＋企画」を出さない', `${shortcutOnNew}個`, shortcutOnNew === 0);

// ---- Q-26 自動処理: JSTの日付で3日前を判定する ----
if (process.env.CRON_SECRET) {
  const mk = async (slug, days) => pool.query(
    `insert into proposals (owner_id, slug, title, summary, format, tentative_starts_at, public_expires_at, organizer_name,
      participation_method, visibility, money_type, money_details, publishing_declarations, status, event_status, published_at, tentative_time_specified)
     values ('local-member-1', $1, $1, $1, 'offline', ($2::date)::timestamp at time zone 'Asia/Tokyo', now() + interval '60 days', 'テスト',
      'テスト', 'public', 'none', '{"label":"なし"}', '{}', 'published', 'planning', now(), false)`, [slug, jstDate(days)]);
  await mk('cron-d3', 3); await mk('cron-d4', 4);
  const res = await fetch(`${BASE}/api/cron/proposal-deadlines`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  const s3 = (await pool.query("select status from proposals where slug = 'cron-d3'")).rows[0].status;
  const s4 = (await pool.query("select status from proposals where slug = 'cron-d4'")).rows[0].status;
  const n = (await pool.query("select dedupe_key from notifications where dedupe_key like 'auto-hidden:%' order by created_at desc limit 1")).rows[0]?.dedupe_key ?? '';
  rec('Q-26', '自動処理: 開催3日前（JST日付）は外れ、4日前は残る。重複防止の鍵はJSTの日付', `HTTP ${res.status} / D-3=${s3} / D-4=${s4} / 鍵=${n.slice(-10)}`, res.status === 200 && s3 === 'auto_hidden' && s4 === 'published' && n.endsWith(jstDate(3)));
} else {
  rec('Q-26', '自動処理の確認（CRON_SECRET が無いので実行できない）', 'skip', false);
}

await browser.close();
await pool.end();
console.log(`\n企画登録の短縮: ${ng === 0 ? '全項目OK' : `${ng}件NG`}`);
process.exit(ng === 0 ? 0 : 1);
