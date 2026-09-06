# AIueo LP 引継ぎ

## 運用ルール

- 作業開始時に必ずこのファイルを読む。
- 続けて`IMPLEMENTATION_PLAN.md`を読み、進行中のゲート・依存関係・未解決事項を確認する。
- 作業終了時に必ずこのファイルを更新する。
- 作業終了時に`IMPLEMENTATION_PLAN.md`の進捗表・更新履歴も更新する。
- 仕様が未確定の事項は実装済みとして扱わず、「次にやること」へ残す。

## 現在の状態

- 本番URL: https://aiueo-lp.vercel.app/
- Vercelプロジェクト: `rahisekos-projects/aiueo-lp`
- 最新の実装コミット: `476c0a4 fix: 会員登録フォームが黙って固まらないようにする (#16)`（`7700904`は台帳の記述訂正のみ、コード変更なし）
- **画面とフローの設計図**: https://claude.ai/code/artifact/0de7067b-8736-4325-bf09-ebe7dab72830 （全21ページ、3つの導線、不足11件。仕様書と実装の突き合わせ結果）
- ビルド: `npm run build` が成功
- 品質ゲート: `lint` / `typecheck` / `build` / Playwright 95件が GitHub Actions で PR ごとに必須実行され、緑
- **CIのBuildは `NEXT_PUBLIC_NEON_AUTH_ENABLED=true` を付けて実行する。** 会員登録フォームのテストがフォームの有効な状態を見るため。認証基盤の接続情報は渡していないのでサーバー側は未設定のまま。手元で `npm test` を流すときも同じ値を付けてビルドすること
- **正式URLは `https://aiueo.kouheikosehira.com`**（`src/lib/site.ts`）。`https://aiueo-lp.vercel.app` も同じ内容を返すが、canonical で前者に寄せている
- **Vercel の Git 連携が接続済み。`main` への push で本番デプロイが自動で走る**（このセッションで接続前後を実測確認）

## 今回の作業（2026-09-06 その2 / Claude Code on the web）

台帳の進捗チェックインとPR #18・#19（いずれもマージ済み、`7700904`・`08afd91`）。

- P3〜P5の「DB未適用」、P1の「権限テスト継続」、P6の「Edge Function未デプロイ」が2026-09-01時点の古い記述の残りだったのを訂正。実態はDB適用済み・RLS未設定でDAL層のみ・メール送信コードが存在しない、とそれぞれ正確な表現に直した。詳細は`IMPLEMENTATION_PLAN.md`の該当行と更新履歴。
- **G1-07を決定**: 企画登録の必須項目は開催候補日のみとし、募集期限は必須項目に含めない。設計図の不足#7（`tentative_starts_at`常時必須と仕様書の矛盾）は、現行実装に仕様書側を合わせる形で解消した。`MEMBERSHIP_FEATURE_SPEC.md`企画登録フロー2項を修正済み。**コード変更は無い**（実装は決定前から既にこの内容だった）。
- **再発防止**: 上記の状態欄の食い違いが二度と黙って残らないよう、`.claude/hooks/session-start.sh`にフェーズ表の鮮度確認を追加した。各行の最終更新日と`src/drizzle/supabase`の最終更新日を比較し、コードの方が新しい行を開始時に列挙する。実際に走らせ、現状のP0/P2/P7/P8/P9/P10/P11が候補として出ることを確認済み。`AGENTS.md`に「状態欄は前回の文言をそのまま転記しない」の節を追加した。

## 今回の作業（2026-09-05 その2 / Claude Code on the web）

### 未監査領域の読み切り（P9）

残り約2,200行（`src/components/`、`src/app/admin/`、`drizzle/`、`src/proxy.ts`、`src/app/api/auth/`、`public/`、メタデータ、依存）を読み切り、問題リストを確定した。確定リストは下の「既知で未対応」に置き換えた。ユーザーの仕分けは **Tier 1（セキュリティ・確実なバグ）のみ実施**。

**引継ぎ記述そのものに誤りが4点あった**（旧LP向けの一覧を引き継いでいたため）。

- 「死にコード7ファイル」→ 実際は **10ファイル**（`archive-timeline` / `projects-spotlight` / `testimonials` が漏れていた）
- 「`join.tsx` に `contact@example.com` が残る」→ **既に解消済み**
- 「外部リンクが `https://discord.com`」→ **現行コードに存在しない**。`x.com` は死にコード `about.tsx:38` のみ
- 「見出し階層スキップ」→ 描画中コンポーネントでは **該当なし**（h1→h2→h3 が成立）

### セキュリティ修正（Tier 1）

いずれも実測で確認済み。

- **`/api/auth/[...path]` が上流 Neon Auth への無検査パススルーだった。** 受け取ったパスがそのまま上流へ連結されるため、PR #8・#9 で入れた対策の**片側しか塞げていなかった**。ローカルにスタブ上流を立てて実測: `POST /api/auth/email-otp/send-verification-otp` と `sign-up/email` が回数制限・同一応答を通らずに上流へ到達し、`admin/list-users` `admin/set-role` も素通りした。実際に画面が使う4パス（`get-session` / `sign-in/email` / `sign-out` / `email-otp/verify-email`）だけの許可リストに変更。登録は上流をサーバー側から直接呼ぶ経路なので、塞いでも動くことを実測で確認した。
- **管理者操作の失敗が完全に握り潰されていた。** `catch { rollback; return false }` にログも無く、呼び出し元5箇所は戻り値を見ずに `redirect()` していた。危険な企画の非公開化や会員停止が失敗しても管理者は成功と区別できず、監査ログにも残らなかった。失敗を呼び出し元へ返し、`console.error`（個人情報なし）に残し、画面へ `role="alert"` で表示するようにした。
- **`submitted` は DB の CHECK 制約に存在しないのに管理画面の選択肢に出ていた。** 旧 Supabase スキーマの名残で、選ぶと必ず制約違反 → 上記の握り潰しで無言のロールバック。選択肢から削除した。`auto_hidden` / `expired` も cron 専用の状態なので手で付けられないようにした（管理者が公開から外すときは `hidden`）。
- **同じ状態への変更を拒否**するようにした。以前は版履歴・監査・通知だけが無意味に増えた。
- 回数制限のIPを生の `x-forwarded-for` から `@vercel/functions` の `ipAddress()` 優先へ変更。CRONシークレットの比較を `timingSafeEqual` に変更。企画ID・通報IDの uuid 検証、`money_details` がオブジェクトであることの検証を追加。
- `rollback` 自体が失敗したコネクションを破棄する（`release(true)`）ようにした。7箇所すべて。

