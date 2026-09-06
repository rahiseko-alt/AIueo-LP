# AIueo 会員・企画・管理機能 実装計画

最終更新: 2026-09-06  
計画状態: **Neonへの移行と品質ゲートは完了し、本番稼働中。P9の全行監査で確定した問題のうちTier 1〜3を実施済み。P14で仕様書と実装21ページを突き合わせ、画面構成と3導線を確定した。残るのはGoogle認証への切替、通知メールの送信、企画の編集手段、トップのDB接続、初期管理者の付与である。**

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

### Gate 1 決定状況

- **G1-01**: 決定済み（Google OAuthへ切替。P15、未実装）
- **G1-07**: 決定済み（2026-09-06）。開催候補日のみを必須項目とし、募集期限は必須項目に含めない。`MEMBERSHIP_FEATURE_SPEC.md`企画登録フロー2項へ反映済み。現行実装（`tentative_starts_at`を常に必須とする）はこの決定と一致しており、コード変更は不要
- **G1-02〜06、08**: 未決定
- **RLS不採用**: 決定済み（2026-09-06、恒久）。データベース自体の行レベル権限(RLS)は今後も実装しない。認可はサーバーDAL層のtransactionのみで行う方針を追認した。理由: (1) 現状も全アクセスがサーバー側コード経由でDAL層が毎回検証しており、鍵は1つだが機能している。(2) NeonはSupabaseのような利用者ごとのDB接続を前提にしておらず、RLSを追加するには接続方式ごと作り直す規模の工事が要る。(3) Google認証切替・通知メール送信など優先度の高い未完了作業が他にある。P1・P7の受け入れ条件、`データ・権限の実装境界`、`フェーズごとの敵対検証`の「RLS」表記はサーバーDAL層のallow/deny検証に書き換え済み。`MEMBERSHIP_FEATURE_SPEC.md`「データ保護」項も同様に修正済み。`docs/RLS_TEST_MATRIX.md`はSupabase RLS/RPC前提のまま実装されず終いの設計書として残す（削除しない。次回参照時に本決定を踏まえること）

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
             └─ H. 横断受入: 敵対検証/E2E/DAL層allow-deny/本番確認 ← B + D + E + F + G
