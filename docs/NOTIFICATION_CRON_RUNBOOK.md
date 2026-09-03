# 期限通知・メール送信の設定

Supabase DashboardまたはCLIで、migration 005を適用後にEdge Function `notify-deadlines`をデプロイする。次の値はSecretsへ登録し、Git・Vercelの公開変数へ置かない。

- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `EMAIL_API_KEY`
- `EMAIL_FROM`（認証済み送信ドメインのアドレス）
- `PUBLIC_APP_URL=https://aiueo-lp.vercel.app`

Supabase Cronは、Vaultから`CRON_SECRET`を読み、Edge Functionへ`POST`する定時ジョブとして登録する。Cron設定の作成者だけがSecretを読める状態を確認し、公開URLからSecretなしで200にならないことを確認する。

初回はステージングで、7日前通知、3日前`auto_hidden`、公開期限`expired`、重複実行、メール失敗（サービス内通知が残る）を時刻固定して確認する。本番ではJSTの毎時実行とし、実行ID・失敗ログを管理画面から確認する。