### スキーマの保全とインデックス（`drizzle/0002_integrity_and_indexes.sql`）

**本番Neonへ適用済み**（2026-09-05、PR #12 のマージ後にユーザーが Vercel の Query 画面から実行）。追加するのはトリガとインデックスのみで、アプリのコードはどれにも依存していない。

使い捨ての PostgreSQL 16 に 0000→0001→0002 を流して実測した。

- `moderation_actions` に追記専用トリガを追加（`audit_log` にはあったが措置記録には無かった）。例外文言をテーブル名入りに変更。更新・削除が両方拒否されることを確認。
- `terms_versions` に「文書種別ごとに現行は1つ」の部分UNIQUEを追加。2件目の `is_current = true` が拒否され、旧版（`false`）は何件でも置けることを確認。
- 欠けていたインデックスを追加。実測で **`reports` の未処理カウントが全走査 → Index Only Scan**、**cron の期限切れ抽出と3日前抽出が全走査 → Index Scan**、**`profiles(role, status)` が5万行で Index Scan** になることを確認した。
- `scripts/verify-migrations.mjs` を追加。0002 の効果を外すと 4件が NG になり exit 1 することを確認済み。CIにDBが無いため手で流す。

### テスト（73件 → 87件）

- `tests/auth-proxy.spec.ts`（10件）: 塞いだ8パスが 404、許可パスが 404 でない、メソッド違いが 404。**許可リストを外すと10件中9件が落ちることを実測で確認した。**
- `tests/admin-access.spec.ts`（4件）: 管理画面4ページが未認証で 200 を返さない。

### 検索結果・SNS共有への対応（Tier 2）

ユーザーが Tier 2 を選び、あわせて2つを決定した。**サイトの主題は「AIを前に出す」**（名前 `AI League AIueo` を維持し、矛盾していた `DIRECTION.md` 側を書き換えた）。**正式URLは `https://aiueo.kouheikosehira.com`**。

修正前は `title` と `description` の2項目しか無く、全7ページが同じ文言だった。OGP・canonical・robots・sitemap はどれも存在せず、URLを貼っても画像も説明も出なかった。`description` は「週末に集まり、AIを触り、プロトタイプで遊ぶ同盟。」で本文と食い違っていた。

- `src/lib/site.ts` を新設し、正式URL・サイト名・説明文・非公開パスを1箇所へ集約。`metadataBase` / canonical / OGP / robots / sitemap がすべて同じ住所を名乗るようにした。
- `src/app/layout.tsx` に `metadataBase`、`title` の template、`openGraph`、`twitter`、`alternates.canonical`、`robots` を追加。
- `src/app/opengraph-image.tsx` を新設。`next/og` の `ImageResponse` で 1200×630 を生成する（39KB）。**文字を英字だけにしているのは、`next/og` の既定フォントに日本語の字形が無く、和文を置くと空白になるため。** 画像素材（`public/images/japanese/*.png`）は1枚2MB前後あり、OGP画像には大きすぎるので使っていない。
- `src/app/robots.ts` と `src/app/sitemap.ts` を新設。sitemap は公開中の企画も載せるが、**DBが無い環境やクエリ失敗では固定ページだけを返す**（ビルドと配信を落とさない）。
- 7ページへ個別の `metadata` を追加。`/events/[slug]` は `generateMetadata` で企画名と概要を使う。**本文と同じ絞り込み条件で引き、見つからなければ企画名を出さない**（下書き・期限切れの企画名を共有カードから漏らさない）。
- `DIRECTION.md` の「AIはサイトテーマではない」（§5）と「AI専門サイトにしない」（§18-6）を、ユーザー決定に沿って「AIを入口として名乗るが、AIの技術解説サイトにはしない」へ書き換えた。§5 の「脇役」一覧からも `AI` を外した。
- `tests/metadata.spec.ts`（6件）を追加。**`layout.tsx` から `openGraph` を外すと落ちることを実測で確認した。**

生成した OGP 画像は実際に取得して目視確認済み（黒地にゴールドの `Aiueo`、`THIS WAY. TOGETHER.`、ドメイン名。文字の切れなし）。

### 使われていないファイル・依存の削除（Tier 3）

見た目も動きも変えない掃除。目的は、今後の作業で使われていないコードに手を入れて混乱するのを防ぐこと。すべて削除前に `grep` で参照0件を確認している。

- **未参照のコンポーネント10ファイル**: `about` / `archive` / `archive-timeline` / `join` / `next-events` / `people` / `projects` / `projects-spotlight` / `recent-activities` / `testimonials`。`about.tsx:38` に残っていた `https://x.com`（サービストップへのリンク）もこれで消えた。5ヶ月分すべてが実データと矛盾していた `archive.tsx` / `archive-timeline.tsx` の問題も、ファイルごと消えたことで解消。
- **連鎖して未使用になったもの**: `mock.ts` の `mockLeagueInfo` / `mockSliderPhotos` / `mockInitiativeFormats` / `mockTestimonials`、`types/index.ts` の `Project` / `Testimonial`。`Category` と `ActivityStatus` は `Activity` の中で使うため残した。
- **未参照の `public/` 8ファイル**: 初期テンプレSVG5件と旧画像3件。
- **未使用の依存4件**: `clsx` / `tailwind-merge` / `@neondatabase/serverless` / `drizzle-kit`。**`@neondatabase/serverless` は `drizzle-orm` の optional peer dependency として引き続きインストールされる**ことを `npm ls` で確認済み（このアプリは `pg` 経由で接続するため直接は使わない）。`drizzle-kit` は `@neondatabase/auth` 経由でも入る。
- `next.config.ts` の `images.remotePatterns` から `images.unsplash.com` を削除（unsplash の URL はリポジトリに0件）。

**テストは93件のまま1件も減っていない。** これが「掃除で挙動が変わっていない」証拠である。`npm ci` が exit 0 で通ることも確認済み。

### 判断待ちの決着（X2・X3）

ユーザーの判断により、**どちらも現状維持**。

- **X3 メールアドレス**: `info@kouheikosehira.com` は公開3ページに出したままにする。git履歴では 2026-08-31（`2ee1404` ほか）に入ったもので露出期間は短いが、文字でもリンクでも収集プログラムには拾われるため、中途半端な難読化は効かない。実害（迷惑メールの増加）が出てから、捨てられる専用アドレスへ替える。
- **X2 セッションの5分キャッシュ**: `src/lib/neon/auth.ts:13` の `sessionDataTtl: 300` は維持する。停止措置は `dal.ts` が毎回DBを読むため即時に効き、残るのは「盗まれたセッションが最大5分生き残る」範囲にとどまる。

