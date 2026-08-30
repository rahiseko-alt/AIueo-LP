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
