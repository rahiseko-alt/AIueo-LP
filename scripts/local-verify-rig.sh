#!/bin/bash
# 利用者の操作経路と、画像添付を、実ブラウザで通して確かめる。
#
#   bash scripts/local-verify-rig.sh
#
# なぜこれが要るか:
#   このプロジェクトの失敗の中心は「動くことを確かめずに完了と書く」ことである
#   （`FAILURES.md` F-01）。本番はGoogleログインが要り、この環境に資格情報が無い。
#   そこで、本番と同じマイグレーションを当てた使い捨てのPostgreSQLと、ログイン
#   状態を作る一時的な細工で、利用者が通る経路をこちらで通せるようにする。
#
# この細工について:
#   `src/lib/auth/dal.ts` に、Cookie `__local_user` を見て会員として扱う分岐を
#   **実行時に足して、終了時に必ず消す**。コミットへは絶対に入れない。
#   終了時の取り消しは trap で行うので、途中で失敗しても残らない。
#
# 用意されているもの:
#   - PostgreSQL 16（/usr/lib/postgresql/16）
#   - Chromium（$CHROMIUM_PATH、既定は /opt/pw-browsers/chromium-1194/...）
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

PGBIN=/usr/lib/postgresql/16/bin
PGUSER_LOCAL=pgrun
PGDIR=/home/$PGUSER_LOCAL/pg
PGPORT=55432
PORT=3100
DB_URL="postgresql://postgres@127.0.0.1:$PGPORT/aiueo"
export CHROMIUM_PATH="${CHROMIUM_PATH:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
# dev サーバーは localhost で見る。127.0.0.1 で開くと Next の dev が
# 別オリジン扱いでJSを403にし、画面がハイドレートされない（＝操作できない）。
export BASE_URL="http://localhost:$PORT"
export DATABASE_URL="$DB_URL"

cleanup() {
  git checkout -- src/lib/auth/dal.ts 2>/dev/null
  rm -f "$ROOT/.env.local"
  pkill -9 -f "next-server" 2>/dev/null
  pkill -9 -f "next dev" 2>/dev/null
  echo "== 片付け完了（dal.ts の細工を取り消し、.env.local を削除しました） =="
}
trap cleanup EXIT

echo "== 1. PostgreSQL を立てる =="
id "$PGUSER_LOCAL" >/dev/null 2>&1 || useradd -m "$PGUSER_LOCAL"
# 前回の残りが動いていると、データ領域を作り直した瞬間に壊れる。先に必ず止める。
su "$PGUSER_LOCAL" -c "PATH=$PGBIN:\$PATH pg_ctl -D $PGDIR/data -m immediate stop" >/dev/null 2>&1
pkill -9 -u "$PGUSER_LOCAL" postgres 2>/dev/null
sleep 1
su "$PGUSER_LOCAL" -c "rm -rf $PGDIR && mkdir -p $PGDIR && PATH=$PGBIN:\$PATH initdb -D $PGDIR/data -U postgres --auth=trust" >/dev/null 2>&1
su "$PGUSER_LOCAL" -c "PATH=$PGBIN:\$PATH pg_ctl -D $PGDIR/data -o '-p $PGPORT -c listen_addresses=127.0.0.1 -k $PGDIR' -l $PGDIR/log start" >/dev/null 2>&1
sleep 3
psql "$DB_URL" -c 'select 1' >/dev/null 2>&1 || psql -h 127.0.0.1 -p $PGPORT -U postgres -c 'create database aiueo' >/dev/null || { echo "PostgreSQL を立てられませんでした"; exit 1; }

echo "== 2. 本番と同じマイグレーションを当てる =="
for f in drizzle/*.sql; do
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>&1 || { echo "  失敗: $f"; exit 1; }
  echo "  適用: $f"
done

echo "== 3. 検証用のデータを入れる =="
psql "$DB_URL" -q -v ON_ERROR_STOP=1 <<'SQL'
insert into profiles (id, role, status, public_name, collaboration_interest) values
 ('local-member-1','member','active','テスト会員','AI勉強会をやりたい'),
 ('local-admin-1','admin','active','管理者','運営') on conflict (id) do nothing;
insert into consents (user_id, terms_version_id)
  select 'local-member-1', id from terms_versions where is_current on conflict do nothing;
insert into proposals (owner_id, slug, title, summary, format, tentative_starts_at, public_expires_at,
  organizer_name, participation_method, visibility, money_type, money_details, publishing_declarations,
  status, event_status, published_at)
values
 ('local-member-1','test-911','テスト9/11','テスト9/11','offline', now()+interval '14 day', now()+interval '30 day',
  'テスト','テスト','public','none','{"label":"なし","settlement":"なし"}','{"prohibited_confirmed":true,"rights_confirmed":true,"money_confirmed":true}','published','planning', now()),
 ('local-member-1','test-draft','下書きの企画','下書きの概要','online', now()+interval '20 day', now()+interval '40 day',
  'テスト','テスト','public','none','{"label":"なし","settlement":"なし"}','{}','draft','planning', null)
on conflict (slug) do nothing;
SQL

echo "== 4. ログイン状態を作る細工を、一時的に入れる（終了時に必ず消す） =="
python3 - <<'PY'
import pathlib
p = pathlib.Path('src/lib/auth/dal.ts'); s = p.read_text()
shim = """export async function getAuthContext(): Promise<AuthContext> {
  // ==== 検証用の一時的な細工。scripts/local-verify-rig.sh が入れて必ず消す ====
  if (process.env.__LOCAL_REPRO === '1') {
    const { cookies } = await import('next/headers');
    const uid = (await cookies()).get('__local_user')?.value;
    if (!uid) return { kind: 'signed_out' };
    if (!db) return { kind: 'unconfigured' };
    const r = await db.$client.query(
      'select id, role, status, public_name, collaboration_interest from profiles where id = $1 limit 1',
      [uid],
    );
    if (r.rowCount !== 1) return { kind: 'profile_missing', userId: uid };
    return { kind: 'member', userId: uid, profile: r.rows[0] as MemberProfile };
  }
  // ==== ここまで ====
"""
s = s.replace('export async function getAuthContext(): Promise<AuthContext> {\n', shim, 1)
p.write_text(s)
PY

cat > "$ROOT/.env.local" <<EOF
DATABASE_URL=$DB_URL
NEXT_PUBLIC_NEON_AUTH_ENABLED=true
__LOCAL_REPRO=1
EOF

echo "== 5. 画面を立ち上げる =="
setsid nohup npx next dev -p $PORT > /tmp/aiueo-verify-dev.log 2>&1 < /dev/null &
for _ in $(seq 1 40); do
  sleep 2
  [ "$(curl -s -o /dev/null -w '%{http_code}' --noproxy '*' "$BASE_URL/")" = "200" ] && break
done
[ "$(curl -s -o /dev/null -w '%{http_code}' --noproxy '*' "$BASE_URL/")" = "200" ] || { echo "画面が立ち上がりませんでした。/tmp/aiueo-verify-dev.log を見てください"; exit 1; }

FAIL=0
echo
echo "############ 操作経路の検証 ############"
node scripts/verify-user-journeys.mjs || FAIL=1
echo
echo "############ 画像添付の検証 ############"
node scripts/verify-proposal-image.mjs || FAIL=1

echo
if [ "$FAIL" = "0" ]; then echo "===== 全体判定: OK ====="; else echo "===== 全体判定: NG ====="; fi
exit $FAIL