### 会員登録フォームが黙って固まる不具合の修正

**ユーザーが実際に踏んだ。** 確認コードを入力して「メールアドレスを確認する」を押しても何も起こらず、画面にメッセージも出ない状態で止まった。

原因は `src/components/register-form.tsx` の例外処理の欠落。`setIsWorking(true)` のあと `createAuthClient().emailOtp.verifyEmail()` や `fetch()` が**例外を投げると、`setIsWorking(false)` に到達しない**。ボタンは `disabled={!configured || isWorking}` なので押せなくなり、`setNotice` も呼ばれないため画面は無言のまま。同じ作りがログイン・再送・登録の4経路すべてにあった。

- 4経路すべてを `try` / `catch` / `finally` で囲み、**`finally` で必ず `isWorking` を戻す**。
- 失敗の理由を画面に出す。判明している原因（認証基盤が返す `Invalid OTP` など）は括弧で添える。**「そのアドレスが登録済みか」を明かす情報は含まない**ため、ユーザー列挙対策は維持される。
- 失敗は `role="alert"`、成功・案内は `role="status"` に分けた（従来はどちらも `status` で、失敗が読み上げで軽く扱われていた）。
- 併せて、入力欄のプレースホルダの文字色を `white/35` → `white/55` に上げた（監査でコントラスト AA 未達と実測していた6箇所のうちの1つ）。

`tests/register-form.spec.ts`（2件）を追加。通信を強制的に失敗させ、**メッセージが出ること**と**ボタンが押せる状態に戻ること**を確認する。**修正前のコードに戻すとこのテストが落ちることを実測で確認済み。**

このテストはフォームが有効な状態の画面を見るため、`NEXT_PUBLIC_NEON_AUTH_ENABLED` をビルド時に `true` にする必要がある。CIの Build ステップへ追加した。

### 参加動線の現状（調査結果）

ユーザーからの「参加したい人は何をするのか」への回答として、本番で実測した。

- **メール問い合わせは可能。** フッター、運営方針セクション、`/contact` の3か所が `mailto:` で、タップするとメールアプリが開く。フォームは無い。
- **参加動線は現状ゆきどまり。** トップの「進行中の企画」カードは `src/data/mock.ts` のサンプルで、ボタンはすべて `#join`（同じページ内へのスクロール）。そこから `/events` へ進んでも「現在公開中の企画はありません」で終わる。
- **トップの「進行中の企画」はデータベースを見ていない。** 企画を登録しても、出るのは `/events` だけでトップは変わらない。**トップをDBにつなぐのは未着手。**
- 実際の企画が公開された場合の動線は「`/events` 一覧 → 企画詳細 → 『参加方法』欄に主催者が書いた連絡先へ直接連絡」。**サイト上に申し込みボタンは無い**（AIueoが当事者にならない仕様どおり）。

### 仕様書と実装の突き合わせ、画面とフローの確定（2026-09-06）

ユーザーの「ページ構成を先に決めろ。独創だと漏れが出るのでリサーチしてフロー図にしろ」を受けて、`MEMBERSHIP_FEATURE_SPEC.md`（決定仕様131行）と実装21ページを1対1で突き合わせた。結果は設計図として公開した。

**→ https://claude.ai/code/artifact/0de7067b-8736-4325-bf09-ebe7dab72830**

#### ユーザーの決定

- **認証は Google に切り替える。** 現在のメール＋パスワード＋確認コードは廃止する。Google OAuth のコードも設定も現時点で1行も存在しない（`src/` に provider 設定・`signIn.social`・リダイレクトURI・Client ID のいずれも無し）。
- **参加の申し込みは仕様書のまま据え置き。** 会員登録不要、主催者へ直接連絡、AIueo は介在しない。**これは仕様書で決着済みの事項であり、再提示しないこと。**

#### 突き合わせで判明した不足（すべて実コードで確認。優先順）

| # | 不足 | 現状 |
|---|---|---|
| 1 | Google認証 | 未実装。パスワードをAIueoが預かる形になっている |
| 2 | トップの企画がDB未接続 | `src/data/mock.ts` の固定4件。CTAは全て `#join`。公開しても出ない |
| 3 | 企画の編集・下書きからの公開 | `/member/proposals/[id]` に編集手段が無い。`status` を `published` にする会員側の経路も無い。仕様書65行「主催者が内容を更新して再掲載」と cron 通知文「候補日時を更新して再掲載できます」が実行不能 |
| 4 | メニュー/フッターから `/register` への導線 | `navbar.tsx:80,121` と `footer.tsx:20` の「Join / Propose」は `#join` アンカー。全ページ通じて `/register` へのナビリンクが無い |
| 5 | 運営アカウント | まだ1つも存在しない。`docs/ADMIN_BOOTSTRAP_RUNBOOK.md` は旧Supabase前提で要更新 |
| 6 | **通知メールが1通も送られない** | `resend`/`nodemailer`/`smtp` 等の依存も実装も0件。`notifications` に `email_status='pending'` で溜まるだけ。会員向けのサービス内通知UIも無い（`notifications` を読むのは `/admin` の未読数のみ） |
| ~~7~~ | ~~開催日未定の呼びかけ~~ | **2026-09-06 解消（決定によりコード変更なし）**。ユーザーが「開催候補日のみを必須とし、募集期限は必須項目に含めない」と最終決定。仕様書側を`tentative_starts_at`常時必須の現行実装に合わせて修正した |
| 8 | 「公開名」の名称と実態の不一致 | `public_name` は `/member`・`/member/profile`・`/admin/members` にしか出ず、公開ページには一切出ない。企画ページの主催者名は別カラム `organizer_name`。フォームの説明文「企画ページの主催者表示に使います」は誤り |
| 9 | 金銭条件の表示 | `/events/[slug]` が `JSON.stringify(money_details)` を生出力 |
| 10 | 停止会員の読み取り専用アクセス | `/member/history` はDBを一切引かない固定文言9行。仕様書106行の要件が未達 |
| 11 | `money_type='undecided'` | フォームは「未定（公開不可）」と表示するが、`new/actions.ts:70` が検証から除外しており公開できる |

その他の相違: `/admin/moderation` は `reports` のみ表示し `moderation_actions`（措置履歴）を見る画面が無い。`proposal_versions`（版履歴）を表示するページも無い。`visibility='unlisted'` を閲覧できるURLが実装に存在しない。RLSは Neon 側に1つも無く（アプリ層の `owner_id` 絞りで代替）、管理者MFAも未実装。`supabase/` 一式は現行スタックから参照されていない死んだコード。

