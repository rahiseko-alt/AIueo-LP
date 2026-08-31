# AIueo 会員・企画・管理機能 実装計画

最終更新: 2026-08-31  
計画状態: **Gate 1（受け入れ条件の確定）待ち**

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
- 基盤はNext.js App Router、Vercel、Supabase Auth + Postgresを採用する。

## 公式情報に基づく技術方針

- Next.jsの認可はUIの表示制御だけに依存せず、データアクセス層、Route Handler、Server Actionで毎回検証する。[Next.js Authentication](https://nextjs.org/docs/app/guides/authentication)
- Next.jsのcookieベースSSR認証には`@supabase/ssr`を使う。旧`auth-helpers`は採用しない。[Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework)
- 公開スキーマの各テーブル/ビューでRLSと最小権限のgrantを設定し、操作別の許可・拒否テストを作成する。[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- 期限判定はSupabase CronからEdge Functionを定期実行し、秘密情報はVault/Secretsで扱う。[Supabase scheduling](https://supabase.com/docs/guides/functions/schedule-functions)
- 認証メールは本番用SMTPが必須。通知メールはEdge Function＋送信サービスで送り、ドメイン認証と送信ログを持つ。[Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) / [Edge Functions email](https://supabase.com/docs/guides/functions/examples/send-emails)
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

## 依存関係と並列レーン

```text
Gate 1（受け入れ条件・敵対検証・ユーザー承認）
 ├─ A. 基盤: Supabase/Auth/DB/RLS/監査ログ
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
| P1 | Supabase基盤 | G1 | 開発/本番環境分離、Auth SSR、DB migration、RLS/grant、監査ログ、権限テスト | 未着手 |
| P2 | 公開文書・登録導線 | G1 | `/terms`、`/disclaimer`、`/privacy`、`/register`に同意と用途表示を実装 | 未着手 |
| P3 | 会員機能 | P1 + P2 | 外部認証、即時`active`化、同意履歴、自己プロフィール、停止時の読取専用アクセス | 未着手 |
| P4 | 企画機能 | P1 + P3 | 必須入力、金銭条件、状態遷移、公開/再掲載、公開企画ページ | 未着手 |
| P5 | 管理・連絡・通報 | P1 + P4 | 全企画の管理権限、企画別メッセージ、通報、理由/差分/監査ログ | 未着手 |
| P6 | 通知・期限処理 | P1 + P4 + C | 7日前通知、3日前`auto_hidden`、JST判定、重複送信防止、配信失敗記録 | 未着手 |
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

## セッション終了チェック

- [ ] `HANDOFF.md`を更新した
- [ ] 本ファイルの状態・証跡・更新履歴を更新した
- [ ] 実装ならPlan mode/`update_plan`、受け入れ条件、敵対検証、ユーザー承認を記録した
- [ ] 実装ならテスト結果、コミット、デプロイURLを記録した
