#!/bin/bash
# セッション開始時のセットアップと、引継ぎの到達確認。
#
# このフックの主目的は2つ。
#  1. lint / typecheck / build / test が最初から動くよう依存を入れる
#  2. HANDOFF.md の更新が main に到達しているかを確認する
#
# 2 は実際に起きた事故への対処である。引継ぎを未マージのブランチに置いたまま
# セッションを終えたため、次のセッションが5日前の記述を読んで作業を始めた。
# 規約に「main へ到達させる」と書いても人もエージェントも忘れるので、
# 開始時に機械が気付く形にしてある。
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

# --- 依存関係 -------------------------------------------------------------
# npm ci ではなく npm install。コンテナ状態がキャッシュされるため差分更新が効く。
if [ -f package.json ]; then
  echo "== 依存関係を導入中 =="
  npm install --no-audit --no-fund 2>&1 | tail -3
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

# HANDOFF.md を変更していて、まだ default branch に入っていないブランチを探す。
STRANDED=""
for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin 2>/dev/null); do
  case "$ref" in
    "origin/$DEFAULT_BRANCH"|origin/HEAD) continue ;;
  esac
  # default branch に含まれていれば対象外
  if git merge-base --is-ancestor "$ref" "origin/$DEFAULT_BRANCH" 2>/dev/null; then continue; fi
  # HANDOFF.md に差分があるか
  if ! git diff --quiet "origin/$DEFAULT_BRANCH" "$ref" -- HANDOFF.md 2>/dev/null; then
    STRANDED="$STRANDED $ref"
  fi
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