### 見逃し防止を三重にした

ユーザー指示。2026-09-06、仕様書に明記されている決定事項（参加は登録不要・AIueoは当事者にならない）をエージェントがユーザーへ聞き直す事故が起きたことへの対処。

1. **`CLAUDE.md`** — `@MEMBERSHIP_FEATURE_SPEC.md` / `@IMPLEMENTATION_PLAN.md` / `@HANDOFF.md` を `@` 参照で強制読み込み。ファイル名と役割も本文に明記。**3層のうち、これだけが機械的に働く。**
2. **`AGENTS.md` §4** — 開始時の必読順序に `MEMBERSHIP_FEATURE_SPEC.md` を第1位で追加。「ここで決着している事項をユーザーへ聞き直さない」と明記。
3. **`.claude/hooks/session-start.sh`** — 開始時に3文書の行数・最終更新日と、決定仕様の目次（`##` 見出し）を画面へ出す。

### 終了側（チェックアウト）も対にした

`.claude/hooks/session-end.sh`（Stop フック）を新設。`main` に未到達のコミットが実装ファイルを触っているのに `IMPLEMENTATION_PLAN.md` または `HANDOFF.md` が未更新なら警告する。あわせて「このブランチは main に未到達である」ことも毎回出す。

**`IMPLEMENTATION_PLAN.md` は進捗欄だけを書き換えること。** 基本方針・確定事項・技術方針・受け入れ条件は勝手に変えない。方向を変えるなら変更案としてユーザーへ出す。この規約は `AGENTS.md` §4 にも書いた。

## 前回の作業（2026-09-05 その1 / Claude Code on the web）

### 配線の復旧（最重要）

本番はこのリポジトリと繋がっておらず、ローカルからの手動デプロイだった。GitHub の `deployments` は0件、Vercel の Connected Git Repository は未接続だった。

- ローカルにしか存在しなかった実装（`203b541` 系統、Neon Auth・会員機能・規約セクションを含む）を `local/deployed-203b541` へ退避し、`main` へ統合（PR #5）。
- Vercel の GitHub 連携を接続。**接続後の push で `Vercel: pending → success`、本番の `age` が 0 にリセットされ、新ビルドへ切り替わったことを実測**（PR #6）。
- 旧 `main`（LP 単体）と本番版の統合では、重複ファイルは本番版を採用した。旧 main 側にのみ存在したのは未参照の `.hero-split` / `.who-grid` のみで、これは 1024px でレイアウトが潰れる原因だったため削除した。

### 品質ゲートの新設（PR #1, #2, #4）

CI もテストも無く、`npm run lint` が exit 1 のまま放置され、`next build` が lint を実行しないためビルド成功の裏に隠れていた。

- lint を exit 0 に（`upcoming-events.tsx` の `as any` を `'ALL' | Tag` で型解決）
- `typecheck` / `test` スクリプトを追加、`package-lock.json` を再生成（`npm ci` が EUSAGE で失敗していた）
- Playwright を導入。公開7ページ × 8ブレイクポイント、アンカー整合、コンソールエラー、セキュリティヘッダ、登録エンドポイントの CSRF を検証
- `.github/workflows/ci.yml` で `lint` → `typecheck` → `build` → `test` を必須化

### セキュリティ修正（PR #7, #8, #9）

いずれも実測で確認済み。

- **停止・退会した会員が自分で `active` に復活できた。** `completeProfileAction` が `on conflict do update set status = 'active'` を無条件で実行していた。画面はフォームを出さないが、サーバーアクションは直接呼べる。トランザクション内で `for update` を取って状態を確認し、拒否するよう修正。
- **セキュリティヘッダが皆無だった。** `X-Frame-Options` / `frame-ancestors` / `nosniff` / `Referrer-Policy` / `Permissions-Policy` を全パスへ追加し、`poweredByHeader: false`。CSP は `frame-ancestors` のみ（完全なポリシーはインラインスクリプトの計測が先）。
- **登録エンドポイントがユーザー列挙を許していた。** 応答の `alreadyRegistered` で任意アドレスの登録有無が判別できた。応答を同一化。
- **回数制限が皆無だった。** 上流の Neon Auth (better-auth) は `/email-otp/send-verification-otp` を60秒3回に制限するが、**キーが呼び出し元IP＝このアプリのサーバー**のため全利用者で枠を共有する。攻撃者が枠を食い潰せば正規の登録が全員止まる可用性の問題。`rate_limits` テーブルによる固定ウィンドウ方式で、1アドレス3回/時・1IP 10回/時。上流を叩く前に消費する。

### 表示崩れの修正（PR #2）

- 360px 幅で本文が +41px はみ出し、`overflow-x: hidden` がスクロールバーごと隠すため切れた文字に到達できなかった。`.sec-title` の `overflow-wrap` を `break-word` → `anywhere`（`break-word` は min-content 幅に効かない）、grid トラックを `minmax(0, ...)` 化。
- 幅1024pxちょうどでスライダーが高さ5pxに潰れていた。手書き `@media (max-width:1024px)` と Tailwind `lg:` の同時成立が原因。
- `scroll-padding-top: 68px` を追加。人物カードの `activityIds` 解決失敗で10行中6行がダミー文言になっていた配線を修正。

## 過去の作業（2026-08-31）

