# RLS / RPC 受入テストマトリクス

DB接続先が確定したら、ステージングで以下を実行する。各ケースは別ユーザーのセッションJWTを使い、直接テーブル操作とRPC操作を分けて確認する。値・メールアドレス・トークンはログへ出さない。

| Actor | 操作 | 期待結果 |
| --- | --- | --- |
| anon | `public_proposals`を読む | `published`かつ`public`の公開列だけ。下書き・非公開・`unlisted`・所有者IDは返らない |
| anon | `proposals`のINSERT/UPDATE/DELETE | 権限エラー |
| anon | `create_report`（公開企画） | reportが1件作成され、reporterはNULL可 |
| member(active) | 自分のprofileの安全列を更新 | 許可。role/status/監査列の変更は不可 |
| member(pending) | `complete_member_profile`を未確認メール・同意不足で実行 | 失敗し、profileは`pending_profile`のまま |
| member(active) | 他人のprofile/企画/メッセージ/通報/監査を読む | 0行または権限拒否 |
| member(owner) | `save_proposal`、`publish_proposal`、自分のevent status変更 | 必須項目と有限状態を満たす場合のみ許可 |
| member(non-owner) | 他人の企画をRPCで更新・メッセージ送信 | 権限エラー |
| member(suspended/withdrawn) | 企画作成・編集・公開 | 権限エラー。自分の履歴・メッセージは読取/異議のみ |
| admin(active) | 全企画の状態変更・全項目編集・会員停止・通報処理 | 理由必須。版履歴、通知、moderation、auditが同一transactionで追加 |
| admin | 自分自身を停止/降格 | 拒否 |
| 全ロール | `audit_log` UPDATE/DELETE | 追記専用トリガーで拒否 |
| service_role/Cron | `process_proposal_deadlines` | 実行可能。公開期限・3日前・7日前を冪等処理 |

合格条件は、期待結果のほか、監査の旧値/新値・actor・理由・相関ID、通知のdedupe、メール失敗時の`failed`記録を確認できること。DB適用前に本番へ公開しない。
