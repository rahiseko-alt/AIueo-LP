#!/usr/bin/env node
/**
 * Neon Auth の Google OAuth プロバイダーを、Neon の共用鍵から自前の鍵へ切り替える。
 *
 * なぜこれが要るのか。2026-09-09、この切替を「Neon Console の画面でやった」と引継ぎに
 * 書いたが、実際には効いていなかった（失敗記録 F-02）。画面操作は結果が外から見えず、
 * 「やった」という報告しか残らない。だから API で行い、結果を機械で確かめる形にする。
 *
 * 使い方（秘密値は環境変数で渡す。引数にもファイルにも書かない）:
 *
 *   # 1. 今どうなっているかを見るだけ（Neon の API キーだけで足りる）
 *   NEON_API_KEY=xxx node scripts/set-google-oauth.mjs
 *
 *   # 2. 自前の鍵へ切り替える
 *   NEON_API_KEY=xxx GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx \
 *     node scripts/set-google-oauth.mjs --apply
 *
 * 切替後は必ず次で確認する。ここまでやって初めて「切替済み」と書ける。
 *
 *   node scripts/verify-oauth-entry.mjs --expect-client-id "$GOOGLE_CLIENT_ID"
 *
 * Google Cloud 側では、承認済みリダイレクトURIに次を登録しておく必要がある。
 *   {Neon Auth の URL}/callback/google
 * 現行の値: https://ep-bitter-queen-awnva15n.neonauth.c-12.us-east-1.aws.neon.tech/neondb/auth/callback/google
 *
 * 秘密値の扱い: このスクリプトは受け取った値をディスクへ書かない。標準出力にも出さない
 * （client_id は照合のため末尾のみ表示し、client_secret は一切表示しない）。
 */

const API = 'https://console.neon.tech/api/v2';
const key = process.env.NEON_API_KEY;
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const apply = process.argv.includes('--apply');

if (!key) {
  console.error('NG: NEON_API_KEY が無い。');
  console.error('    Neon Console → 右上のアカウントメニュー → Account settings → API keys');
  console.error('    → Create new API key で作った値を渡す。');
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${key}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* 本文がJSONでないこともある */ }
  return { ok: res.ok, status: res.status, json, text };
}

// --- 1. プロジェクトを特定する ------------------------------------------------
const projects = await api('GET', '/projects');
if (!projects.ok) {
  console.error(`NG: プロジェクト一覧を取得できない (${projects.status})`);
  console.error(`    ${projects.text.slice(0, 300)}`);
  process.exit(1);
}
const list = projects.json?.projects ?? [];
if (list.length === 0) {
  console.error('NG: このAPIキーから見えるプロジェクトが無い。');
  process.exit(1);
}
console.log('見えるプロジェクト:');
for (const p of list) console.log(`  ${p.id}  ${p.name}`);

// 本番が使っている Neon Auth のエンドポイントは ep-bitter-queen-awnva15n である。
// 名前ではなくこの手がかりで選ぶ（プロジェクト名は変わりうる）。
const want = process.env.NEON_PROJECT_ID;
const project = want ? list.find((p) => p.id === want) : list.length === 1 ? list[0] : null;
if (!project) {
  console.error('');
  console.error('NG: どのプロジェクトか決められない。NEON_PROJECT_ID で指定する。');
  process.exit(1);
}
console.log(`\n対象: ${project.id} (${project.name})`);

const branches = await api('GET', `/projects/${project.id}/branches`);
const branch = (branches.json?.branches ?? []).find((b) => b.default) ?? (branches.json?.branches ?? [])[0];
console.log(`ブランチ: ${branch ? `${branch.id} (${branch.name})` : '(取得できず)'}`);

// パスの形が2通り文書化されているため、両方試す。
const paths = [
  ...(branch ? [`/projects/${project.id}/branches/${branch.id}/auth/oauth_providers`] : []),
  `/projects/${project.id}/auth/oauth_providers`,
];

// --- 2. 現状を読む ------------------------------------------------------------
let usable = null;
console.log('\n現在のOAuthプロバイダー:');
for (const path of paths) {
  const got = await api('GET', path);
  if (got.ok) {
    usable = path;
    console.log(`  (${path})`);
    console.log(`  ${JSON.stringify(got.json, null, 2).split('\n').join('\n  ')}`);
    break;
  }
  console.log(`  ${path} → ${got.status}`);
}
if (!usable) {
  console.error('\nNG: OAuthプロバイダーを読める経路が無い。APIキーの権限かパスの形を疑う。');
  process.exit(1);
}

if (!apply) {
  console.log('\n読み取りだけで終了した。切り替えるには --apply と Google の鍵を渡す。');
  console.log('  client_id が空・未設定なら、Neon の共用鍵が使われている。');
  process.exit(0);
}

// --- 3. 自前の鍵へ切り替える --------------------------------------------------
if (!clientId || !clientSecret) {
  console.error('\nNG: --apply には GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET が要る。');
  process.exit(1);
}
console.log(`\n切替を実行する。client_id の末尾: ...${clientId.slice(-28)}`);

// 既にある google を更新する形（PATCH）を先に試し、無ければ追加（POST）する。
// キーの名前が provider / id の2通り文書化されているため、両方を送る。
const body = { provider: 'google', id: 'google', client_id: clientId, client_secret: clientSecret };
let done = null;
for (const method of ['PATCH', 'POST']) {
  const res = await api(method, usable, body);
  console.log(`  ${method} → ${res.status}`);
  if (res.ok) { done = method; break; }
  console.log(`    ${res.text.slice(0, 300)}`);
}
if (!done) {
  console.error('\nNG: 切替に失敗した。上の応答本文を見る。');
  process.exit(1);
}

const after = await api('GET', usable);
console.log('\n切替後のOAuthプロバイダー:');
console.log(`  ${JSON.stringify(after.json, null, 2).split('\n').join('\n  ')}`);
console.log('\nAPIは成功した。ただしこれで完了ではない。次を必ず走らせる。');
console.log('  node scripts/verify-oauth-entry.mjs --expect-client-id "$GOOGLE_CLIENT_ID"');
