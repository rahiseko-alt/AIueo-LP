#!/bin/bash
# セッション開始時のセットアップと、引継ぎの到達確認。
#
# このフックの主目的は4つ。
#  1. lint / typecheck / build / test が最初から動くよう依存を入れる
#  2. 決定事項の正本3文書の所在と目次を画面へ出す（見逃し防止 3/3）
#  3. HANDOFF.md の更新が main に到達しているかを確認する
#  4. IMPLEMENTATION_PLAN.md の状態欄のうち、コードより古い行を再確認候補として出す
#
# 2 は 2026-09-06 の事故への対処である。MEMBERSHIP_FEATURE_SPEC.md に
# 「参加は会員登録不要」「AIueoは当事者にならない」と明記されているのに、
# エージェントがその決定をユーザーへ聞き直した。CLAUDE.md の @ 参照と
# AGENTS.md の必読順序と合わせ、三重にして見逃しを止める。
#
# 3 も実際に起きた事故への対処である。引継ぎを未マージのブランチに置いたまま
# セッションを終えたため、次のセッションが5日前の記述を読んで作業を始めた。
# 規約に「main へ到達させる」と書いても人もエージェントも忘れるので、
# 開始時に機械が気付く形にしてある。
#
# 4 も実際に起きた事故への対処である。2026-09-06、P3〜P6の状態欄が
# 「DB未適用」「Edge Function未デプロイ」等の古い文言のまま残り、実態
# （DB適用済み・メール送信コード自体が無い等）と食い違っていた。前回の
# 文言をコードの再確認なしにそのまま転記していたのが原因。同じ食い違いを
# 内容ベースで検出することはできないので、代わりに「この行がいつ最後に
# 書かれたか」と「コード(src/drizzle/supabase)がいつ最後に変わったか」を
# 比較し、コードの方が新しい行を再確認候補として出す。誤りの証明ではなく、
# 転記の前に立ち止まらせるための注意である。
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

# --- 依存関係 -------------------------------------------------------------
# npm ci ではなく npm install。コンテナ状態がキャッシュされるため差分更新が効く。
if [ -f package.json ]; then
  echo "== 依存関係を導入中 =="
  npm install --no-audit --no-fund 2>&1 | tail -3
fi

# --- 決定事項の正本 -------------------------------------------------------
# 目次まで出すのは、「どこに何が決まっているか」を開かずに把握させるため。
# ファイル名だけの案内では、結局読まずに設計を始める。
echo
echo "== 決定事項の正本（作業前に必ず読む） =="
for doc in MEMBERSHIP_FEATURE_SPEC.md IMPLEMENTATION_PLAN.md HANDOFF.md; do
  if [ -f "$doc" ]; then
    UPDATED=$(git log -1 --format=%ad --date=short -- "$doc" 2>/dev/null)
    printf '  %-30s %4s行  最終更新 %s\n' "$doc" "$(wc -l < "$doc")" "${UPDATED:-不明}"
  else
    printf '  %-30s ⚠ 見つからない\n' "$doc"
  fi
done

if [ -f MEMBERSHIP_FEATURE_SPEC.md ]; then
  echo
  echo "  MEMBERSHIP_FEATURE_SPEC.md（決定仕様）の目次:"
  grep -n '^##' MEMBERSHIP_FEATURE_SPEC.md 2>/dev/null | sed 's/^/    /'
  echo
  echo "  ここで決着している事項をユーザーへ聞き直さないこと。"
  echo "  変えたいときだけ、変更案として提示する。"
fi

