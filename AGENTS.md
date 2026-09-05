<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Instructions & Subagents

## 1. Project Concept
- **Product**: AI League AIueo（草AIチーム / AI同盟）
- **Core Motto**: 「今度一緒になんかできたらいいですね」を「こういうのやるんですけど、一緒にどうですか？」に変える場。
- **3 Phases**:
  1. `0 → 1` (TRY): 最初の1を、一緒につくる。
  2. `1 → 1` (PASS): あなたの1を、誰かの1に。
  3. `2 × 2` (COLLABORATE): 1が増えたら、掛け合わせる。

## 2. Workspace Skills & Rules
- **Skill**: `.agents/skills/responsive-web-design/SKILL.md`
  - Reference: `.agents/skills/responsive-web-design/references/breakpoint_guide.md`
  - Webデザイン・UI実装時は常に上記Framer公式ガイド・レスポンシブ設計の作法に従うこと。

## 3. Dedicated Subagents
- **`web-designer`**:
  - Webデザイン、UI/UX設計、ブレイクポイント最適化、フルードタイポグラフィの専門エージェント。
  - レスポンシブ設計を行う際は `define_subagent` / `invoke_subagent` で本役割を割り当てて実行すること。

## 4. Session Handoff
- 作業を始める前に、必ずリポジトリ直下の `HANDOFF.md` を読むこと。
- 続けて、必ず `IMPLEMENTATION_PLAN.md` を読み、進行中のゲート・依存関係・未解決事項を確認すること。
- 作業を終える前に、`HANDOFF.md` の「現在の状態」「今回の作業」「次にやること」を更新すること。
- 作業を終える前に、`IMPLEMENTATION_PLAN.md` の進捗表と更新履歴も更新すること。更新しない作業完了は認めない。
- 引継ぎ内容には、公開URL・直近のコミット・未解決事項・ユーザー確認待ちの判断を残すこと。

### 引継ぎは `main` に到達して初めて完了とする
次のセッションが読むのは `main` の `HANDOFF.md` だけである。未マージのブランチに置いた更新は、書いていないのと同じ結果になる。

- **引継ぎの更新を、セッション最後の独立したPRにしない。** 作業内容のPRに含めるか、その場でマージまで済ませる。
- PRを作った時点では完了ではない。**`git show origin/main:HANDOFF.md` に自分の更新が現れることを確認するまでが引継ぎ**である。
- マージがユーザー判断待ちで終わる場合は、「引継ぎは未達である」ことを最後のメッセージで明示する。黙って終わらない。

この規約は、実際に引継ぎが届かなかった事故（2026-09-05、PR #10 未マージのまま次セッションが8月31日時点の記述を読んだ）を受けて追加した。`.claude/hooks/session-start.sh` がセッション開始時に同じ状態を検出する。

## 5. 会員・企画機能の実装ゲート
- 実装フェーズに入る際は、利用可能な環境では必ずPlan modeを開始する。Plan modeが提供されない環境では、同等に`update_plan`で実行計画を更新してから着手する。
- コード・DB・本番設定の変更前に、`IMPLEMENTATION_PLAN.md` の該当フェーズについて受け入れ条件、範囲外、失敗時の扱いを具体化する。
- 受け入れ条件は、セキュリティ/権限、企画者・参加者の利用、運用・法務の3視点でサブエージェントによる敵対検証を実施したあと、ユーザーへ提案し承認を得る。承認前に実装を始めない。
- 並列化する作業は、`IMPLEMENTATION_PLAN.md` の依存関係を満たす独立レーンに限定する。同じDBマイグレーション、同じ画面、同じ規約本文を複数エージェントが同時に編集しない。
- 各完了項目には、コミット、テスト結果、デプロイURL（該当する場合）を進捗表へ記録する。
