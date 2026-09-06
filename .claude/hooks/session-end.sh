#!/bin/bash
# セッション終了時の確認（チェックアウト）。
#
# AGENTS.md は「終了時に IMPLEMENTATION_PLAN.md と HANDOFF.md を更新する。
# 更新しない作業完了は認めない」と定めている。しかし規約に書くだけでは、
# 人もエージェントも忘れる。実際に、決定済みの仕様を読まずに作業した事故も、
# 引継ぎが main に届かなかった事故も起きている。
#
# そこで、開始側（session-start.sh が正本3文書を提示する）と対にして、
# 終了側では「作業したのに台帳を更新していない」状態を機械が指摘する。
#
# 判定は単純である。main に入っていないコミットが実装ファイルを触っていて、
# かつ IMPLEMENTATION_PLAN.md / HANDOFF.md を触っていなければ警告する。
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

git rev-parse --git-dir >/dev/null 2>&1 || exit 0

echo
echo "== チェックアウト（台帳の更新確認） =="

DEFAULT_BRANCH=$(git symbolic-ref --quiet refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||')
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
BASE="origin/$DEFAULT_BRANCH"

git rev-parse --verify --quiet "$BASE" >/dev/null 2>&1 || {
  echo "  $BASE が見つからないため確認を省略"
  exit 0
}

# このセッションの成果 = main に入っていないコミット + 未コミットの変更
CHANGED=$(
  {
    git diff --name-only "$BASE"...HEAD 2>/dev/null
    git diff --name-only HEAD 2>/dev/null
    git diff --name-only --cached 2>/dev/null
    git ls-files --others --exclude-standard 2>/dev/null
  } | sort -u
)

if [ -z "$CHANGED" ]; then
  echo "  ✅ $DEFAULT_BRANCH との差分なし。更新すべき台帳はない"
  exit 0
fi

# 実装に手を入れたか。文書だけの変更なら台帳更新は必須にしない。
IMPL=$(echo "$CHANGED" | grep -E '^(src/|drizzle/|tests/|scripts/|public/|\.github/|\.claude/|package\.json|next\.config\.ts|playwright\.config\.ts)' || true)

PLAN_TOUCHED=$(echo "$CHANGED" | grep -cx 'IMPLEMENTATION_PLAN.md' || true)
HANDOFF_TOUCHED=$(echo "$CHANGED" | grep -cx 'HANDOFF.md' || true)

if [ -n "$IMPL" ]; then
  echo "  実装ファイルに変更がある:"
  echo "$IMPL" | head -8 | sed 's/^/    - /'
  [ "$(echo "$IMPL" | wc -l)" -gt 8 ] && echo "    - ほか $(( $(echo "$IMPL" | wc -l) - 8 )) 件"
  echo
fi

MISSING=""
if [ -n "$IMPL" ] && [ "$PLAN_TOUCHED" -eq 0 ]; then
  MISSING="$MISSING IMPLEMENTATION_PLAN.md"
fi
if [ -n "$IMPL" ] && [ "$HANDOFF_TOUCHED" -eq 0 ]; then
  MISSING="$MISSING HANDOFF.md"
fi

if [ -n "$MISSING" ]; then
  echo "  ⚠⚠ 台帳が更新されていない:"
  for f in $MISSING; do echo "    - $f"; done
  echo
  echo "  AGENTS.md「更新しない作業完了は認めない」に反する。終える前に書くこと。"
  echo "    IMPLEMENTATION_PLAN.md … 進捗表の状態と、更新履歴の1行（証跡つき）"
  echo "    HANDOFF.md            … 現在の状態 / 今回の作業 / 次にやること"
  echo
  echo "  方向性（基本方針・確定事項・技術方針・受け入れ条件）は勝手に変えない。"
  echo "  変えたいときは、変更案としてユーザーへ出すこと。"
else
  [ -n "$IMPL" ] && echo "  ✅ IMPLEMENTATION_PLAN.md と HANDOFF.md を更新済み"
  [ -z "$IMPL" ] && echo "  ✅ 実装ファイルの変更なし（文書のみ）"
fi

# 引継ぎは main へ到達して初めて完了する。未マージなら明示する。
if [ -n "$(git log --format=%H "$BASE..HEAD" 2>/dev/null)" ]; then
  echo
  echo "  ℹ このブランチのコミットは $DEFAULT_BRANCH に未到達である。"
  echo "    マージされるまで、次のセッションには何も届かない。"
fi

exit 0
