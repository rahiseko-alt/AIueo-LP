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
- 最新のコミット: `a419e9d feat: connect Neon Auth foundation`
- ビルド: `npm run build` が成功（P1/P2初期実装）
- 最新デプロイ: `https://aiueo-9jdw9ju8c-rahisekos-projects.vercel.app`。`https://aiueo-lp.vercel.app`および`https://aiueo.kouheikosehira.com`へエイリアス設定済み

## 今回の作業（2026-08-31）

- Supabaseの空き枠不足を受け、Vercel Native Neonの利用規約へ同意し、`neon-pink-bucket`を`aiueo-lp`へ接続。PostgresとNeon Authの環境値はDevelopment/Preview/Productionへ自動設定された。
- Neon Authのサーバー用Cookie署名鍵を各環境にSecretとして設定。値はGit・画面・チャットへ出していない。
- `@neondatabase/auth`、`pg`、Drizzle、Vercel DB接続ライブラリを追加し、`/api/auth/[...path]`とNeon Authのサーバー設定を追加。認可の正本をDAL/Server Action/Route Handlerへ置く方針を維持した。
- Proxyは公開ページを認証依存にせず、保護操作ごとにセッションとロールを検証する構成へ整理。`npm run build`成功。

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

- Supabaseに空き枠がないため、新規Supabaseプロジェクトの作成は中止。Vercel Native Neon Postgres + Neon Auth + Vercel Cronへの切替受け入れ条件を3視点で確認し、VercelからNeonを接続する。既存のSupabase秘密値・消失ホストは再利用しない。
- Neon接続は完了。新規DBのpublic schemaは空であることを安全なread-only queryで確認済み。次にDrizzle schema/migrationを作成し、開発ブランチで検証後、会員・企画・管理・期限処理をSupabase RPCからサーバーDAL transactionへ移す。
- Google OAuthのprovider設定、メールリンクの送信サービス/DNS認証、Neon Authの本番ドメイン許可は未設定。利用者向けの登録開始フラグは有効化しない。

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

- `main` にはユーザー由来の未追跡フォルダ（`.vinext/`, `.wrangler/`, `dist/`, `work/`）がある。追加・削除しない。
- サイト文言の法的な断定は避け、AIueoが当事者でない範囲と実際に取る措置を明確にする。