- Supabaseの空き枠不足を受け、Vercel Native Neonの利用規約へ同意し、`neon-pink-bucket`を`aiueo-lp`へ接続。PostgresとNeon Authの環境値はDevelopment/Preview/Productionへ自動設定された。
- Neon Authのサーバー用Cookie署名鍵を各環境にSecretとして設定。値はGit・画面・チャットへ出していない。
- `@neondatabase/auth`、`pg`、Drizzle、Vercel DB接続ライブラリを追加し、`/api/auth/[...path]`とNeon Authのサーバー設定を追加。認可の正本をDAL/Server Action/Route Handlerへ置く方針を維持した。
- Proxyは公開ページを認証依存にせず、保護操作ごとにセッションとロールを検証する構成へ整理。`npm run build`成功。
- Neonの空DBへ`drizzle/0000_neon_foundation.sql`を適用し、10テーブルと監査ログ追記専用トリガーを作成。接続確認で`table_count: 10`を確認した。
- `/member/profile`と同意保存をNeon Auth/Neon Postgresへ接続。確認済みメール、現行3文書、公開名、協力内容を単一transactionで保存・active化・監査記録する。`npm run build`成功。
- 公開企画一覧・詳細、主催者の企画作成/一覧/開催状態変更、匿名通報、管理者の企画・会員・通報管理、企画者と管理者のメッセージをNeon Postgresへ移植した。サーバー側で会員ID・管理者ロール・所有者を検証し、書込みは版履歴と監査ログを同一transactionへ記録する。
- `/api/cron/proposal-deadlines`を追加し、公開期限切れ、候補日時3日前の未確定企画の自動非公開、7日前注意の通知outbox作成を実装。Vercel Cronは日次JST 09:00相当（UTC 00:00）で設定した。メール送信サービス未設定のため、現時点では送信待ち通知を残すまでとする。
- `npm run build`成功、Neon接続確認で`table_count: 10`を確認。
- 未参照のSupabaseクライアント・依存パッケージを削除し、`npm run build`を再実行して成功。現在のアプリ実行経路にSupabase依存はない。
- 本番へ`175f22c`/`195ba86`を反映。デプロイURLは`https://aiueo-44tpdo0ex-rahisekos-projects.vercel.app`で、`https://aiueo-lp.vercel.app`と独自ドメインへ反映済み。Productionで`/events`が200、未認証Cronが401、空一覧表示を確認した。
- Neon Authの本番許可ドメインに`https://aiueo-lp.vercel.app`と`https://aiueo.kouheikosehira.com`を追加し、登録時のメール確認コードを有効化した。Neonの共有送信元は`auth@mail.myneon.app`。会員登録UIをメールアドレス・パスワード・確認コード方式へ移し、`NEXT_PUBLIC_NEON_AUTH_ENABLED=true`をProductionへ設定した。
- 本番へ`4ac53df`を反映。`https://aiueo-1zyvunpiv-rahisekos-projects.vercel.app`で`/register`が200、メール登録導線が有効・準備中バナーが非表示であることを確認した。
- 確認コード未着の報告を受け、登録成功後に`emailOtp.sendVerificationOtp`を明示実行するよう修正した。既存の未確認アカウントにも確認コードを再送できる導線を追加し、本番へ`d177428`を反映した。最新デプロイは`https://aiueo-1j21evr86-rahisekos-projects.vercel.app`で、Productionのクライアントバンドルに再送UIが含まれることを確認済み。実メールの到達確認は利用者による再送操作待ち。
- Neon AuthのUsers画面が空であることを確認し、メール未着の前にブラウザSDKからの登録開始が完了していないと判明。登録と確認コード再送を、公式のNeon AuthサーバーAPIを呼ぶ同一オリジンのRoute Handlerへ集約した。送信元検証、メールアドレス/パスワードの入力検証、個人情報を残さないエラーログ、画面への送信失敗表示を追加。`npm run build`成功。`203b541`を本番へ反映し、最新デプロイ`https://aiueo-373vjc9yg-rahisekos-projects.vercel.app`で認証Proxy 200と登録Routeの外部POST拒否403を確認。実メール到達はユーザーの再試行待ち。
- GitHub側の引継ぎ書に従い、ローカル本番版を`C:\Users\user\aiueo-backup-20260903.bundle`へbundle化（23,576,734 bytes）。`main`へはpushせず、GitHubブランチ`local/deployed-203b541`へ`7a4083e`を退避した。`origin/main`との共通祖先は`4eee02a`で、統合前のVercelデプロイ・Git連携変更・force pushは行わない。

