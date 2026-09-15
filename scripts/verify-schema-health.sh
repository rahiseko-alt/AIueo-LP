#!/bin/bash
# `/api/health/schema` が、マイグレーションの未適用を本当に見抜けるかを確かめる。
#
#   bash scripts/verify-schema-health.sh
#
# なぜこれが要るか:
#   2026-09-15、`drizzle/0005` を本番へ適用しないまま、その列を読むコードをマージし、
#   本番の公開ページ4つを2分30秒のあいだ500にした（`FAILURES.md` F-11）。
#   マージ前に適用状況を外から観測する手段が無かったことが原因である。
#   この窓口はその手段だが、**窓口自体が正しく動くことを確かめていなければ意味が無い**。
#
# 3方向を見る:
#   1. まだ当てていないマイグレーションの列が `pendingMissing` に出るか
#   2. 当てたあとに消えるか
#   3. 否定側: 実際に列を落とすと `ok:false` と `requiredMissing` になるか
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

PGBIN=/usr/lib/postgresql/16/bin
PGU=pgrun; PGDIR=/home/$PGU/pg; PGPORT=55432; PORT=3101
DB_URL="postgresql://postgres@127.0.0.1:$PGPORT/aiueo_schema"
export DATABASE_URL="$DB_URL"

# 未適用の状態を作るため、最後のマイグレーションだけ後から当てる。
LAST_MIGRATION="$(ls drizzle/*.sql | sort | tail -1)"

cleanup() {
  rm -f "$ROOT/.env.local"
  pkill -9 -f "next-server" 2>/dev/null
  pkill -9 -f "next dev" 2>/dev/null
  return 0
}
trap cleanup EXIT

echo "== PostgreSQL を立てる =="
id "$PGU" >/dev/null 2>&1 || useradd -m "$PGU"
su "$PGU" -c "PATH=$PGBIN:\$PATH pg_ctl -D $PGDIR/data -m immediate stop" >/dev/null 2>&1
pkill -9 -u "$PGU" postgres 2>/dev/null; sleep 1
su "$PGU" -c "rm -rf $PGDIR && mkdir -p $PGDIR && PATH=$PGBIN:\$PATH initdb -D $PGDIR/data -U postgres --auth=trust" >/dev/null 2>&1
su "$PGU" -c "PATH=$PGBIN:\$PATH pg_ctl -D $PGDIR/data -o '-p $PGPORT -c listen_addresses=127.0.0.1 -k $PGDIR' -l $PGDIR/log start" >/dev/null 2>&1
sleep 3
psql -h 127.0.0.1 -p $PGPORT -U postgres -c 'create database aiueo_schema' >/dev/null 2>&1 || { echo "DB を作れませんでした"; exit 1; }

echo "== 最後の1つを除いてマイグレーションを当てる（未適用の状態を作る） =="
for f in $(ls drizzle/*.sql | sort); do
  [ "$f" = "$LAST_MIGRATION" ] && { echo "  保留: $f"; continue; }
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>&1 || { echo "  失敗: $f"; exit 1; }
  echo "  適用: $f"
done

echo "== dev サーバーを立てる =="
printf 'DATABASE_URL=%s\nNEXT_PUBLIC_NEON_AUTH_ENABLED=true\n' "$DB_URL" > "$ROOT/.env.local"
npx next dev -p $PORT > /tmp/schema-dev.log 2>&1 &
for i in $(seq 1 60); do curl -s -o /dev/null "http://localhost:$PORT/api/health/schema" && break; sleep 2; done
sleep 3

FAIL=0
URL="http://localhost:$PORT/api/health/schema"
# 保留したマイグレーションの名札（例: 0004_proposal_application_url）
LAST_NAME="$(basename "$LAST_MIGRATION" .sql)"

echo ""
echo "== 1. 保留したマイグレーション（$LAST_NAME）の列を、無いと言えるか =="
BEFORE=$(curl -s "$URL"); echo "$BEFORE"
# その名札の行が1つ以上あり、すべて present:false であること
COUNT=$(echo "$BEFORE" | grep -o "\"migration\":\"$LAST_NAME\"" | wc -l)
TRUE_COUNT=$(echo "$BEFORE" | grep -o "\"migration\":\"$LAST_NAME\"[^}]*\"present\":true" | wc -l)
if [ "$COUNT" -ge 1 ] && [ "$TRUE_COUNT" = "0" ]; then
  echo "  OK: $LAST_NAME の $COUNT 列すべてが present=false"
else
  echo "  NG: $LAST_NAME の列が $COUNT 件、うち present=true が $TRUE_COUNT 件"; FAIL=1
fi
# 欠けている列は、required か pending のどちらかの missing に必ず出る
MISSING_ALL=$(echo "$BEFORE" | grep -o '"requiredMissing":\[[^]]*\]\|"pendingMissing":\[[^]]*\]')
if echo "$MISSING_ALL" | grep -q '"'; then
  echo "  OK: 欠けている列が missing の一覧に出ている"
else
  echo "  NG: missing の一覧が空のまま"; FAIL=1
fi

echo ""
echo "== 2. 保留したマイグレーションを当てたあと =="
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$LAST_MIGRATION" >/dev/null 2>&1 || { echo "  適用に失敗: $LAST_MIGRATION"; exit 1; }
AFTER=$(curl -s "$URL"); echo "$AFTER"
FALSE_COUNT=$(echo "$AFTER" | grep -o "\"migration\":\"$LAST_NAME\"[^}]*\"present\":false" | wc -l)
if [ "$FALSE_COUNT" = "0" ]; then
  echo "  OK: $LAST_NAME の列がすべて present=true になった"
else
  echo "  NG: まだ present=false が $FALSE_COUNT 件ある"; FAIL=1
fi
if echo "$AFTER" | grep -q '"ok":true'; then
  echo "  OK: ok=true"
else
  echo "  NG: ok が true にならない"; FAIL=1
fi

echo ""
echo "== 3. 否定側: required の列を実際に落とす =="
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -c 'alter table proposals drop column application_url' >/dev/null 2>&1 \
  || { echo "  列を落とせませんでした"; exit 1; }
BROKEN=$(curl -s "$URL"); echo "$BROKEN"
echo "$BROKEN" | grep -q '"ok":false' \
  && echo "  OK: ok=false になった" || { echo "  NG: 列を落としても気づけない"; FAIL=1; }
echo "$BROKEN" | grep -q '"requiredMissing":\["proposals.application_url"\]' \
  && echo "  OK: requiredMissing に出た" || { echo "  NG"; FAIL=1; }

echo ""
[ "$FAIL" = "0" ] && { echo "全体判定: OK"; exit 0; } || { echo "全体判定: NG"; exit 1; }
