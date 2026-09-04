# AI League AIueo

やりたいことを持つ人と、参加したい人が出会うための呼びかけの場。

Next.js 16（App Router）+ Tailwind CSS v4 + Neon（Postgres）で動く、
会員登録・企画（proposal）の投稿と管理・公開イベント一覧を備えたアプリケーション。

- 本番: https://aiueo.kouheikosehira.com / https://aiueo-lp.vercel.app
- プロダクトの方針は `DIRECTION.md`、開発上の取り決めは `AGENTS.md` を参照。

## セットアップ

```bash
npm ci
cp .env.example .env.local   # 値を埋める（下記参照）
npm run dev                  # http://localhost:3000
```

Node.js 22 系で動作を確認している。

## 環境変数

`.env.example` にキー名の一覧がある。`.env*` は `.gitignore` 済みで、値をコミットしてはいけない。

| 変数 | 用途 |
|---|---|
| `DATABASE_URL` | Neon への接続（プール経由）。Vercel の Neon 連携が注入する |
| `DATABASE_URL_UNPOOLED` | マイグレーション専用。アプリ本体からは使わない |
| `NEON_AUTH_BASE_URL` | Neon Auth のエンドポイント |
| `NEON_AUTH_COOKIE_SECRET` | セッション Cookie の署名鍵 |
| `CRON_SECRET` | `/api/cron/proposal-deadlines` の呼び出し認証 |

いずれもサーバー専用。`NEXT_PUBLIC_` を付けてはいけない。

## 開発コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm start` | ビルド済みアプリの起動 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Playwright（レイアウト回帰テスト） |

### テストについて

`tests/layout.spec.ts` は公開ページ7本を 360〜1920px の8段階で検証する。
横スクロールの発生、内部アンカーの飛び先とナビの重なり、コンソールエラーを見ている。

`npm test` は自前で `npm start` を起動するため、先に `npm run build` が必要。
ローカルにプリインストール済みの Chromium を使う場合は `CHROMIUM_PATH` を指定する。

```bash
npm run build && npm test
```

**`npm run build` は ESLint を実行しない。** ビルドの成功は lint の成功を意味しないので、
`lint` と `typecheck` は個別に流すこと。CI（`.github/workflows/ci.yml`）は
`lint` → `typecheck` → `build` → `test` を順に実行し、PR ごとに必須で走る。

## 構成

```
src/app/           ルーティング（App Router）
  api/             認証・会員登録・cron のエンドポイント
  member/          会員向け画面（企画の作成・編集・メッセージ）
  admin/           運営向け画面（会員管理・モデレーション）
  events/          公開イベント一覧と詳細
src/components/    UI コンポーネント
src/lib/neon/      DB 接続（Drizzle）と Neon Auth
src/lib/auth/      認証コンテキスト（requireActiveMember / requireAdmin）
src/data/          モックデータ
drizzle/           SQL マイグレーション
scripts/           運用スクリプト（Node CommonJS）
tests/             Playwright
```

データを書き換える経路はすべて `src/lib/auth/dal.ts` の認可を通す。
ブラウザから直接テーブルを触る実装は置かない。

## デプロイ

Vercel の Git 連携により、`main` への push で本番デプロイが走る。
ビルド設定とバッチ実行は `vercel.json` が持つ（企画の締切通知を毎日 00:00 UTC に実行）。

運用手順は `docs/ADMIN_BOOTSTRAP_RUNBOOK.md` と
`docs/NOTIFICATION_CRON_RUNBOOK.md` にある。