- 下部の「運営のかかわり方」を更新。
- AIueoは企画・参加・金銭の当事者ではないことを明記。
- 禁止事項、違反時の掲載削除・メンバー登録取消を明記。
- AIueoが金銭の受領・決定・支払い・精算に関与しないことを明記。
- 問題のある掲載を把握した際の確認・非公開・削除対応を明記。
- トップを元の教室写真だけの全画面構成へ変更。`THIS WAY. TOGETHER.` 以外のコピー・ボタンは除去し、トップではナビゲーションを隠してスクロール後に表示する。
- トップ写真を、AI導入セミナーを実施中の風景へ差し替え。講師の実演と参加者のPC操作が見える構図にした。
- スマホでは講師の顔が見切れない位置に画像をトリミングする。
- トップはモバイルでコピーを画面上部中央、PCで左下に切り替える。最小幅360pxで横はみ出しがないことを本番確認済み。
- Aboutの長い見出しがスマホ幅でグリッドを押し広げていたため、見出しの自然な折り返しとグリッド子要素の縮小を許可した。
- トップ写真を女性講師のAI研修風景へ差し替え。`THIS WAY. TOGETHER.`を左上、AIueoロゴを中央に配置し、360px幅で顔・文字・ロゴが収まることを確認済み。
- メンバー紹介のKouhei Kosehiraに、ユーザー提供のモノクロプロフィール写真を設定。
- ヒーローの`TOGETHER.`を「この指とまれ、」へ変更し、中央ロゴを「仲間を集めるサービス / Aiueo」に変更。小さい説明文と大きいワードマークの2段構成にした。
- ヒーローの英語`THIS WAY.`も削除し、呼びかけを「この指とまれ、」だけに整理。
- ヒーローの視覚階層を`Aiueo`（最大・白）→「この指とまれ、」（中・ゴールド）→「仲間を集めるサービス」（小・白70%）に調整。360px幅でサイズと色の主従を確認済み。
- ヒーロー左上のサブコピーは、ユーザー指示により`THIS WAY. TOGETHER.`へ復帰。Aiueoを主役にしたサイズ・色の階層は維持。
- 問い合わせ先を`info@kouheikosehira.com`へ統一。
- 問い合わせは、メールアプリ未設定のスマホでも使える`/contact`ページに統一。アドレスコピーとメールアプリ起動の両方を用意し、運営方針・フッター・ナビゲーションから到達できるようにした。実体のないX・Discordへのリンクは削除。
- 運営方針・フッターに表示する`info@kouheikosehira.com`は`mailto:`へ変更。アドレスをタップすると直接メール作成画面を開く。本番HTMLで2箇所の`mailto:`を確認済み。
- `/contact`も、メールアドレス本体をタップして直接メール作成画面を開く構成に整理。コピー・メールアプリ起動の別ボタンと補足文は削除した。
- 会員・企画登録・管理画面の決定仕様を`MEMBERSHIP_FEATURE_SPEC.md`に記録。参加は登録不要、企画登録だけ承認済み会員に限定し、外部認証・DBはSupabase Auth + Postgresを採用する。
- 会員登録は管理者承認なしで即時`active`化へ変更。企画者が下書き・公開・中止・開催決定・満席・終了を自己完結し、管理者は全企画の編集・状態変更・非公開・削除権限だけを持つ。
- 開催候補日の7日前に未確定企画へ注意メール、3日前にも未確定なら`auto_hidden`として公開から自動除外する仕様を追加。管理者・企画者の企画別メッセージも追加。
- 会員規約・免責事項は3視点で敵対検証を実施。安全通報、措置の通知・監査ログ、版履歴、異議導線、金銭表示、権限分離、通知・保存方針を公開前の必須設計として`MEMBERSHIP_FEATURE_SPEC.md`へ追加した。
- `IMPLEMENTATION_PLAN.md`を新設。公式のNext.js/Supabase情報に基づき、受け入れ条件→3視点の敵対検証→ユーザー承認→依存関係を満たす並列実装→横断受入の順に固定した。
- `AGENTS.md`と本ファイルに、セッション開始時の計画必読、終了時の計画進捗更新、実装前のPlan mode（または`update_plan`）・敵対検証・ユーザー承認を必須化した。
- Gate 1の受け入れ条件を`GATE_1_ACCEPTANCE_PROPOSAL.md`に作成し、権限・利用者体験・運用/法務の3視点で敵対検証を完了。ユーザーの「始めろ。計画の達成まで行え」を実行承認として記録し、P1/P2を開始。
- P1の初期実装として、`@supabase/ssr`のcookie SSRクライアント、session refresh専用Proxy、サーバー側認可DAL、未適用のSupabase migrationを追加。既存のVite環境変数へのfallbackは廃止し、Next.js用の値だけを許容する`.env.example`を追加。
- P1敵対レビューを実施し、公開企画ビューを`security_invoker`へ変更してRLS迂回を撤廃、匿名者は公開列だけを読めるよう最小列grantを設定。`audit_log`を更新・削除不能な追記専用トリガーにし、初期管理者付与はアプリ外の監査付きrunbookに限定した。
- P2の初期実装として`/terms`、`/disclaimer`、`/privacy`、`/register`、`/auth/callback`、`/member`、`/member/profile`を追加。認証未接続時は会員登録の開始を明示的に止める。公開文書は保存期間の最終確定前であることを表示する。
- 本番で`/register`と`/terms`を360px幅で確認。横スクロールはなく、認証未接続時はGoogleボタンが無効になり「準備中」と表示されることを確認済み。
- 既存Vercel Productionの旧Supabase設定を秘密値非表示で照合したが、ホスト`uirqaycaainrzvubxiub.supabase.co`はDNS解決に失敗。取得した一時環境ファイルは直ちに削除し、旧設定の上書きやmigration適用は行っていない。
- P3として、`complete_member_profile` RPC（確認済みメール、18歳確認、現行3文書のID、公開名・協力内容を同一transactionで検証しconsents保存・active化・audit追記）、プロフィール完了フォーム、停止/退会の読取専用状態ページを追加。`npm run build`成功。
- Vercel Productionには旧Vite形式のSupabase変数のみを検出。既存Supabaseデータの有無を確認するまで、環境変数・DBの上書きやmigration適用はしない。開発・Preview用Supabase変数は未設定。
- 重複していた「企画フォーマット」と「アーカイブ」セクションを外し、進行中企画を横スクロールの1レールへ集約。
- 並行監査を実施し、Aboutの写真カルーセル、メンバー紹介、匿名の声をホームから外した。ホームは「場の説明 → 使い方 → 進行中企画 → 実施ログ → 参加入口 → 運用」の順に整理。
- ヘッダーとフッターから未表示セクションへのリンクを除去し、実在する導線だけに同期。
- ユーザー指示によりメンバー紹介をホームへ復帰（4名表示を本番確認済み）。

## 次にやること

### 最優先: 設計図の不足11件を、番号順に片付ける（#7は2026-09-06に決定により解消。残り10件）

**→ https://claude.ai/code/artifact/0de7067b-8736-4325-bf09-ebe7dab72830** （リンク先の記載は公開時点のまま。#7の解消は本ファイル上部の「確定した問題リスト」を参照）

1〜4 が終われば「企画を立てる道」と「参加する道」が最後までつながる。着手前に必ず設計図と上の表を読むこと。1（Google認証）と5（運営アカウント）はユーザー側の外部作業を伴う。

### 補足: トップページの「進行中の企画」をデータベースにつなぐ（不足 #2）

いま画面に出ている4件は `src/data/mock.ts` のサンプルで、ボタンは同じページ内へスクロールするだけ。実際に企画を登録しても表示は変わらない。**訪問者から見ると、押しても何も起きないボタンが並んでいる状態**である。

方針の候補は2つ。ユーザーの判断が要る。
- A: サンプルを外し、`/events` と同じデータを出す。企画が無いときは正直に「準備中」を出す
- B: サンプルは残し、ボタンの文言を実態に合うもの（例:「AIueoに相談する」）へ変える

### 次点: Tier 4（アクセシビリティ）

Tier 1〜3 は完了。`drizzle/0002` も本番へ適用済み。**X1・X2・X3 のユーザー判断はすべて決着した。** 確定リストで残っているのは Tier 4 だけである。

### 確定した問題リスト（2026-09-05 に全行を読み切って作成。推測は含まない）

Tier 1（セキュリティ・確実なバグ）は実施済み。**Tier 2〜4 はユーザーの指示で持ち越し。** 行番号は `245d610` 時点。

#### Tier 2 — 公開品質 ✅ 完了（2026-09-05）

`metadataBase` / OGP / canonical / `robots.ts` / `sitemap.ts` / ページ別 metadata をすべて追加済み。詳細は上の「今回の作業」を参照。

#### Tier 3 — 掃除 ✅ 完了（2026-09-05）

削除済み。以下は当時の記録。