# --- 進捗台帳(状態欄)の鮮度確認 --------------------------------------------
if [ -f IMPLEMENTATION_PLAN.md ] && git rev-parse --git-dir >/dev/null 2>&1; then
  PHASE_START=$(grep -n '^## 実装フェーズと受け入れ条件' IMPLEMENTATION_PLAN.md | head -1 | cut -d: -f1)
  PHASE_END=$(grep -n '^## データ・権限の実装境界' IMPLEMENTATION_PLAN.md | head -1 | cut -d: -f1)
  LATEST_CODE=$(git log -1 --format=%ad --date=short -- src drizzle supabase 2>/dev/null)

  if [ -n "$PHASE_START" ] && [ -n "$PHASE_END" ] && [ -n "$LATEST_CODE" ]; then
    STALE_ROWS=""
    while IFS= read -r LN; do
      ID=$(sed -n "${LN}p" IMPLEMENTATION_PLAN.md | awk -F'|' '{gsub(/^ +| +$/,"",$2); print $2}')
      ROW_DATE=$(git blame -L "$LN,$LN" --date=short -- IMPLEMENTATION_PLAN.md 2>/dev/null | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)
      if [ -n "$ROW_DATE" ] && [ "$ROW_DATE" \< "$LATEST_CODE" ]; then
        STALE_ROWS="$STALE_ROWS $ID"
      fi
    done < <(awk -v s="$PHASE_START" -v e="$PHASE_END" 'NR>s && NR<e && /^\| P[0-9]+ \|/{print NR}' IMPLEMENTATION_PLAN.md)

    echo
    echo "== 進捗台帳(状態欄)の鮮度確認 =="
    if [ -n "$STALE_ROWS" ]; then
      echo "  コード(src/drizzle/supabase)の最終更新($LATEST_CODE)より前に書かれた状態欄:"
      echo "   $STALE_ROWS"
      echo "  前回の文言をそのまま転記せず、扱う前にコードを見て再確認すること。"
      echo "  (2026-09-06、P3〜P6の状態欄が古い文言のまま実態と食い違っていた事故への対処)"
    else
      echo "  ✅ 全フェーズの状態欄がコードの最終更新以降に書かれている"
    fi
  fi
fi

# --- 引継ぎの到達確認 -----------------------------------------------------
echo
echo "== 引継ぎの到達確認 =="

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "  gitリポジトリではないため確認を省略"
  exit 0
fi

git fetch origin --quiet 2>/dev/null || {
  echo "  ⚠ origin へ到達できず確認できない（オフラインの可能性）"
  exit 0
}

DEFAULT_BRANCH=$(git symbolic-ref --quiet refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||')
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

# main へ届いていない HANDOFF.md の更新を持つブランチを探す。
#
# 判定は2条件の論理積。どちらか片方だけでは誤検出が出る。実際に片方ずつ試して
# 確認した（前者で6件、後者で1件の誤検出）。
#
#  条件A: main に取り込まれていないコミットが HANDOFF.md を触っている
#    これだけだと squash マージ済みのブランチが残る。squash は元コミットを祖先に
#    しないため、内容が main にあっても「未取り込みのコミット」に見える。
#
#  条件B: ブランチの HANDOFF.md の中身が main と実際に違う
#    これだけだと、HANDOFF.md を触っていない古いブランチが、main 側の更新によって
#    差分ありと判定され、片端から引っかかる。
STRANDED=""
for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin 2>/dev/null); do
  case "$ref" in
    "origin/$DEFAULT_BRANCH"|origin/HEAD) continue ;;
  esac
  [ -z "$(git log --format=%H "origin/$DEFAULT_BRANCH..$ref" -- HANDOFF.md 2>/dev/null)" ] && continue
  git diff --quiet "origin/$DEFAULT_BRANCH" "$ref" -- HANDOFF.md 2>/dev/null && continue
  STRANDED="$STRANDED $ref"
done

if [ -n "$STRANDED" ]; then
  echo "  ⚠⚠ 引継ぎが $DEFAULT_BRANCH に到達していない可能性がある"
  echo
  echo "  次のブランチが HANDOFF.md を変更しているが、まだ $DEFAULT_BRANCH に入っていない:"
  for b in $STRANDED; do echo "    - $b"; done
  echo
  echo "  今読める $DEFAULT_BRANCH の HANDOFF.md は、前回の作業内容を反映していない"
  echo "  おそれがある。作業を始める前に、これらのブランチの HANDOFF.md を読むか、"
  echo "  未マージのPRがないかをユーザーに確認すること。"
  echo "  詳細は AGENTS.md「引継ぎは main に到達して初めて完了とする」を参照。"
else
  echo "  ✅ HANDOFF.md を変更した未マージのブランチは無い"
fi

# 最終更新日を出し、古すぎる引継ぎに気付けるようにする。
LAST=$(git log -1 --format='%ad (%h)' --date=short "origin/$DEFAULT_BRANCH" -- HANDOFF.md 2>/dev/null)
[ -n "$LAST" ] && echo "  $DEFAULT_BRANCH の HANDOFF.md 最終更新: $LAST"

exit 0
