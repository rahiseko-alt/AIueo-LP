# Google認証で「500. That's an error.」が出る原因の候補

作成: 2026-09-10

ユーザーが本番の `/register` から Google 認証を試みたところ、Google の汎用エラーページ
「500. That's an error. There was an error. Please try again later. That's all we know.」が
出たと報告があった（P28）。

**当初「Neonの共用鍵を使っているからだ」と断定したが、これは根拠が無かった**（失敗記録 F-10）。
Neon公式のトラブルシューティングに次の記述があり、画面に `neon.tech` と出ることは
鍵の所有者と無関係だと分かったためである。

> **Google OAuth consent screen shows unexpected hostname** —
> That hostname comes from the OAuth redirect URI (your app vs Managed Better Auth)
> — [Neon Docs / Auth troubleshooting](https://neon.com/docs/auth/troubleshooting)

原因を1つに絞る前に、候補を出して1つずつ潰す。**以下はすべて仮説であり、確定した原因は無い。**

## 実測で分かっている前提

- 入口（`/register` のボタン → `accounts.google.com` のログイン画面）は到達する。500は再現しない
- 失敗時の戻り（`error=access_denied` / 無効な `code`）は `/register?auth_error=1` へ正しく返る
- 正式ドメイン `aiueo.kouheikosehira.com` でも入口・戻りとも同一に動く
- 使用中の `client_id` は `1063997916405-quq0arh4eauiuv3rh0d071sigc5dhmj7.apps.googleusercontent.com`
- `redirect_uri` は `https://ep-bitter-queen-awnva15n.neonauth.c-12.us-east-1.aws.neon.tech/neondb/auth/callback/google`
- `scope` は `email profile openid`、`code_challenge_method=S256`、`include_granted_scopes=true`
- **2026-09-10 07:21 JST に Google のログインは一度成功している**（許可の通知メールが存在する）
- 500が出たときのURLと、アカウント選択が済んでいたかは**未確認**

## 上から順に潰した結果（2026-09-10、実測）

Googleの認可エンドポイントに直接リクエストを投げて判定した。ブラウザもGoogleアカウントも
使っていない。使った手は2つ。

1. **`prompt=none` を付ける。** Googleは画面を出さず、クライアント設定を評価して
   エラーコードだけを返す。結果は次のとおりで、**これは健全なときの応答である**。

       error=interaction_required&error_subtype=access_denied

   `invalid_client`、`admin_policy_enforced`、`org_internal`、500 のいずれでもない。

2. **`redirect_uri` を1文字変えて送る。** 比較対象を作るため、わざと登録されていない値を送った。
   こちらは次に飛ばされた。

       https://accounts.google.com/signin/oauth/error?authError=...
       （デコードすると redirect_uri_mismatch と
        「You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.
         If you're the app developer, register the redirect URI in the Google Cloud Console.」）

つまり **Googleは本番の `redirect_uri` を受け入れ、偽の値は拒否した。**

| # | 判定 | 根拠 |
| --- | --- | --- |
| 1 | **ほぼ消えた** | Testing公開ステータスの制限は「Access blocked: ... has not completed the Google verification process」という**400系の画面**で出る。500ではない。さらに**プロジェクト所有者本人は Testing でも通れる**うえ、実際に 2026-09-10 07:21 JST に成功した記録がある。所有者以外のGoogleアカウントで試した場合だけ残る【曖昧】 |
| 2 | **ほぼ消えた** | legacy brand のポリシー違反ブロックは、上の手2で実際に出せた「doesn't comply with Google's OAuth 2.0 policy」の**400系の画面**である。本番の正しいリクエストではこの画面に**ならない**。認可段階でポリシー検証は通っている |
| 6 | **確実に消えた** | 偽の `redirect_uri` は `redirect_uri_mismatch` で拒否され、本番の値は受け入れられた。**本番の `redirect_uri` は Google Cloud に登録済みである** |
| 10 | **確実に消えた（認証情報の消失・無効化）** | `client_id` が生きていて有効（無効なら `invalid_client` が返る）。認可エンドポイントが正常に応答しているので、クライアント削除・再生成・プロジェクト無効化ではない |

### #3（Google側の障害）の判定

公式の障害記録を2つ当たった。

- [Google Cloud Status Dashboard](https://status.cloud.google.com/incidents.json)（JSONを直接取得）:
  **2026-09-09・09-10 に作成された障害は1件も無い。** Identity / OAuth / Sign-In に
  影響する記録も無い
- [Google Workspace Status Dashboard](https://www.google.com/appsstatus/dashboard/summary):
  同2日に掲載された障害は無く、**Google Sign-In は「No recent incidents reported」**

| # | 判定 | 根拠 |
| --- | --- | --- |
| 3 | **広範囲の障害は消えた。単発の一時エラーは残る【曖昧】** | 公式2つの障害記録に該当なし。ただし1リクエスト単位の一時的な500は障害記録に載らないため、これだけでは消せない。**判別方法は「時間をおいて同じ操作をもう一度やる」以外に無い**（再現すれば #3 ではない） |

### #4（複数アカウント・Cookie不整合）の判定

実ブラウザ（Chromium、新規プロファイル）で `/register` から Google のログイン画面まで
2回到達したが、いずれも500は出なかった。**この2回は Google の Cookie が1つも無い状態である。**

つまり **Cookie が綺麗な状態では健全**であり、私の成功した検証とユーザーの失敗の差は
**「Googleのセッションが既にあること」と「9/10 07:21 に許可済みであること」の2点に絞られる**。
この2点はそれぞれ #4 と #8 に対応する。

| # | 判定 | 根拠 |
| --- | --- | --- |
| 4 | **Cookieが無い状態では消えた。既存セッションがある状態は未検証** | 新規プロファイルのChromiumで2回、ログイン画面まで正常到達。この環境ではユーザーのブラウザ状態を再現できない |

**#4 と #8 を分ける実験**: シークレットウィンドウで1回だけ試す。Cookieは無いが Google 側の
許可は残っているので、**成功すれば #4、500なら #8** である。

### #8 に対してアプリ側から打てる手が無いことを実測した

`prompt=select_account` を付ければ legacy consent の近道を回避できる可能性があるため、
アプリから渡せるかを試した。`sign-in/social` に `prompt` と `loginHint` を入れて送ると
どちらも 200 で受理されるが、**Neon が発行する Google の認可URLには反映されない**。

    prompt = None
    login_hint = None
    include_granted_scopes = ['true']   ← 常に true で固定される
    scope = ['email profile openid']

**つまり Neon Auth を使っている限り、こちらのコードから Google への認可パラメータを
一切制御できない。** `include_granted_scopes=true` を外すこともできない。#8 が原因だった
場合、アプリ側に打てる手は無く、Google の許可を取り消すか、Neon に依頼するしかない。

### #5（続行の二重クリック）の判定

実ブラウザで「Googleで続ける」を素早く3回押した。**`sign-in/social` への POST は1回だけで、
Google のログイン画面へ正常に遷移した。** こちら側は二重にログインを開始しない
（1回目の押下でボタンが無効化される）。

| # | 判定 | 根拠 |
| --- | --- | --- |
| 5 | **こちら側は消えた。Google の画面上での二重クリックは制御できない** | 3回連続クリックで POST は1回。ただし Google の同意画面で「続行」を2回押す挙動はこちらから防げない。報告されている症状は「新規サインアップの失敗」で、500 のエラーページとは異なるため、そもそも弱い候補である |

**残っているのは #4（既存セッションがある場合）・#5（Google画面上のみ）・#7・#8・#9 の5件。**
**このうち #4・#5・#8 と、#9 の判別は、すべてユーザーのブラウザとGoogleアカウントの中でしか
踏めない。** この環境からは到達できないことを、上のとおり実測で確かめた。

このうち「2026-09-10 07:21 に一度成功し、そのあとの試行で500」という時系列に最も合うのは
**#8（既に許可済みのため2回目以降が `signin/oauth/legacy/consent` へ直行する経路）** である。
同種の「2回目のログインで500」の報告もある。次はこれを潰す。

## 候補（確度の高い順ではなく、切り分けやすい順）

| # | 仮説 | 同種の事例・出典 | どう潰すか |
| --- | --- | --- | --- |
| 1 | **GoogleのOAuthクライアントが「テスト」公開ステータスのまま。** テストユーザーに入れていても、認可の確認段階で落ちる | Apps Script で、テストユーザーに追加済みの外部ドメインアカウントが認可確認で失敗し、**Publish で解消**した実例。「External EDU/domain (non-gmail) users cannot complete google OAuth ... while it is in Testing status, even though they are added to the list of Test Users」 [Google Groups](https://groups.google.com/g/google-apps-script-community/c/MjvebwXVUDg) / Neon公式も「Google app stuck in Testing mode → Add testers ... or publish the OAuth consent screen for production use」[Neon Docs](https://neon.com/docs/auth/troubleshooting) | Google Cloud の Google Auth Platform で公開ステータスを見る。Testing なら Publish する |
| 2 | **旧OAuth同意画面（legacy brand）に古い・無効な値が残り、Googleのポリシー検証がそれを見て全サインインを止めている** | 新しい Google Auth Platform 側は正しいアプリ名なのに、legacy consent screen に古いアプリ名と**無効なサポートメール**が残り、Google Sign-In が全面ブロックされた実例（未解決のまま報告されている） [Google Developer forums](https://discuss.google.dev/t/legacy-oauth-consent-screen-data-developer-information-not-updating-blocking-all-google-sign-in-requests/337307) | ブランディングを作ったのは2026-09-09で時期が一致する。同意画面の項目（アプリ名・サポートメール・デベロッパー連絡先）が全部埋まって有効か確認する |
| 3 | **Google側の一時障害、または設定ロールアウトの不具合** | OAuth2 の 500 は「bad rollouts, usually configuration changes on Google's infrastructure」と報告されている [Google Groups oauth2-dev](https://groups.google.com/g/oauth2-dev/c/MHH8LqxBSXI) / 2016-04-19 に OAuth 2.0 が全リクエストの 1.1% で 500 を返した記録 [Google Cloud Status](https://status.cloud.google.com/incident/appengine/16003) | 時間をおいて再試行し、再現するかを見る。再現しなければこれ |
| 4 | **ブラウザに複数のGoogleアカウントがログインしている／`accounts.google.com` のCookieが壊れている・肥大している** | 「the user in the Google account login token does not match the user ID in the cookie」型の不整合と、Cookie削除で解消する報告 [Google Groups oauth2-dev](https://groups.google.com/g/oauth2-dev/c/lt97yCGF7To) | シークレットウィンドウで、他のGoogleアカウントにログインしていない状態で試す |
| 5 | **同意画面の「続行」を2回以上押した** | 「If a user clicks Continue more than once on Google's OAuth consent screen, new signups will fail」 [Hacker News](https://news.ycombinator.com/item?id=41236745) | 1回だけ押して試す |
| 6 | **リダイレクトURIの不一致・未登録**（ブランチ違い、末尾スラッシュ、http/https） | Neon公式が最頻の失敗として挙げる。「Registering only your marketing site or only the `callbackURL`」 [Neon Docs](https://neon.com/docs/auth/troubleshooting) | 通常は 400 `redirect_uri_mismatch` になるので500の説明にはなりにくい。ただし登録値の突き合わせは必要 |
| 7 | **Neonの共用鍵のまま、または自前鍵の設定が片方だけ**（`client_id` は自前・`client_secret` が空など） | Neon公式は本番で自前鍵を必須とする。「Shared keys are for development only」[Neon Docs / production checklist](https://neon.com/docs/auth/production-checklist) | `NEON_API_KEY` でプロバイダー設定を読む（`scripts/set-google-oauth.mjs`）。**画面に `neon.tech` と出ることは根拠にならない** |
| 8 | **`include_granted_scopes=true` と既存の許可の組み合わせ。** 2026-09-10 07:21 に許可済みのため、2回目以降は同意をスキップして `accounts.google.com/signin/oauth/legacy/consent` へ直行する | この legacy consent 経路が実際に認可URLの `continue=` に入っていることを実測で確認した。同種の「2回目のログインで500」報告あり [strapi #2383](https://github.com/strapi/strapi/issues/2383) | Googleアカウントの「サードパーティのアクセス」から当該アプリの許可を取り消し、初回と同じ経路で試す |
| 9 | **ユーザーが見た500がGoogle以外（Vercel / Neon Auth）のものだった** | 同じ文面のGoogle風エラーページは複数の場所で出る。アプリ側のコールバック処理の例外が 500 として見えた実例 [chatwoot #9980](https://github.com/chatwoot/chatwoot/issues/9980)（`NoMethodError` が OAuth コールバックで 500 になった） | 500が出たときのアドレスバーのURLを確認する。**未確認のまま Google 側と決めつけている** |
| 10 | **Googleクライアントの認証情報が再生成・削除された、あるいはプロジェクトの請求・API有効化の状態が変わった** | 認証情報の不一致は `invalid_client` 等になるのが通常だが、プロジェクト側の状態変化で認可エンドポイントが落ちる報告もある [Unipile: Common Google OAuth errors](https://www.unipile.com/google-oauth-gmail-api-errors/) | Google Cloud のクライアント一覧と、プロジェクトの状態を確認する |

## #7 について、公式ドキュメントでは決着しなかった

検索結果には「共用鍵を使うと同意画面に `Stack Development` と表示される」という記述が
現れたが、**Neonの該当ページ（production checklist、best practices、setup OAuth）を
直接読んでも、その記述は確認できなかった。** 共用鍵のときに何と表示されるかは、
公式ドキュメントに書かれていない。

したがって「`neon.tech` と表示されるから共用鍵」も、「`Stack Development` ではないから
自前鍵」も、**どちらも根拠にならない**。#7 は `NEON_API_KEY` でプロバイダー設定を
読む以外に判別する方法が無い。

## 切り分けの順序（コストの低い順）

1. **500が出たときのURL**を確認する（#9 を潰す）。これが無いままでは Google 側かどうかも決まらない
2. **シークレットウィンドウで1回だけ試す**（#4・#5 を潰す）
3. **Googleアカウントの許可を取り消して初回経路で試す**（#8 を潰す）
4. **公開ステータスと同意画面の項目**を見る（#1・#2 を潰す）
5. **`NEON_API_KEY` でプロバイダー設定を読む**（#7 を潰す）
6. ここまでで再現しなければ #3