- **未参照コンポーネント10ファイル（計691行）**: `about` / `archive` / `archive-timeline` / `join` / `next-events` / `people` / `projects` / `projects-spotlight` / `recent-activities` / `testimonials`。
- 連鎖して死んでいる: `mock.ts` の `mockLeagueInfo` / `mockSliderPhotos` / `mockInitiativeFormats` / `mockTestimonials`、`types/index.ts:54-60` の `Testimonial`。
- **未参照 `public/` 8件**: 初期テンプレSVG5件（`file`/`globe`/`next`/`vercel`/`window`）と旧画像3件（`avatar-1.png` / `hero.png` / `hero-ai-seminar.png`）。
- **未使用依存**: `clsx`、`tailwind-merge`、`@neondatabase/serverless`（実際は `pg` の `Pool` を使用）、`drizzle-kit`（設定・script なし）。
- `next.config.ts:29-35` が `images.unsplash.com` を許可しているが unsplash URL は0件。
- `archive.tsx` と `archive-timeline.tsx` が**5ヶ月分すべて**で互いにも `mock.ts` にも一致しない活動名を持つ。両者とも `Tag` 型に無いタグ（`SPRINT`/`ALLIANCE` 等）を素の文字列で使い型検査を素通り。復活させると `id="archive"`・`id="about"`・`id="recent"`・`id="join"` が重複する。
- 描画中ページのセクション番号が `01→(番号なし)→02→03→04→06→07` で **05 が欠番**（`05 / MEMBER VOICES` は死にコード `testimonials.tsx:7`）。`about.tsx:38` の `https://x.com` はサービストップ（死にコード内）。

#### Tier 4 — アクセシビリティ

- モバイルドロワー（`navbar.tsx:114-150`）に `role="dialog"` / `aria-modal` が無く、**Escape 非対応**（`keydown` が0件）、**フォーカストラップ・フォーカス復帰なし**（`useRef`/`.focus()` が0件）。`aria-expanded` はあるが `aria-controls` とドロワー側 `id` が無い。
- `navbar.tsx:40-44` — 未スクロール時に `pointer-events-none -translate-y-full opacity-0` で隠すだけなので、**見えないのに Tab でフォーカスできる要素が8つ**残る。
- `navbar.tsx:19-28` のスクロールロックが幅変化を考慮せず、ドロワーを開いたまま1024px以上へ広げるとページ全体がスクロール不能になる。
- `globals.css` 全191行に **`prefers-reduced-motion` が1箇所も無い**（`scroll-behavior: smooth`、`animate-fadeIn`、`hover:-translate-y-1.5`、`group-hover:scale-105` が無条件で動く）。
- **コントラスト AA 未達6箇所（実測）**: `navbar.tsx:145`（2.37:1）、`register-form.tsx:82` placeholder（約2.7:1）、`operating-guidelines.tsx:75`（3.39:1）、`philosophy-steps.tsx:58`（3.68:1）、`footer.tsx:87`（3.96:1）、`team-members.tsx:50`（4.03:1）。境界4.7台が `recent-log.tsx:27,78`、`upcoming-events.tsx:110`。
- `globals.css:74,110` が `focus-visible` で `outline:none` としたうえ hover と同一の見た目にしている。
- nav 高さ `h-16 md:h-[68px]`（`:40`）とドロワー `top-16`（`:115`）が 768–1023px で4px食い違う。`globals.css:20` の `scroll-padding-top: 68px` もモバイルの64pxと不一致。
- `navbar.tsx:10-16` が初回に `handleScroll()` を呼ばないため、スクロール位置復元やハッシュ付きURLで読み込むとナビが消えたままになる。
- `hero.tsx:12-13` — `src` はデータ由来なのに `alt` が固定文字列。`:28-31` の `aria-label` は role を持たない `div` に付いており支援技術に無視される。
- `upcoming-events.tsx:44-59` のフィルタに `aria-pressed` / `aria-live` が無く、横スクロール領域が `tabIndex` 無しでキーボード操作できない。`register-form.tsx:96` はエラーも成功も同じ `role="status"`。
- `lang="ja"`（`layout.tsx:34`）配下に英語見出し（`hero.tsx:22-24` ほか）が `lang="en"` なしで並ぶ。スキップリンクも0件。
- `register-form.tsx:41,67` が内部遷移に `window.location.assign()` を使い ESLint 警告2件（現状の lint 唯一の警告）。

#### 保留（Tier 1 の監査で見つかったが今回は未対応）

- `src/lib/neon/auth.ts:13` の `sessionDataTtl: 300`。上流でのサインアウト・失効がこのアプリ側へ最大5分反映されない。ただし `dal.ts:34-39` が `role`/`status` を毎回DBから読むため、**停止措置自体は即時**に効く。仕様として許容するか、TTLを下げるかはユーザー判断（下記 X2）。
- `proposal_versions` に版数の列が無く、順序は `created_at` のみ。会員措置には版スナップショットが無い（`before_state`/`after_state` で代替）。
- 状態遷移の妥当性検証は「同じ状態への変更を拒否」と「cron専用状態を選ばせない」までに留めた。`cancelled` → `published` のような後戻りは仕様上「再掲載」が認められているため拒否していない。厳密な遷移表を作るなら仕様の確定が先。
- `drizzle.config.ts` が無く `pgTable` も0件。`drizzle-orm` は `src/lib/neon/db.ts:18` の1行だけで、実体は全画面が生SQL＋手書きキャスト。
- 日時の前後関係（募集期限 vs 開催日 vs 公開期限）と `status='published' ⇔ published_at not null` を結ぶ CHECK が無い。`reports.category`、`moderation_actions.action/reason_code`、`audit_log.action`、`notifications.kind` は CHECK なしの自由文字列。
- 個人ドメインのアドレス `info@kouheikosehira.com` が公開3ページ（`footer.tsx:45,48`、`operating-guidelines.tsx:88,91`、`contact/page.tsx:22,25`）で平文露出（下記 X3）。

### ユーザー判断待ち

すべて決着済み（2026-09-05）。再提示しないこと。

- ~~**X1**: サイトの主題~~ → 「AIを前に出す」。名前 `AI League AIueo` を維持し、`DIRECTION.md` の §5・§18-6 を書き換えた。正式URLは `https://aiueo.kouheikosehira.com`。
- ~~**X2**: セッションキャッシュ 300秒~~ → 現状維持。
- ~~**X3**: メールアドレスの平文露出~~ → 現状維持（放置）。

### 積み残しの外部作業

- Supabaseに空き枠がないため、新規Supabaseプロジェクトの作成は中止。Vercel Native Neon Postgres + Neon Auth + Vercel Cronへの切替受け入れ条件を3視点で確認し、VercelからNeonを接続する。既存のSupabase秘密値・消失ホストは再利用しない。
- Neon接続・初期schema適用・会員プロフィール・企画・管理・通報・期限処理の移行は完了。旧Supabaseのアプリ側依存は除去済み。
- Google OAuthのprovider設定、独自ドメイン送信元/DNS認証、期限通知メールの実送信、初期管理者の監査付き付与は未設定。メールアドレス・パスワード・確認コードによる会員登録は有効化済みで、実メールの到達確認を行う。

