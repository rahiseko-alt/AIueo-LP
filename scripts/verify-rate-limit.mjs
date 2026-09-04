/**
 * 回数制限の挙動を実データベースで確認する。
 *
 * src/lib/rate-limit.ts と同じSQLを、使い捨てのテーブルに対して流す。
 * 単体テストの土台が無いため、変更時はこれを手で流して確認する。
 *
 *   createdb aiueo_ratelimit_check
 *   psql -d aiueo_ratelimit_check -f drizzle/0001_rate_limits.sql
 *   DATABASE_URL=postgres://.../aiueo_ratelimit_check node scripts/verify-rate-limit.mjs
 *
 * 実行するとテーブルの中身を消す。本番の接続先を渡さないこと。
 */
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL が必要です。検証用の使い捨てデータベースを指定してください。');
  process.exit(1);
}
if (/prod|neon\.tech/i.test(connectionString)) {
  console.error('本番らしい接続先が指定されました。中止します。');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const EMAIL_RULE = { scope: 'registration:email', windowSeconds: 3600, max: 3 };
let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'NG  '} ${label}: ${actual}${ok ? '' : ` (期待値 ${expected})`}`);
}

async function consume(identifier, rule) {
  const { rows } = await pool.query(
    `insert into rate_limits (bucket_key, window_started_at, attempts)
     values ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), 1)
     on conflict (bucket_key, window_started_at)
       do update set attempts = rate_limits.attempts + 1
     returning attempts`,
    [`${rule.scope}:${identifier}`, rule.windowSeconds],
  );
  return rows[0].attempts <= rule.max;
}

await pool.query('delete from rate_limits');

const sequential = [];
for (let i = 0; i < 4; i += 1) sequential.push(await consume('a@example.com', EMAIL_RULE));
check('上限3回に対し4回叩いたときの許可数', sequential.filter(Boolean).length, 3);

check('別アドレスは独立', await consume('b@example.com', EMAIL_RULE), true);

// 同時要求ですり抜けないこと。判定と加算が1文なので、必ず max 件だけ通る。
const burst = await Promise.all(Array.from({ length: 20 }, () => consume('c@example.com', EMAIL_RULE)));
check('同時20要求での許可数', burst.filter(Boolean).length, 3);

// 掃除は古いウィンドウだけを消す
await pool.query(
  `insert into rate_limits (bucket_key, window_started_at, attempts)
   values ('registration:email:old@example.com', now() - interval '2 days', 5)`,
);
const pruned = await pool.query(
  'delete from rate_limits where window_started_at < now() - make_interval(secs => $1)',
  [86400],
);
check('掃除で消えた行数', pruned.rowCount, 1);
check('掃除後も現行ウィンドウの上限が効く', await consume('a@example.com', EMAIL_RULE), false);

await pool.end();
console.log(failures === 0 ? '\nすべて期待どおり' : `\n${failures} 件が期待と異なる`);
process.exit(failures === 0 ? 0 : 1);
