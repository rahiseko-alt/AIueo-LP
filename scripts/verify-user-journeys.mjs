/**
 * 利用者の操作経路を、実ブラウザで順番に通す。
 *
 * 2026-09-12、ユーザーから「登録者のページと企画ページに一貫性が無い。直接URLを
 * 開いて確認しているから気づいていないのだろう。操作経路をチェックリストにして、
 * 順方向・分岐・逆方向を実操作で検証しろ」と指示があった。そのための装置である。
 * このとき実測で25項目中12項目が到達不能だった。
 *
 * 単体では動かない。DBと、ログイン状態を作るための一時的な細工が要る。
 * **`scripts/local-verify-rig.sh` が全部そろえて、この本体を呼ぶ。**
 *
 *   bash scripts/local-verify-rig.sh
 *
 * 判定は「押せるリンクがあるか」「実際に押して着いたか」で行う。画面に文字が
 * あるかどうかでは、押せない文字を見て合格にしてしまう。
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const EXE = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const rows = [];
let ng = 0;

function rec(id, role, from, want, got, ok) {
  rows.push({ id, role, from, want, got, ok });
  if (!ok) ng++;
  console.log(`${ok ? 'OK  ' : 'NG  '} ${id} [${role}] ${from} : ${want}\n        → ${got}`);
}

// ページ上に、指定パターンに一致する「見える」リンクがあるか
async function links(page, re) {
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim().slice(0, 24) })));
  return hrefs.filter((h) => re.test(h.href));
}

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const asRole = async (uid) => {
  await ctx.clearCookies();
  if (uid) await ctx.addCookies([{ name: '__local_user', value: uid, url: BASE }]);
};

const go = async (p) => { await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForTimeout(300); };
const path = () => new URL(page.url()).pathname + new URL(page.url()).search;

// ================= ③ 一般（未ログイン） =================
await asRole(null);

await go('/');
let l = await links(page, /^\/events$/);
rec('G-01', '一般', '/', 'トップ → 企画一覧(/events)へのリンク', `${l.length}件 ${l.map(x=>x.text).join(',')}`, l.length > 0);

l = await links(page, /^\/register$/);
rec('G-02', '一般', '/', 'トップ → 会員登録(/register)へのリンク', `${l.length}件 ${l.map(x=>x.text).join(',')}`, l.length > 0);

await go('/events');
l = await links(page, /^\/events\/[^/]+$/);
rec('G-03', '一般', '/events', '一覧 → 個別企画へのリンク', `${l.length}件`, l.length > 0);

await go('/events/test-911');
const title = await page.textContent('h1');
rec('G-04', '一般', '/events/test-911', '企画詳細が表示される', `h1="${title}"`, (title || '').includes('テスト9/11'));

l = await links(page, /^\/events$/);
rec('G-05', '一般', '/events/test-911', '【逆方向】詳細 → 企画一覧へ戻れる', `${l.length}件 ${l.map(x=>x.text).join(',')}`, l.length > 0);

l = await links(page, /^\/$/);
rec('G-06', '一般', '/events/test-911', '【逆方向】詳細 → トップへ戻れる', `${l.length}件`, l.length > 0);

l = await links(page, /^\/register$/);
rec('G-07', '一般', '/events/test-911', '詳細 → 自分も企画を立てる(/register)導線', `${l.length}件`, l.length > 0);

const reportCtl = await page.$$('form select[name="category"], form textarea[name="details"]');
rec('G-08', '一般', '/events/test-911', '通報フォームが詳細ページに直接置かれていない', `通報入力欄${reportCtl.length}個`, reportCtl.length === 0);

l = await links(page, /^\/events\/[^/]+\/report$/);
rec('G-10', '一般', '/events/test-911', '詳細 → 「管理者へ連絡」ボタンがある', `${l.length}件 ${l.map((x) => x.text).join(',')}`, l.length > 0 && l.some((x) => x.text.includes('管理者へ連絡')));

// 実際に押して、通報ページへ行き、送って、戻ってくるところまで通す。
// 待ち時間を決め打ちにしない。開発サーバーは初回表示でその画面を組み立てるので、
// 固定の待ちだと「まだ来ていないだけ」を不合格と読み違える。
await page.click('a[href="/events/test-911/report"]');
await page.waitForURL('**/events/test-911/report', { timeout: 30000 }).catch(() => {});
rec('G-11', '一般', '/events/test-911', '実クリックで通報ページへ移動する', path(), path() === '/events/test-911/report');

