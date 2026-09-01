# AIueo 会員・企画・管理機能 実装計画

最終更新: 2026-09-01  
計画状態: **Supabaseの利用枠不足により、P1の実基盤をVercel Native Neon Postgres + Neon Authへ切替評価中。公開UIは稼働中。**

この計画は、実装のたびに読む常設の進捗台帳である。仕様の正本は`MEMBERSHIP_FEATURE_SPEC.md`、セッションの正本は`HANDOFF.md`とする。3ファイルは作業開始時にこの順で確認し、終了時にすべて更新する。

## 実装の進め方（強制ゲート）

1. 実装依頼を受けたらPlan modeを開始する。環境にPlan modeがない場合は`update_plan`で同じ計画を表示・更新する。
2. 対象フェーズの受け入れ条件、非対象、データ変更、失敗時の挙動を具体化する。
3. セキュリティ/権限、利用者体験、運用・法務の3視点でサブエージェントの敵対検証を行う。
4. 検証結果と修正版の受け入れ条件をユーザーへ提案し、承認を得る。
5. 依存関係を満たすレーンだけを並列実装する。完了時はテスト、コミット、必要なら本番デプロイを行う。
6. `HANDOFF.md`と本ファイルの進捗・更新履歴を更新して終了する。

## 現時点の確定事項

- 参加者は会員登録不要。企画の登録・公開だけ有効会員に限定する。
- 会員は外部認証と規約同意の完了時に`active`化する。管理者による事前承認・企画審査は行わない。
- 企画者は下書き、公開、中止、開催決定、満席、終了を自走する。管理者は全企画への編集・状態変更・非公開・削除権限を持つ。
- 期限の7日前に未確定企画へ注意メール、3日前に未確定なら公開から自動除外する。
- AIueoは決済・参加申込の当事者にならない。参加方法・金銭条件は企画者が明示する。
- 基盤はNext.js App Router、Vercel、Vercel Native Neon Postgres + Neon Authへ切り替える。Supabaseへの新規接続・既存秘密値の再利用は行わない。

## 公式情報に基づく技術方針