```

`A`、`B`、`C`は承認後に並列可能。`D`と`E`はUIを並列に組めるが、マイグレーション・サーバーDAL層の認可は`A`が確定してから統合する。`F`と`G`は企画の状態モデルが完成してから並列可能。

## 実装フェーズと受け入れ条件

| ID | フェーズ | 依存 | 受け入れ条件（要約） | 状態 |
| --- | --- | --- | --- | --- |
| P0 | 運用プロトコル | なし | 開始時必読、終了時の計画/引継ぎ更新、実装ゲートを`AGENTS.md`へ固定 | 完了 |
| P1 | Neon基盤への移行 | G1 | 開発/本番環境分離、Auth SSR、DB migration、サーバーDAL、監査ログ、権限テスト | 実装中（初期schema適用・会員プロフィール移行完了。**Postgres RLSは未設定で、認可は全面的にサーバーDAL層のtransactionのみに依存**。`docs/RLS_TEST_MATRIX.md`はSupabase RLS/RPC前提の設計で現行実装と用語が一致せず、allow/denyの自動テストは無い） |
| P2 | 公開文書・登録導線 | G1 | `/terms`、`/disclaimer`、`/privacy`、`/register`に同意と用途表示を実装 | 完了（外部認証接続待ち） |
| P3 | 会員機能 | P1 + P2 | 外部認証、即時`active`化、同意履歴、自己プロフィール、停止時の読取専用アクセス | 完了（DB適用済み・状態遷移の自動E2E未実施） |
| P4 | 企画機能 | P1 + P3 | 必須入力、金銭条件、状態遷移、公開/再掲載、公開企画ページ | 完了（DB適用済み・状態遷移の自動E2E未実施） |
| P5 | 管理・連絡・通報 | P1 + P4 | 全企画の管理権限、企画別メッセージ、通報、理由/差分/監査ログ | 完了（DB適用済み・状態遷移の自動E2E未実施） |
| P6 | 通知・期限処理 | P1 + P4 + C | 7日前通知、3日前`auto_hidden`、JST判定、重複送信防止、配信失敗記録 | 実装中（JST判定・`notifications`へのoutbox生成はVercel Cronで実装済み。**メール送信コード自体が存在しない**。`email_status`は`pending`のまま進まず、`supabase/functions/notify-deadlines`はNeon移行後に参照されない死んだコード。G1-02未決定のため送信基盤が無い） |
| P7 | 横断受入・本番 | P2–P6 | 3視点の敵対検証、サーバーDAL層のallow/deny検証、E2E、360px/768px/1280px確認、Vercel本番確認 | 未着手 |
| P8 | 配線復旧と品質ゲート | なし | Vercel Git連携、CI必須化、Playwright、認可・列挙・レート制限の修正 | 完了（2026-09-05、本番反映済み） |
| P9 | 未監査領域の読み切り | P8 | 残り約2,200行を監査し、問題リストを確定してユーザーの仕分けを受ける | 完了（確定リストは`HANDOFF.md`。Tier 1のみ実施、Tier 2〜4はユーザー指示で持ち越し） |
| P10 | 認証Proxy・管理操作・スキーマ保全 | P9 | `/api/auth`の許可リスト、管理操作の失敗表示、`submitted`除去、追記専用トリガ、不足インデックス | 完了 |
| P11 | 検索結果・SNS共有（Tier 2） | P9 | `metadataBase`/OGP/canonical/`robots.ts`/`sitemap.ts`/ページ別metadata、`DIRECTION.md`の矛盾解消 | 完了 |
| P12 | 未使用コード・依存の削除（Tier 3） | P9 | 未参照コンポーネント10、`public/`8、依存4、未使用エクスポート・型 | 完了 |
| P13 | 会員登録フォームの例外処理 | P3 | 通信失敗時に理由を表示し、ボタンが固まらないこと | 完了 |
| P14 | 画面とフローの確定 | P9 | 仕様書と実装21ページの突き合わせ、3導線の確定、不足の列挙、見逃し防止の三重化 | 完了（設計図を公開） |
| P15 | Google認証への切替 | P14 | `/register` をGoogle認証1タップにし、パスワードを預からない形にする | 未着手（ユーザー決定済み。Google側の設定作業が必要） |
| P16 | 台帳更新の強制（チェックアウト） | P14 | 終了時に`IMPLEMENTATION_PLAN.md`/`HANDOFF.md`の未更新を機械が指摘する | 完了 |

## データ・権限の実装境界

- 候補テーブル: `profiles`、`terms_versions`、`consents`、`proposals`、`proposal_versions`、`proposal_messages`、`reports`、`notifications`、`moderation_actions`、`audit_log`。
- 参加者の個人情報・参加申込・決済データは保存しない。
- `profiles.role`はクライアント更新を禁止し、管理者権限はサーバー側DAL層のtransactionで検証する（RLSは採用しない。2026-09-06決定）。
- 企画者は自分の企画と自分宛メッセージだけ、管理者は全企画・全監査ログを操作できる。公開利用者は`published`の公開項目だけを読む。
- 状態変更・管理者編集・期限ジョブは、元値、新値、理由、実行者、実行日時、規約版を追記専用で記録する。

## フェーズごとの敵対検証

| フェーズ | 必須の敵対視点 | 退出条件 |
| --- | --- | --- |
| P1 | 権限昇格、DAL層の検証漏れ、秘密情報漏えい | サーバーDAL層のallow/denyマトリクスがテストで通る |
| P2–P3 | 無同意登録、同意証跡、利用目的・退会 | 同意・停止・読取専用の受け入れ条件が承認済み |
| P4 | 虚偽企画、金銭表示、期限・再掲載 | 状態遷移と必須項目のE2Eが通る |
| P5–P6 | 誤削除、通知未達、管理者の恣意編集 | 理由・差分・通知・異議導線を検証済み |
| P7 | モバイル破綻、回帰、公開情報漏えい | 主要E2E、サーバーDAL層のallow/deny、レスポンシブ、本番検証が通る |

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
| 2026-09-01 | 公開企画、主催者操作、通報、管理、企画別メッセージをNeonのサーバーtransactionへ移植。状態変更・管理編集は版履歴、理由、監査、内部通知を同時記録 | `npm run build`通過。認証プロバイダー有効化前のため実ユーザーE2Eは未実施 | `src/app/{events,member/proposals,admin}` |
| 2026-09-01 | Vercel Cronで公開期限切れ、3日前自動非公開、7日前注意の通知outbox生成を実装 | `npm run build`通過。送信サービス未設定のためメール実送信は未実施 | `src/app/api/cron/proposal-deadlines/route.ts`、`vercel.json` |
| 2026-09-01 | 未参照のSupabaseクライアント/依存を撤去し、アプリ実行経路をNeonへ統一 | `npm run build`通過 | `195ba86` |
| 2026-09-01 | Neon移行をProductionへ反映し、公開企画一覧とCron拒否を本番確認 | `/events` 200、未認証Cron 401。認証プロバイダー/送信基盤は未有効化 | `https://aiueo-44tpdo0ex-rahisekos-projects.vercel.app` |
| 2026-09-02 | Neon Authで本番許可ドメイン2件と登録時確認コードを有効化し、共有送信元を確認。会員登録UIをメールアドレス・パスワード・確認コード方式へ変更しProductionへ反映 | `/register` 200、メール登録導線が有効、準備中表示なし。実メール受入は次に実施 | `4ac53df`、`https://aiueo-1zyvunpiv-rahisekos-projects.vercel.app` |
| 2026-09-02 | 確認コード未着を修正。登録成功後に確認コード送信APIを明示実行し、既存の未確認アカウント用に再送導線を追加して本番へ反映 | ビルド成功、Productionクライアントバンドルに再送UIを確認。利用者による実メール到達確認待ち | `d177428`、`https://aiueo-1j21evr86-rahisekos-projects.vercel.app` |
| 2026-09-03 | Neonのユーザー一覧が空であることから登録開始の未完了を診断。登録と再送をNeon AuthサーバーAPI経由へ集約し、同一オリジン検証と失敗表示を追加 | ビルド成功、本番Auth Proxy 200、登録Routeの外部POST拒否403。実メール到達確認待ち | `203b541`、`https://aiueo-373vjc9yg-rahisekos-projects.vercel.app` |
| 2026-09-03 | 本番ローカル版をbundle化し、GitHubの`local/deployed-203b541`へ退避 | `main`は未変更。共通祖先`4eee02a`を確認し、統合判断待ち | `C:\Users\user\aiueo-backup-20260903.bundle`、`origin/local/deployed-203b541` |
| 2026-09-05 | 品質ゲートを新設。lint を exit 0 にし、typecheck/test スクリプト、Playwright、CI必須化を追加。360px のはみ出し、1024px の潰れ、人物カードの props 配線を修正 | Playwright 65件通過、CI初回実行 success | PR #1・#2、`ce47137` |
| 2026-09-05 | ローカル版を`main`へ統合。重複は本番版を採用し、旧main側にのみ存在した未参照の`.hero-split`/`.who-grid`は削除 | 全ゲート通過、テスト65件 | PR #4・#5、`37da37a` |
| 2026-09-05 | VercelのGit連携を接続。README を実態に合わせて書き換え、疎通を実測確認 | 接続前は`deployments` 0件・commit status 0件。接続後は`Vercel: success`、本番の`age`が0にリセットされ新ビルドへ切替 | PR #6、`0d25c1d` |
| 2026-09-05 | 停止・退会会員が`completeProfileAction`で自分を`active`に復活できる認可の穴を修正。セキュリティヘッダ5種を追加し`X-Powered-By`を削除 | 本番ビルドでヘッダ5種を実測。ヘッダを1つ消すとテスト5件中4件が失敗することを確認。テスト70件通過 | PR #7、`40c2607` |
| 2026-09-05 | 登録エンドポイントの`alreadyRegistered`によるユーザー列挙を停止。応答を同一化し、未テストだった同一オリジン検証にテストを追加 | 判定行を削除すると3件中2件が失敗することを確認。テスト73件通過 | PR #8、`0d41542` |
| 2026-09-05 | 登録エンドポイントに回数制限を追加（1アドレス3回/時、1IP 10回/時）。上流Neon Authの制限がIP単位＝アプリ単位で共有される問題への対処 | **PostgreSQL 16実機で検証**: 逐次4回で許可3件、同時20要求でも許可3件、掃除は古い行のみ削除。判定を1回分ゆるめると検証スクリプトが失敗しexit 1 | PR #9、`f7c9a50`、`drizzle/0001_rate_limits.sql`を本番Neonへ適用済み |
| 2026-09-05 | P9: 未監査領域 約2,200行を読み切り、問題リストを確定。引継ぎ記述の誤り4点を訂正 | 確定リストを`HANDOFF.md`へ収録。ユーザー仕分けはTier 1のみ実施 | `HANDOFF.md`「確定した問題リスト」 |
| 2026-09-05 | P10: `/api/auth/[...path]`を許可リスト方式へ。管理操作の失敗を画面表示、`submitted`／cron専用状態を選択肢から除去、同一状態への変更を拒否、`ipAddress()`／`timingSafeEqual`／uuid検証／`release(true)`を追加 | **スタブ上流を立てて実測**: 修正前は`admin/list-users`と`sign-up/email`が上流へ到達、修正後は404で到達せず、許可4パスは到達。許可リストを外すとテスト10件中9件が落ちる。lint/typecheck/build/Playwright 87件が緑 | `src/app/api/auth/[...path]/route.ts`、`src/app/admin/actions.ts`、`tests/auth-proxy.spec.ts`、`tests/admin-access.spec.ts` |
| 2026-09-05 | `drizzle/0002_integrity_and_indexes.sql`: `moderation_actions`の追記専用トリガ、`terms_versions`の現行1件保証、欠けていたインデックス12本 | **PostgreSQL 16実機で検証**: 更新・削除が拒否、現行2件目が拒否、`reports`の未処理カウントが全走査→Index Only Scan、cronの2クエリが全走査→Index Scan。0002の効果を外すと`verify-migrations.mjs`が4件NGでexit 1 | `drizzle/0002_integrity_and_indexes.sql`、`scripts/verify-migrations.mjs` |
| 2026-09-05 | PR #12 をマージし、`drizzle/0002` を本番Neonへ適用 | 適用後に本番で実測: 追加インデックス13本、トリガ`moderation_actions_immutable` 1件を確認 | PR #12、`07fe67e`、`neon-pink-bucket` / branch `main` / database `neondb` |
| 2026-09-06 | P16: セッション終了フック（Stop）を新設。main に未到達のコミットが実装ファイルを触っていて台帳が未更新なら警告する。開始側（正本3文書の提示）と対にした | 実際に走らせ、`.claude/` 配下の変更を検出し台帳更新済みと判定することを確認 | `.claude/hooks/session-end.sh`、`.claude/settings.json`、`AGENTS.md` |
| 2026-09-06 | P1・P6の状態欄も訂正。P1「権限テスト継続」→実際はPostgres RLSが未設定で認可は全面的にサーバーDAL層のみ（`docs/RLS_TEST_MATRIX.md`はSupabase RLS/RPC前提のまま）。P6「Edge Function未デプロイ」→実際はメール送信コード自体が存在せず、`notifications.email_status`は`pending`のまま進まない | `grep -rn "resend\|nodemailer\|smtp\|email_status"`でsrc/配下に送信実装0件を確認。`supabase/functions/notify-deadlines`はNeon移行後未参照。HANDOFF.mdの2026-09-06監査（不足#6、その他の相違のRLS記述）と突き合わせて一致を確認 | 本ファイルP1・P6行 |
| 2026-09-06 | P3〜P5の状態欄「DB未適用」を訂正。2026-09-01時点（Neon移行前）の記述が残っていただけで、`drizzle/0000`（10テーブル一括作成）は2026-08-31に本番Neonへ適用済み、`0001`・`0002`もPR #9・#12で本番適用を実測確認済み。DB自体は3フェーズとも適用済みで、未実施なのは状態遷移・管理者操作を検証する自動E2Eテストと、運営アカウント不在による実データでの通し確認 | `table_count: 10`（08-31実測）、PR #9/#12の適用実測記録、HANDOFF.md「運営アカウントがまだ1つも存在しない」の記述と突き合わせて確認 | 本ファイルP3〜P5行、`HANDOFF.md` |
| 2026-09-06 | P14 の続き: PR #17 を作成。CI が1件失敗したが、差分は文書とフックのみでアプリのコードを含まないため、この変更が原因ではない。トップページが `networkidle` で30秒に収まらずタイムアウト | 原因の裏づけ（画像最適化の実測）は未完了。テスト `layout.spec.ts:146` は `main` でも同じ条件で走っており、以前は緑だった | PR #17、`tests/layout.spec.ts:146` |
| 2026-09-06 | P14: `MEMBERSHIP_FEATURE_SPEC.md` と実装21ページを1対1で突き合わせ、画面一覧・3導線・不足11件を設計図として公開。あわせて見逃し防止を `CLAUDE.md` の`@`参照・`AGENTS.md`の必読順序・セッション開始フックの3か所に入れた | 全ページの認可・リンク・状態遷移をコードで確認。通知メールが1通も送られないこと、企画の編集手段が無いことなどを特定 | https://claude.ai/code/artifact/0de7067b-8736-4325-bf09-ebe7dab72830 、`CLAUDE.md`、`AGENTS.md`、`.claude/hooks/session-start.sh` |
| 2026-09-06 | P13: 会員登録フォームの4経路を try/catch/finally で囲み、失敗理由を `role="alert"` で表示。ユーザーが確認コード画面で無言のまま固まる不具合の修正 | **修正前のコードに戻すと新テストが落ちることを実測**。通信を強制失敗させ、メッセージ表示とボタン復帰を確認。Playwright 95件が緑。CIのBuildに `NEXT_PUBLIC_NEON_AUTH_ENABLED=true` を追加 | `src/components/register-form.tsx`、`tests/register-form.spec.ts`、`.github/workflows/ci.yml` |
| 2026-09-05 | P12: 未参照のコンポーネント10・`public/`8ファイル・依存4件・未使用エクスポート/型を削除。`next.config.ts`のunsplash許可も削除。X2/X3はユーザー判断でどちらも現状維持 | **テストが93件のまま1件も減らない**ことで挙動不変を確認。`npm ci` exit 0、lint/typecheck/build も通過。`@neondatabase/serverless` が `drizzle-orm` の optional peer として残ることを `npm ls` で確認 | `src/components/`、`src/data/mock.ts`、`src/types/index.ts`、`public/`、`package.json` |
| 2026-09-05 | P11: メタデータ・OGP画像・canonical・robots・sitemapを追加。ユーザー決定によりサイト主題は「AIを前に出す」、正式URLは`https://aiueo.kouheikosehira.com`。`DIRECTION.md`の矛盾を解消 | 本番ビルドで実測: OGP画像 200/image/png/39KB を目視確認、`robots.txt`と`sitemap.xml`の内容を確認。`openGraph`を外すと新テストが落ちる。lint/typecheck/build/Playwright 93件が緑 | `src/lib/site.ts`、`src/app/{layout.tsx,opengraph-image.tsx,robots.ts,sitemap.ts}`、`tests/metadata.spec.ts` |
| 2026-09-06 | G1-07を決定。企画登録の必須項目は開催候補日のみとし、募集期限は含めない。設計図の不足#7（`tentative_starts_at`常時必須と仕様書「開催候補日または募集期限」の矛盾）は、仕様書側をこの決定に合わせて解消した。現行実装は変更前から既にこの決定と一致しており、コード変更は無い | `MEMBERSHIP_FEATURE_SPEC.md`企画登録フロー2項を修正。ユーザーの最終決定として本ファイルGate 1決定状況へ記録 | `MEMBERSHIP_FEATURE_SPEC.md`、本ファイルGate 1決定状況 |
| 2026-09-06 | P3〜P6の状態欄が古い文言のまま実態と食い違っていた事故の再発防止として、`session-start.sh`に進捗台帳の鮮度確認を追加。フェーズ表の各行の最終更新日と`src/drizzle/supabase`の最終更新日を比較し、コードの方が新しい行を開始時に列挙する。`AGENTS.md`に「状態欄は前回の文言をそのまま転記しない」の節を追加 | 実際に走らせ、現状のP0/P2/P7/P8/P9/P10/P11が再確認候補として出ることを確認した（P1/P3〜P6/P12〜P16は今回のセッションで書いたため対象外） | `.claude/hooks/session-start.sh`、`AGENTS.md` |
| 2026-09-06 | **RLS不採用を恒久決定**。P1・P7の受け入れ条件、`データ・権限の実装境界`、`フェーズごとの敵対検証`の「RLS」表記をサーバーDAL層のallow/deny検証に書き換え。`MEMBERSHIP_FEATURE_SPEC.md`「データ保護」項も同様に修正し、`docs/RLS_TEST_MATRIX.md`に廃止バナーを追加（削除はしない） | ユーザー判断（非エンジニア向けに推奨と理由を説明のうえ承認）。理由はGate 1決定状況「RLS不採用」に記録 | `MEMBERSHIP_FEATURE_SPEC.md`、`docs/RLS_TEST_MATRIX.md`、本ファイルP1・P7行/データ・権限の実装境界/フェーズごとの敵対検証/Gate 1決定状況 |

## セッション終了チェック

- [ ] `HANDOFF.md`を更新した
- [ ] 本ファイルの状態・証跡・更新履歴を更新した
- [ ] 実装ならPlan mode/`update_plan`、受け入れ条件、敵対検証、ユーザー承認を記録した
- [ ] 実装ならテスト結果、コミット、デプロイURLを記録した
