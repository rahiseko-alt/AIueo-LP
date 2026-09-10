#!/usr/bin/env node
/**
 * Google認証の入口が「どのOAuthクライアントへ」つながっているかを機械で確かめる。
 *
 * なぜこれが要るのか。2026-09-09、引継ぎに「自前の鍵へ切替済み。Googleの画面に
 * `AIueo` と表示されることを確認してほしい」と書いたまま、確認をユーザーへ丸投げして
 * セッションを終えた。翌日ユーザーが実際に試すとGoogleの画面は `neon.tech` と表示され、
 * 切替は効いていなかった。目で見る確認をお願いする形にしたせいで、1日以上のあいだ
 * 「切替済み」という誤った記述が正本に残った。
 *
 * このスクリプトは、その確認を1コマンドにする。ブラウザもGoogleアカウントも要らない。
 * 本番の `/api/auth/sign-in/social` を実際に叩き、Neon が発行するGoogleの認可URLまで
 * たどって、使われている client_id と `redirect_uri` を表に出す。
 *
 *   node scripts/verify-oauth-entry.mjs
 *   node scripts/verify-oauth-entry.mjs --base https://aiueo-lp.vercel.app
 *   node scripts/verify-oauth-entry.mjs --expect-client-id 1234-abc.apps.googleusercontent.com
 *
 * `--expect-client-id` を渡すと、一致しなければ exit 1 する。自前の鍵へ切替えたときに
 * その値を渡して走らせれば、切替が本当に効いたかどうかを人の目に頼らず確定できる。
 *
 * 確認できるのは入口だけである。アカウント選択より先（同意・トークン交換・戻り）は
 * 実際のGoogleアカウントが要るため、このスクリプトの範囲外だと明記して出力する。
 */

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const base = arg('--base', 'https://aiueo-lp.vercel.app').replace(/\/$/, '');
const expectClientId = arg('--expect-client-id', null);

function fail(message) {
  console.error(`NG: ${message}`);
  process.exit(1);
}

// 1. 画面のボタンと同じ要求を出す。Origin は同一オリジン検証を通すために付ける
//    （付けないと Proxy が 403 を返す。これは仕様どおりの拒否である）。
const startUrl = `${base}/api/auth/sign-in/social`;
const start = await fetch(startUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: base },
  body: JSON.stringify({
    provider: 'google',
    callbackURL: `${base}/member/profile`,
    errorCallbackURL: `${base}/register?auth_error=1`,
  }),
  redirect: 'manual',
}).catch((cause) => fail(`${startUrl} へ到達できない (${cause.message})`));

if (start.status === 403) fail(`${startUrl} が 403。同一オリジン検証で拒否された`);
if (start.status === 503) fail(`${startUrl} が 503。認証基盤が未設定である`);
if (!start.ok) fail(`${startUrl} が ${start.status} を返した`);

const payload = await start.json().catch(() => fail('応答がJSONではない'));
if (!payload?.url) fail(`応答に url が無い (${JSON.stringify(payload).slice(0, 200)})`);

// Set-Cookie を持ち回る。init は state を cookie と対応させるため、渡さないと成立しない。
const cookie = (start.headers.getSetCookie?.() ?? [])
  .map((line) => line.split(';')[0])
  .join('; ');

// 2. Neon の init を追い、Google の認可URLを受け取る（リダイレクトは自分で止める）。
const init = await fetch(payload.url, { headers: cookie ? { cookie } : {}, redirect: 'manual' })
  .catch((cause) => fail(`init へ到達できない (${cause.message})`));
const location = init.headers.get('location');
if (!location) fail(`init が Location を返さない (status ${init.status})`);
if (!location.startsWith('https://accounts.google.com/')) {
  fail(`init の行き先が Google ではない: ${location.slice(0, 120)}`);
}

const authorize = new URL(location);
const clientId = authorize.searchParams.get('client_id');
const redirectUri = authorize.searchParams.get('redirect_uri');
const scope = authorize.searchParams.get('scope');

console.log('Google認証の入口はつながっている。');
console.log(`  サイト        : ${base}`);
console.log(`  client_id     : ${clientId}`);
console.log(`  redirect_uri  : ${redirectUri}`);
console.log(`  scope         : ${scope}`);
console.log('');
console.log('未確認の区間: Googleアカウント選択 → 同意 → トークン交換 → /member/profile。');
console.log('実際のGoogleアカウントが要るため、このスクリプトでは確かめられない。');

if (expectClientId) {
  if (clientId !== expectClientId) {
    console.error('');
    fail(`client_id が期待値と違う。\n    期待: ${expectClientId}\n    実際: ${clientId}`);
  }
  console.log('');
  console.log(`OK: client_id は期待値と一致した (${expectClientId})`);
}