- Next.jsの認可はUIの表示制御だけに依存せず、データアクセス層、Route Handler、Server Actionで毎回検証する。[Next.js Authentication](https://nextjs.org/docs/app/guides/authentication)
- NeonはVercel Marketplaceから接続でき、DB接続値をVercelプロジェクトへ注入できる。[Vercel Postgres](https://vercel.com/docs/postgres) / [Neon for Vercel](https://vercel.com/marketplace/neon)
- 認証はNeon Authを使い、Next.jsサーバー側でセッションを取得・検証する。利用者・セッション情報はNeon Postgresに保持される。[Neon Auth](https://neon.com/docs/auth/migrate/from-auth-v0.1)
- DBアクセスはサーバー側DALのみとし、ロール・所有者・状態遷移をtransactionで検証する。Postgresのテーブル権限を最小化し、アプリ用DB接続文字列をクライアントへ送らない。
- 期限判定はVercel CronからRoute Handlerを日次実行する。Hobbyの実行は日1回かつ最大約59分の揺れがあるため、期限処理は「JST日付で一度だけ」の冪等処理にする。[Vercel Cronの制限](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- 認証/通知メールは認証済み送信ドメインを使い、送信ログと失敗再試行を持つ。
- 非同期Server Componentを含む主要フローはE2E中心で検証する。[Next.js Testing](https://nextjs.org/docs/app/guides/testing)

## Gate 1: 実装前にユーザー承認が必要な項目

| ID | 決めること | 提案する選択肢 | なぜ必要か |
| --- | --- | --- | --- |
| G1-01 | 外部認証方式 | Google OAuthを初期採用 / Google + メールマジックリンク | 会員登録画面と通知先メールの設計に影響する |
| G1-02 | 通知メールの送信者 | `no-reply@kouheikosehira.com`等の専用アドレス / 外部送信サービスの認証済みドメイン | 期限通知と認証メールを本番で確実に届けるため |
| G1-03 | 著作権の条文 | 必要範囲の非独占ライセンス / 対象限定の明示的な権利譲渡 | 現在の「一切帰属」表現を公開規約にする前に確定が必要 |
| G1-04 | 会員の年齢 | 18歳以上に限定 / 未成年は保護者同意を要件化 | 子ども向け企画を扱う場合のリスクを決めるため |
| G1-05 | 3日前の自動削除 | `auto_hidden`（公開から除外・履歴保全） / 完全消去 | 企画者の記録・異議対応と公開表示の扱いを決めるため |
| G1-06 | 管理者の編集範囲 | 全項目を編集可能（差分・通知必須） / 金銭・日程は非公開化のみ | 「全権限」の具体的な運用を確定するため |
| G1-07 | 開催候補日時 | 公開時に必須 / 候補日時なしの期限起点を別指定 | 7日前・3日前の自動処理を正しく判定するため |
| G1-08 | 保存・退会 | データ種別ごとの保存期間・異議の読取専用期間 | 論理削除、監査、プライバシーを矛盾させないため |

## 依存関係と並列レーン

```text
Gate 1（受け入れ条件・敵対検証・ユーザー承認）
 ├─ A. 基盤: Neon Auth/Postgres/サーバーDAL/監査ログ
 ├─ B. 公開文書: 規約・免責・プライバシー・問い合わせ
 └─ C. 送信基盤: 送信ドメイン・SMTP/メールサービス
      │
      ├─ D. 会員登録・認証・プロフィール       ← A + B + C
      ├─ E. 企画登録・公開・公開企画一覧       ← A + D
      ├─ F. 管理画面・通報・メッセージ         ← A + D + E
      └─ G. 期限通知・自動非公開               ← A + E + C
             │
             └─ H. 横断受入: 敵対検証/E2E/RLS/本番確認 ← B + D + E + F + G
```

`A`、`B`、`C`は承認後に並列可能。`D`と`E`はUIを並列に組めるが、マイグレーション・RLSポリシーは`A`が確定してから統合する。`F`と`G`は企画の状態モデルが完成してから並列可能。

## 実装フェーズと受け入れ条件

| ID | フェーズ | 依存 | 受け入れ条件（要約） | 状態 |
| --- | --- | --- | --- | --- |
| P0 | 運用プロトコル | なし | 開始時必読、終了時の計画/引継ぎ更新、実装ゲートを`AGENTS.md`へ固定 | 完了 |
| P1 | Neon基盤への移行 | G1 | 開発/本番環境分離、Auth SSR、DB migration、サーバーDAL、監査ログ、権限テスト | 実装中（初期schema適用・会員プロフィール移行完了、権限テスト継続） |
| P2 | 公開文書・登録導線 | G1 | `/terms`、`/disclaimer`、`/privacy`、`/register`に同意と用途表示を実装 | 完了（外部認証接続待ち） |
| P3 | 会員機能 | P1 + P2 | 外部認証、即時`active`化、同意履歴、自己プロフィール、停止時の読取専用アクセス | 完了（DB未適用・E2E未実施） |
| P4 | 企画機能 | P1 + P3 | 必須入力、金銭条件、状態遷移、公開/再掲載、公開企画ページ | 完了（DB未適用・E2E未実施） |
| P5 | 管理・連絡・通報 | P1 + P4 | 全企画の管理権限、企画別メッセージ、通報、理由/差分/監査ログ | 完了（DB未適用・E2E未実施） |
| P6 | 通知・期限処理 | P1 + P4 + C | 7日前通知、3日前`auto_hidden`、JST判定、重複送信防止、配信失敗記録 | 実装中（Edge Function未デプロイ） |
| P7 | 横断受入・本番 | P2–P6 | 3視点の敵対検証、RLS許可/拒否、E2E、360px/768px/1280px確認、Vercel本番確認 | 未着手 |

## データ・権限の実装境界

- 候補テーブル: `profiles`、`terms_versions`、`consents`、`proposals`、`proposal_versions`、`proposal_messages`、`reports`、`notifications`、`moderation_actions`、`audit_log`。
- 参加者の個人情報・参加申込・決済データは保存しない。
- `profiles.role`はクライアント更新を禁止し、管理者権限はサーバー側とRLSの両方で検証する。
- 企画者は自分の企画と自分宛メッセージだけ、管理者は全企画・全監査ログを操作できる。公開利用者は`published`の公開項目だけを読む。
- 状態変更・管理者編集・期限ジョブは、元値、新値、理由、実行者、実行日時、規約版を追記専用で記録する。

## フェーズごとの敵対検証

| フェーズ | 必須の敵対視点 | 退出条件 |
| --- | --- | --- |
| P1 | 権限昇格、RLS漏れ、秘密情報漏えい | allow/denyマトリクスがテストで通る |
| P2–P3 | 無同意登録、同意証跡、利用目的・退会 | 同意・停止・読取専用の受け入れ条件が承認済み |
| P4 | 虚偽企画、金銭表示、期限・再掲載 | 状態遷移と必須項目のE2Eが通る |
| P5–P6 | 誤削除、通知未達、管理者の恣意編集 | 理由・差分・通知・異議導線を検証済み |
| P7 | モバイル破綻、回帰、公開情報漏えい | 主要E2E、RLS、レスポンシブ、本番検証が通る |

## 進捗記録

| 更新日 | 変更 | 状態 | 証跡 |
| --- | --- | --- | --- |
| 2026-08-31 | 常設計画・セッション運用・実装ゲートを作成 | P0完了、G1待ち | 本ファイル、`AGENTS.md` |
| 2026-08-31 | G1の受け入れ条件を作成し、権限・利用者体験・運用/法務の3視点で敵対検証 | ユーザー承認待ち | `GATE_1_ACCEPTANCE_PROPOSAL.md` |
| 2026-08-31 | Vercel環境変数を読取確認。旧Vite形式のSupabase本番変数のみを検出 | 接続先確認待ち。既存DBに変更なし | `GATE_1_ACCEPTANCE_PROPOSAL.md` |
| 2026-08-31 | ユーザーの「始めろ。計画の達成まで行え」をGate 1の実行承認として記録 | P1/P2開始 | 会話記録、`GATE_1_ACCEPTANCE_PROPOSAL.md` |
| 2026-08-31 | P1敵対レビューを反映。公開ビューのRLS迂回を撤廃、監査ログを追記専用、管理者bootstrap runbook、Next専用環境変数を追加 | migration未適用・P1継続 | `supabase/migrations/202608310001_aiueo_foundation.sql`、`docs/ADMIN_BOOTSTRAP_RUNBOOK.md` |
| 2026-08-31 | P2の公開文書・登録画面・OAuth callback・サーバー認可DALの初期実装 | P2継続 | `src/app/{terms,disclaimer,privacy,register,auth,member}` |
| 2026-08-31 | P1/P2初期実装をVercel Productionへデプロイし、360px幅の`/register`と`/terms`を実機相当表示で確認 | 本番反映済み。認証接続・DB適用は未実施 | `https://aiueo-9jdw9ju8c-rahisekos-projects.vercel.app` |
| 2026-09-01 | P3のプロフィール完了RPC、現行規約3文書の同意、確認済みメール/18歳確認、停止・退会の読取専用導線を実装 | ビルド通過。migration未適用、P3敵対レビューはUXのみ完了 | `supabase/migrations/202608310002_member_activation.sql`、`src/app/member/profile` |
| 2026-09-01 | 既存ProductionのSupabase接続先を値非表示で照合。旧ホストDNS解決失敗を確認し、秘密ファイルを削除 | 接続先の再設定または新規プロジェクト確定待ち | `HANDOFF.md`、Vercel env read-only check |
| 2026-09-01 | P4の企画ワークフローとP5の管理・通報・メッセージRPC/UIを実装。全書込はactorをDB側で導出し、理由・版履歴・監査・通知を同一処理に束ねた | ローカルビルド通過。SQLは接続不能なためDB直結未検証 | `supabase/migrations/202608310003_proposal_workflows.sql`、`202608310004_admin_and_messages.sql`、`src/app/admin` |
| 2026-09-01 | P6のJST期限判定RPC、冪等outbox、sending/failed再試行状態、Secret認証Edge Function、Cron runbookを実装 | ローカルソース確認済み。Supabase接続先消失のためデプロイ・実時刻テスト未実施 | `supabase/migrations/202608310005_deadline_notifications.sql`、`supabase/functions/notify-deadlines`、`docs/NOTIFICATION_CRON_RUNBOOK.md` |
| 2026-09-01 | VercelのNext.jsビルドがDeno用Edge Functionを型検査しないよう`tsconfig`の対象を分離 | ローカルビルド通過。Vercel再デプロイ待ち | `tsconfig.json` |
| 2026-09-01 | P6のoutbox再試行・RLS受入マトリクスを追加し、ヘッダー/フッター/参加導線を公開企画ページへ同期 | ローカルビルド通過。SQL/Edge未接続 | `docs/RLS_TEST_MATRIX.md` |
| 2026-09-01 | 管理/通報/メッセージを含む最新UIをVercel本番へ反映。公開ページは200、未認証の管理・企画登録は307拒否を確認 | Vercel本体は反映済み。Supabase/Edge/Cronは未接続 | `https://aiueo-91l44wley-rahisekos-projects.vercel.app`、`https://aiueo-lp.vercel.app` |
| 2026-09-01 | 旧SupabaseホストがDNS解決不能であることを確認し、DB適用・Edge/Cron・認証有効化の外部再接続条件を明文化 | P7未完了。正しいプロジェクトと安全なSecrets設定が必要 | `HANDOFF.md`、`docs/ADMIN_BOOTSTRAP_RUNBOOK.md`、`docs/NOTIFICATION_CRON_RUNBOOK.md` |
| 2026-09-01 | Supabaseの空き枠不足を受け、Vercel Native Neon Postgres + Neon Auth + Vercel Cronへ切替。CLIでNeon連携を開始 | 利用規約同意待ち。DB・認証・通知の移行は同意後に開始 | `HANDOFF.md`、Vercel Neon Integration |
| 2026-09-01 | NeonをVercelプロジェクトへ接続。開発・Preview・ProductionのPostgres/Auth環境変数が自動設定された | Gate 2の受け入れ条件を作成。Supabaseコードの移植とDB migrationは未実施 | `GATE_2_NEON_MIGRATION_PROPOSAL.md`、Vercel Neon Resource |
| 2026-09-01 | Neon AuthのCookie SecretをSecret環境変数として設定し、認証Route/DALの移植を開始 | `npm run build`通過。DB schemaとGoogle/メール認証設定は未完 | `src/lib/neon/auth.ts`、`src/app/api/auth/[...path]` |
| 2026-09-01 | Neon初期migrationを適用し、10テーブル・監査ログの追記専用化・現行3文書を作成。会員プロフィール同意をNeon transactionへ移植 | DB接続確認・`npm run build`通過。企画/管理/期限処理の移植は継続 | `drizzle/0000_neon_foundation.sql`、`src/app/member/profile/actions.ts` |

## セッション終了チェック

- [ ] `HANDOFF.md`を更新した
- [ ] 本ファイルの状態・証跡・更新履歴を更新した
- [ ] 実装ならPlan mode/`update_plan`、受け入れ条件、敵対検証、ユーザー承認を記録した
- [ ] 実装ならテスト結果、コミット、デプロイURLを記録した