- P1 migrationを適用する前に、旧ホストが消失していることを確認し、既存Supabaseプロジェクトの正しい接続先・テーブル・バックアップを確定する。現状はmigration未適用。
- P1のwrite RPC、管理者権限変更、監査原子性、RLS allow/deny DB直結テストを実装・検証する。service roleは期限Cronなどの限定用途に留める。
- P3でプロフィール完了、3文書の版・本文ハッシュ・同意日時の記録、確認済みメールだけの`active`化を実装する。
- Supabase AuthのGoogle OAuth/Magic Link、Vercelの`NEXT_PUBLIC_SUPABASE_*`、認証済み送信ドメイン/SMTPは実アカウント設定が必要。PreviewとProductionは必ず別設定にする。
- 規約・免責事項・プライバシーポリシーの保存期間を最終化し、必要に応じて専門家の確認を受ける。
- P3の権限・運用/法務敵対レビューは利用上限で再試行できず未完了。UXレビューの指摘は反映済みだが、P3完了・本番認証有効化・E2E合格とは扱わない。
- P4として、企画者向けの必須項目フォーム、金銭条件・公開前確認、下書き/公開、開催決定・満席・終了・中止、公開一覧・詳細・通報導線を追加。`save_proposal`、`publish_proposal`、`set_proposal_event_status`はactorとownerをDB側で導出する。
- P5として、`/admin`、`/admin/proposals`、`/admin/members`、`/admin/moderation`、企画別メッセージ画面と管理RPCを追加。管理者の状態変更・全項目編集・会員停止/取消・通報処理は理由、版履歴、措置記録、通知、監査を同一transactionで作成する。
- P4/P5のSQLは未接続のためPostgres直結テスト未実施。公開前にmigration適用、RLS allow/deny、有限状態遷移、管理者MFA、通知失敗、通報の匿名/認証両経路をテストする。
- 完了に必要な外部作業: 正しいSupabaseプロジェクトのDashboard/Project refを確定（旧`uirqaycaainrzvubxiub.supabase.co`はDNS解決失敗）、既存データがあればバックアップ、migration 001–005適用、`NEXT_PUBLIC_SUPABASE_URL`/publishable key・service role・CRON/メールSecretsを環境別に設定、Google OAuth・認証済みSMTP・Cron・Edge Functionを接続する。秘密値はチャットやGitへ貼らない。
- P6として、公開期限切れ・候補日時3日前の自動`auto_hidden`・7日前通知をJSTで処理する`process_proposal_deadlines`、通知outbox、sending状態と15分後再試行、Resend互換Edge Function、Cron設定runbookを追加。秘密値はコードに含めていない。
- P6のEdge FunctionはSupabaseへ未デプロイ。旧SupabaseホストがDNS解決できないため、正しいプロジェクト確定、バックアップ、Secrets登録、Cron作成が必要。
- Supabase Edge FunctionはDeno型のためNext.jsの`tsconfig`検査対象から除外。Vercel本体の型検査とEdge Functionの実行環境を分離した。
- 公開企画ページの通報フォーム、管理者の通報処理、企画者/管理者メッセージ、公開企画へのヘッダー・フッター導線、RLS受入マトリクスを追加。`npm run build`成功。
- 最新Vercel本番デプロイ`https://aiueo-91l44wley-rahisekos-projects.vercel.app`（本番エイリアス`https://aiueo-lp.vercel.app`）で、`/`、`/events`、`/register`、`/terms`が200、未認証の`/admin`と`/member/proposals/new`が307拒否になることを確認。

## 注意点

- **引継ぎは `main` へマージするまで完了ではない。** 2026-09-05、引継ぎ更新を未マージのPR #10 に置いたままセッションを終えたため、次のセッションが8月31日時点の`HANDOFF.md`を読み、P9ではなく古い未解決事項を報告した。規約を `AGENTS.md`「引継ぎは main に到達して初めて完了とする」へ追記し、`.claude/hooks/session-start.sh` がセッション開始時に同じ状態を検出するようにした。**引継ぎ更新を最後の独立PRにしない。**
- セッション開始フックが「引継ぎが main に到達していない可能性がある」と警告した場合、名指しされたブランチの`HANDOFF.md`を先に読むこと。`main`の内容は古い。
- **`drizzle/0001_rate_limits.sql` は本番Neonへ適用済み**（2026-09-05、`neon-pink-bucket` / branch `main` / database `neondb`）。今後マイグレーションを追加する場合は、**必ず本番DBへ適用してからマージする**。逆順にすると、テーブル不在で該当エンドポイントが例外になる。
- 回数制限には CI での検証が無い（CIにDBが無いため）。`scripts/verify-rate-limit.mjs` を使い捨てDBに対して手で流すこと。本番らしい接続文字列は拒否される。
- **上流 Neon Auth の制限はIP単位＝アプリ単位で共有される。** 自前の制限を外すと、攻撃者が上流枠を食い潰して全利用者の登録が止まる。
- **`drizzle/0002_integrity_and_indexes.sql` は本番Neonへ適用済み**（2026-09-05、`neon-pink-bucket` / branch `main` / database `neondb`）。適用後の確認で、追加したインデックス13本とトリガ `moderation_actions_immutable` の存在を実測した。
- **Vercel の Query 画面は複数の命令を1度に実行できない**（`cannot insert multiple commands into a prepared statement`）。マイグレーションを手で流すときは、関数定義と `do $do$ ... $do$;` ブロックの2回に分けること。画面右上の `Read-only` トグルもオフにする必要がある。
- **`/api/auth/[...path]` を素の再エクスポートに戻さないこと。** ライブラリのハンドラは受け取ったパスをそのまま上流へ連結するので、素通しに戻すと登録の回数制限・ユーザー列挙対策・監査の全部を迂回できる。`tests/auth-proxy.spec.ts` が検出する（許可リストを外すと10件中9件が落ちる）。
- **管理操作の失敗を握り潰さないこと。** `withAdminTransaction` の戻り値を無視して `redirect()` すると、非公開化や会員停止が効いていないのに成功と誤認される。失敗は `?error=` で画面へ出す。
- スキーマを変更したら `scripts/verify-migrations.mjs` を使い捨てDBへ流すこと。CIにDBが無いため自動では走らない。
- `main` にはユーザー由来の未追跡フォルダ（`.vinext/`, `.wrangler/`, `dist/`, `work/`）がある。追加・削除しない。
- サイト文言の法的な断定は避け、AIueoが当事者でない範囲と実際に取る措置を明確にする。