const ctl2 = await page.$$('select[name="category"], textarea[name="details"]');
rec('G-12', '一般', '/events/test-911/report', '通報ページに入力欄がある', `${ctl2.length}個`, ctl2.length === 2);

l = await links(page, /^\/events\/test-911$/);
rec('G-13', '一般', '/events/test-911/report', '【逆方向】通報ページ → 企画へ戻れる', `${l.length}件`, l.length > 0);

await page.selectOption('select[name="category"]', { index: 0 });
await page.fill('textarea[name="details"]', '導線検証のテスト送信');
await page.click('button:has-text("通報を送る")');
await page.waitForURL('**/events/test-911?reported=1', { timeout: 30000 }).catch(() => {});
rec('G-14', '一般', '/events/test-911/report', '送信すると企画ページへ戻る', path(), path().startsWith('/events/test-911?reported=1'));

const notice = await page.$$eval('[role="status"]', (e) => e.map((x) => x.textContent.trim()));
rec('G-15', '一般', '/events/test-911?reported=1', '受け付けたことが画面に出る', JSON.stringify(notice).slice(0, 90), notice.some((t) => t.includes('受け付けました')));

await go('/events/test-911');
l = await links(page, /^\/events$/);
if (l.length) { await page.click('a[href="/events"]'); await page.waitForURL('**/events', { timeout: 30000 }).catch(() => {}); }
rec('G-09', '一般', '/events/test-911', '実クリックで一覧へ戻る', path(), path() === '/events');

// ================= ② 登録者 =================
await asRole('local-member-1');

await go('/member/profile');
l = await links(page, /^\/member$/);
rec('M-01', '登録者', '/member/profile', 'プロフィール → 会員ページ(/member)へ', `${l.length}件`, l.length > 0);

await go('/member');
l = await links(page, /^\/member\/proposals\/new$/);
rec('M-02', '登録者', '/member', '会員ページ → 企画を登録する', `${l.length}件`, l.length > 0);
l = await links(page, /^\/member\/proposals$/);
rec('M-03', '登録者', '/member', '会員ページ → 自分の企画一覧', `${l.length}件`, l.length > 0);
l = await links(page, /^\/member\/history$/);
rec('M-04', '登録者', '/member', '会員ページ → 履歴(/member/history)', `${l.length}件`, l.length > 0);
l = await links(page, /^\/events$/);
rec('M-05', '登録者', '/member', '会員ページ → 公開中の企画一覧(/events)を見る', `${l.length}件`, l.length > 0);

await go('/member/proposals');
l = await links(page, /^\/member\/proposals\/[0-9a-f-]{36}$/);
rec('M-06', '登録者', '/member/proposals', '企画一覧 → 個別企画へ', `${l.length}件`, l.length > 0);

// 「公開中」と出ている企画を選ぶ。下書きを選ぶと、公開中だけに出る区画の
// 有無を見られない。
const published = await page.$$eval('a[href^="/member/proposals/"]', (as) =>
  as.filter((a) => (a.textContent || '').includes('公開中')).map((a) => a.getAttribute('href')));
const first = { href: published[0] };
rec('M-06b', '登録者', '/member/proposals', '一覧で「公開中」の企画を見分けられる', `${published.length}件`, published.length > 0);
await go(first.href);
l = await links(page, /^\/member\/proposals$/);
rec('M-07', '登録者', first.href, '【逆方向】企画編集 → 自分の企画一覧へ戻れる', `${l.length}件 (戻り先=${(await links(page, /^\/member/)).map(x=>x.href).join(',')})`, l.length > 0);

l = await links(page, /^\/events\/[^/]+$/);
rec('M-08', '登録者', first.href, '公開中の自分の企画 → 公開ページ(/events/slug)を見る', `${l.length}件`, l.length > 0);

