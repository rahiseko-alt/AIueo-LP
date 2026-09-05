/**
 * スキーマ側の不変条件を、実データベースで確認する。
 *
 * CIにデータベースが無いため、drizzle/*.sql を変更したときは
 * これを使い捨てのデータベースへ手で流して確認する。
 *
 *   createdb aiueo_schema_check
 *   psql -d aiueo_schema_check -f drizzle/0000_neon_foundation.sql
 *   psql -d aiueo_schema_check -f drizzle/0001_rate_limits.sql
 *   psql -d aiueo_schema_check -f drizzle/0002_integrity_and_indexes.sql
 *   DATABASE_URL=postgres://.../aiueo_schema_check node scripts/verify-migrations.mjs
 *
 * 実行するとテーブルへ書き込む。本番の接続先を渡さないこと。
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
let failures = 0;
// 同じデータベースへ繰り返し流せるように、投入する行は毎回別の名前にする。
const run = Math.random().toString(36).slice(2, 10);

function check(label, ok, detail = '') {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'NG  '} ${label}${detail ? ` — ${detail}` : ''}`);
}

/** 実行して、期待した理由で失敗したかを見る。成功してしまったら NG。 */
async function expectRejected(label, sql, params, expectedFragment) {
  try {
    await pool.query(sql, params);
    check(label, false, '拒否されずに通った');
  } catch (error) {
    const message = String(error?.message ?? '');
    check(label, message.includes(expectedFragment), message.includes(expectedFragment) ? '' : message);
  }
}

async function main() {
  await pool.query("insert into profiles (id, role, status) values ('verify-admin', 'admin', 'active') on conflict (id) do nothing");

  // 1. 追記専用。措置記録と監査ログは後から書き換えられない。
  const inserted = await pool.query(
    "insert into moderation_actions (actor_id, target_type, target_id, action, reason_code, reason_text) values ('verify-admin', 'member', 'verify-target', 'suspend', 'abuse', 'verify') returning id",
  );
  check('措置記録を追加できる', inserted.rowCount === 1);
  await expectRejected(
    '措置記録は更新できない',
    'update moderation_actions set reason_text = $1 where id = $2',
    ['rewritten', inserted.rows[0].id],
    'append-only',
  );
  await expectRejected(
    '措置記録は削除できない',
    'delete from moderation_actions where id = $1',
    [inserted.rows[0].id],
    'append-only',
  );

  const audit = await pool.query(
    "insert into audit_log (actor_id, entity_type, entity_id, action) values ('verify-admin', 'member', 'verify-target', 'verify') returning id",
  );
  await expectRejected(
    '監査ログは更新できない',
    'update audit_log set action = $1 where id = $2',
    ['rewritten', audit.rows[0].id],
    'append-only',
  );

  // 2. 現行の規約は文書種別ごとに1つ。
  //    プロフィール完了は is_current の3行が揃っている前提で同意を保存する。
  const current = await pool.query(
    'select document_type, count(*)::int as count from terms_versions where is_current group by document_type order by document_type',
  );
  check(
    '現行の規約が3種類ある',
    current.rowCount === 3 && current.rows.every((row) => row.count === 1),
    JSON.stringify(current.rows),
  );
  await expectRejected(
    '同じ種別の現行を2つにはできない',
    'insert into terms_versions (document_type, version, content_hash, is_current) values ($1, $2, $3, true)',
    ['terms', `verify-current-${run}`, 'hash'],
    'terms_versions_current_unique',
  );
  const archived = await pool.query(
    'insert into terms_versions (document_type, version, content_hash, is_current) values ($1, $2, $3, false) returning id',
    ['terms', `verify-archived-${run}`, 'hash'],
  );
  check('旧版（is_current = false）は何件でも置ける', archived.rowCount === 1);

  // 3. 管理画面が出す掲載状態は、すべて CHECK 制約が受け付ける。
  //    以前は 'submitted' を出していたが、制約に無いため必ず失敗し、
  //    しかもその失敗が握り潰されていた。
  const ADMIN_SELECTABLE = ['draft', 'published', 'needs_revision', 'hidden', 'ended', 'cancelled'];
  const slug = `verify-slug-${run}`;
  await pool.query(
    `insert into proposals (owner_id, slug, title, summary, format, tentative_starts_at, public_expires_at, organizer_name, participation_method, visibility, money_type)
     values ('verify-admin', $1, 'verify', 'verify', 'online', now() + interval '30 days', now() + interval '20 days', 'verify', 'verify', 'public', 'none')`,
    [slug],
  );
  for (const status of ADMIN_SELECTABLE) {
    try {
      await pool.query('update proposals set status = $1 where slug = $2', [status, slug]);
      check(`管理画面の状態 ${status} を保存できる`, true);
    } catch (error) {
      check(`管理画面の状態 ${status} を保存できる`, false, String(error?.message ?? ''));
    }
  }
  await expectRejected(
    "制約に無い状態 'submitted' は拒否される",
    'update proposals set status = $1 where slug = $2',
    ['submitted', slug],
    'proposals_status_check',
  );

  console.log(failures === 0 ? '\nすべて期待どおり' : `\n${failures} 件が期待と違う`);
  await pool.end();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error?.stack ?? String(error));
  process.exit(1);
});