l = await links(page, /\/messages$/);
rec('M-09', '登録者', first.href, '企画編集 → 管理者とのメッセージ', `${l.length}件`, l.length > 0);

if (l.length) { await go(l[0].href); }
l = await links(page, /^\/member\/proposals\/[0-9a-f-]{36}$/);
rec('M-10', '登録者', 'messages', '【逆方向】メッセージ → 企画へ戻れる', `${l.length}件`, l.length > 0);

await go('/member/history');
l = await links(page, /^\/member$/);
rec('M-11', '登録者', '/member/history', '【逆方向】履歴 → 会員ページへ戻れる', `${l.length}件`, l.length > 0);

await go('/member/proposals/new');
l = await links(page, /^\/member\/proposals$/);
rec('M-12', '登録者', '/member/proposals/new', '【逆方向】新規登録 → 企画一覧へ戻れる', `${l.length}件`, l.length > 0);

// 公開ページから自分の編集画面へ戻れるか
await go('/events/test-911');
l = await links(page, /^\/member\/proposals/);
rec('M-13', '登録者', '/events/test-911', '自分の企画の公開ページ → 編集画面へ行ける', `${l.length}件`, l.length > 0);

// 全ページ共通のバッジがどこへ行くか
await go('/');
const badge = await links(page, /^\/member/);
rec('M-14', '登録者', '/', 'ログイン中にトップから会員ページへ行ける', `${badge.length}件 → ${badge.map(x=>x.href).join(',')}`, badge.some((x) => x.href === '/member'));

// ================= ① 管理者 =================
await asRole('local-admin-1');
await go('/');
l = await links(page, /^\/admin/);
rec('A-01', '管理者', '/', 'トップから管理画面への導線（仕様上は不要・直URL運用）', `${l.length}件`, true);
await go('/admin');
const adminH1 = await page.textContent('h1').catch(() => '');
rec('A-02', '管理者', '/admin', '管理画面に到達できる', `h1="${adminH1}" path=${path()}`, path() === '/admin');

// ================= 権限の表示と、狭い画面 =================
await asRole(null);
await go('/register');
let txt = await page.innerText('body');
rec('S-01', '一般', '/register', '3つの立場が同じ言葉で説明されている', `管理者=${txt.includes('管理者')} 登録者=${txt.includes('登録者')} 一般=${txt.includes('一般')}`,
  txt.includes('管理者') && txt.includes('登録者') && txt.includes('一般'));
rec('S-02', '一般', '/register', '未登録の人に「いまのあなた」が出る', String(txt.includes('いまのあなた')), txt.includes('いまのあなた'));

await asRole('local-member-1');
await go('/member');
txt = await page.innerText('body');
rec('S-03', '登録者', '/member', '登録者にも同じ3行の表が出る', `いまのあなた=${txt.includes('いまのあなた')}`, txt.includes('いまのあなた') && txt.includes('登録者'));

// 狭い画面（360px）で、新しく足した画面が横にはみ出さないこと
await page.setViewportSize({ width: 360, height: 780 });
for (const [id, url] of [['S-04', '/events/test-911'], ['S-05', '/events/test-911/report'], ['S-06', '/register'], ['S-07', '/member']]) {
  await go(url);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  rec(id, '共通', url, '360px幅で横にはみ出さない', `はみ出し ${over}px`, over <= 0);
}
await page.setViewportSize({ width: 1280, height: 900 });

await asRole('local-admin-1');
await go('/admin/proposals');
l = await links(page, /^\/admin\/proposals\/[0-9a-f-]{36}$/);
rec('A-03', '管理者', '/admin/proposals', '管理者が個別の企画へ入れる', `${l.length}件`, l.length > 0);

await browser.close();

console.log('\n===== 集計 =====');
console.log(`全${rows.length}件 / NG ${ng}件`);
console.log('\n| ID | 権限 | 起点 | 確かめたこと | 結果 |');
console.log('| --- | --- | --- | --- | --- |');
for (const r of rows) console.log(`| ${r.id} | ${r.role} | \`${r.from}\` | ${r.want} | ${r.ok ? 'OK' : '**NG**'} |`);
process.exit(ng === 0 ? 0 : 1);
