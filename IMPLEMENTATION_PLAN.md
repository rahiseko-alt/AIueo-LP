# AIueo 会員・企画・管理機能 実装計画

最終更新: 2026-09-12  
計画状態: **Neonへの移行と品質ゲートは完了し、本番稼働中。P9の全行監査で確定した問題のうちTier 1〜3を実施済み。P14で仕様書と実装21ページを突き合わせ、画面構成と3導線を確定した。P17でトップのDB接続、P18でナビ/フッターの`/register`導線を実施し、いずれも本番反映済み。P19で企画の編集・下書き公開機能を実装し、本番反映済み。P21で公開名の説明文・金銭条件表示・停止会員の履歴閲覧を実装し、本番反映済み。P20(会員規約再同意導線)を実装し、本番反映済み。P22(管理者措置理由の会員向け表示)を実装し、本番反映済み。P23(仕様書の`hidden`/`auto_hidden`用語矛盾の解消)を実装し、本番反映済み。P24(アクセシビリティTier 4のうち現存する11件を修正)を実装し、本番反映済み。P25で権限別の操作シナリオ100件を、実施できる手順書として作成した（実施は未着手）。P15でGoogle認証への切替を実装し、本番反映済み（実機確認はユーザー待ち）。P26で全ページ共通のログイン状態バッジを実装した。**P27完了: 会員登録が本番で一度も成功していなかった原因（`jsonb_build_object`への型未指定パラメータによるPostgreSQLエラーで、監査ログ書き込み失敗のたびに登録トランザクション全体がロールバックしていた）を特定し、`$2::text`のキャストで修正した（`main`へマージ・本番反映済み）。P28: 修正反映後にユーザーが実際にGoogle認証を試みたところGoogleの汎用エラーページ「500. That's an error.」が出たと報告があった。2026-09-10に実ブラウザ操作で経路を切り分け、入口と失敗時の戻りは動作を確認（500は再現せず）、未検証区間はGoogleアカウント選択以降の1区間のみと判明した。P29: Googleのログイン画面に`AIueo`と出ない。当初これを「自前の鍵への切替が効いていない証拠」と断定したが、**Neon公式ドキュメントに反する誤りだったため撤回した**（表示されるホスト名は`redirect_uri`由来で、鍵の所有者とは無関係）。500の原因は未特定で、候補は`docs/OAUTH_500_HYPOTHESES.md`に10件を出典つきで整理した。**あわせて、ユーザーの指摘を受けて失敗記録`FAILURES.md`を新設し、「動くことを確かめずに完了と書く」「確認をユーザーへ丸投げする」を`AGENTS.md`§7で禁止した。** P30: 「保存を押しても何も進まない」の原因が、ブラウザ標準の必須チェックによる無言の送信中止であると実ブラウザで特定し、空欄の名前を画面へ出す修正を入れた（本番での実ログイン状態からの保存は未検証）。P31: 公開済み企画を下書きに戻す機能を追加した（本番での実ログイン状態からの取り下げは未検証）。P32: 画面の英語の状態名を日本語へ統一した（本番での実ログイン状態の表示は未検証）。P33: 引継ぎ到達確認の誤警報を、突き合わせ済みSHAの登録制で止めた。P34: 通報を1階層下げ、企画への画像添付を追加し、権限の呼び方を「管理者・登録者・一般」の3つへ統一し、実操作の検証で見つかった導線の断絶12件を直した（PR #59、`22c8951`で`main`へマージ・本番反映済み。`drizzle/0003`も本番適用済みで、適用をこちらで機械的に確認した）。残るのはP28の原因特定、P29のクライアント設定確認、通知メールの送信、初期管理者の付与、およびシナリオの実施である。**

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

- **G1-01**: 決定済み（Google OAuthへ切替。P15）。**2026-09-09に外部設定が完了**: Google Cloud（プロジェクト`aiueo-lp`）でブランディングとウェブアプリケーション用OAuthクライアントを作成し、承認済みリダイレクトURIに`{Neon Auth URL}/callback/google`を登録。Neon ConsoleのGoogleプロバイダーを共用鍵から自前の鍵へ切替済み（バッジ`Shared keys`が消えたことを確認）。あわせてNeon Consoleの`Sign-in with Email`をオフにしたため、**上流のメール＋パスワードログインは既に無効**である
- **既存のメール登録会員を引き継がない**: 決定済み（2026-09-09、恒久）。Google認証へ切り替える時点で存在したメール＋パスワード登録の会員2名は、**移行しない**。Googleログインで作られるアカウントは別人として扱い、アドレスの引き継ぎ・アカウント統合・救済導線はいずれも実装しない。理由: 2名とも動作確認用で、実運用の企画・同意履歴を持たない。**この事項は決着済みであり、次のセッション以降でユーザーへ聞き直さない。**
- **G1-07**: 決定済み（2026-09-06）。開催候補日のみを必須項目とし、募集期限は必須項目に含めない。`MEMBERSHIP_FEATURE_SPEC.md`企画登録フロー2項へ反映済み。現行実装（`tentative_starts_at`を常に必須とする）はこの決定と一致しており、コード変更は不要
- **G1-05**: 決定済み（2026-09-06）。3日前未確定の企画は`auto_hidden`（論理削除・公開から除外・履歴保全）とし、完全消去はしない。削除理由と日時は監査ログに残す。`MEMBERSHIP_FEATURE_SPEC.md`企画登録フロー7項へ既に反映されており、実装（`process_proposal_deadlines`の`auto_hidden`処理）も一致しているため、コード変更は不要
- **G1-06**: 決定済み（2026-09-06）。管理者は全企画の全項目（金銭条件・日程・主催者情報を含む）を編集できる。ただし版履歴、変更差分、理由、企画者への即時通知を必須とする。`MEMBERSHIP_FEATURE_SPEC.md`敵対検証を受けた公開前の必須設計3項へ既に反映されており、管理者の編集RPC/actionの実装も一致しているため、コード変更は不要
- **G1-02〜04、08**: 未決定
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
| P15 | Google認証への切替 | P14 | `/register` をGoogle認証1タップにし、パスワードを預からない形にする | **未完了。未検証区間: Googleアカウント選択→同意→トークン交換→`/member/profile`（理由: 実Googleアカウントの資格情報がこの環境に無い。確かめる手段: ユーザーが実際に1回ログインする）。あわせて「Neonの自前鍵への切替」は2026-09-10に事実でないと確定した（P29、失敗記録 F-02・F-07）。** 以下は2026-09-09時点の記述で、鍵の切替に関する部分は誤りである。PR #46、`d2e62c8`で`main`へマージ・本番反映済み。アプリ側の実装は完了。`/register`はGoogleボタン1つ、メール認証の一式は撤去。戻りのセッション確定は`src/components/oauth-session-sync.tsx`が`getSession()`で行い、`src/proxy.ts`は素通しのまま。lint/typecheck/build/Playwright 111件緑。本番`/register`が「Googleで続ける」を返すことを`curl`で実測確認済み。**実Googleアカウントでの通し確認はユーザーの手動確認待ち**、`emailVerified`の可否も未確認） |
| P16 | 台帳更新の強制（チェックアウト） | P14 | 終了時に`IMPLEMENTATION_PLAN.md`/`HANDOFF.md`の未更新を機械が指摘する | 完了 |
| P17 | トップページのDB接続 | P14 | トップの「進行中の企画」を`/events`と同じ公開企画データへ接続し、即時反映する。0件時は非表示、タグ絞り込みは削除 | 完了（PR #24、`d34f539`で`main`へマージ・本番反映済み。実企画データでの見た目確認は未実施） |
| P18 | ナビ/フッターの`/register`導線 | P14 | `navbar.tsx`/`footer.tsx`の「Join / Propose」を`#join`アンカーから`/register`への通常リンクに変更する | 完了（PR #26、`1564f88`で`main`へマージ・本番反映済み） |
| P19 | 企画の編集・下書きからの公開 | P14 | `/member/proposals/[id]`から企画内容を編集し、下書き⇔公開を切り替えられるようにする。新規作成時の`money_type='undecided'`検証漏れ(不足#11)も同時に修正する | 完了（PR #28、`5198d8b`で`main`へマージ・本番反映済み。実DBでの動作確認は運営アカウント不在のため未実施） |
| P20 | 会員規約再同意導線の修復 | P19の敵対検証で発見 | `/member/profile`のactive分岐に再同意フォーム(`ProfileCompletionForm`)が出ず、規約更新後は既存会員が編集も新規作成も一切できなくなる。規約を実際に更新する前に必ず対応する | 完了（PR #32、`c920152`で`main`へマージ・本番反映済み。規約更新後の実DB確認は未実施） |
| P21 | 公開名説明文・金銭条件表示・停止会員履歴（不足#8〜#10） | P14 | `profile-completion-form.tsx`の公開名説明文を実態に合わせる。`/events/[slug]`の金銭条件表示を`JSON.stringify`生出力から整形表示にする。`/member/history`を固定文言から実データ表示にする | 完了（PR #30、`04c625a`で`main`へマージ・本番反映済み。開発用DBでの手動確認は未実施） |
| P22 | 管理者措置理由の会員向け表示 | P19の敵対検証で発見 | `MEMBERSHIP_FEATURE_SPEC.md`必須設計5項「措置理由を読み取り専用で確認できる」の未達成部分を解消する。管理者が入力した`moderation_actions.reason_text`を、企画非公開時(`/member/proposals/[id]`)、企画履歴一覧(`/member/history`)、会員停止時(`/member/profile`)の3画面へ表示する | 完了（PR #34、`377200a`で`main`へマージ・本番反映済み。読み取り専用の追加表示のみでスキーマ変更なし。開発用DBが無いため実データでの表示確認は未実施） |
| P23 | `MEMBERSHIP_FEATURE_SPEC.md`の`hidden`/`auto_hidden`用語矛盾の解消 | P19の敵対検証で発見 | 企画登録フロー4項が実装に存在しない`submitted`を含み`auto_hidden`が抜けていた。企画登録フロー7項が3日前の自動除外先を`hidden`と書いており、必須設計4項の`auto_hidden`と矛盾していた。コード変更は無く、仕様書側の文言を実装(`drizzle/0000_neon_foundation.sql`のCHECK制約、`process_proposal_deadlines`)に合わせて修正する | 完了（PR #36、`634a22f`で`main`へマージ・本番反映済み。ドキュメントのみの変更でコード変更・DB変更は無い） |
| P24 | アクセシビリティ Tier 4 の現存11件を修正 | P9の全行監査(2026-09-05) | 2026-09-05監査のTier 4リスト13件を現行コードで再検証し、2件解消済み(タグ絞り込みボタンはP17で削除済み、role="alert"/"status"はP13で分離済み)・11件が現存することを確認して修正する。モバイルドロワーのdialog化・Escape・フォーカストラップ・返却、未スクロールnavの`inert`化、ドロワーのビューポート幅変化対応、`prefers-reduced-motion`対応、コントラストAA未達6箇所の是正、focus-visibleの可視化、ナビ高さとscroll-padding-topの不一致解消、初回スクロール状態の同期、hero画像のaria-label修正、横スクロール企画一覧への`tabIndex`付与、スキップリンクの新設、`window.location.assign`のuseRouter化を行う | 完了（PR #38、`f899bf2`で`main`へマージ・本番反映済み。回帰防止のPlaywrightテスト3件(`tests/accessibility.spec.ts`)を追加） |
| P25 | 権限別の操作シナリオ作成（P7の前提） | P24 | 権限6区分について、オーソドックスな操作50件と致命的な危険操作50件を、実施できる手順書として作成する。**シナリオの作成までが範囲で、実施はしない**（実施するのは人。エージェントには検証させない方針） | 作成完了（PR #40 `8bccffe` で作成、PR #42 `74dafb5` で実施用の手順書へ整形。いずれも`main`へマージ済み。`docs/OPERATION_SCENARIOS.md`）。**実施は未着手**。運営アカウント・会員アカウント・テスト用DBが揃っていないため |
| P26 | ログイン状態を示す画面表示（不足） | P15 | ユーザーがGoogleログインを終えても、どのページでもログイン済みかどうかが分からなかった（`navbar.tsx`はトップページにしか無く、ログイン状態を一切表示しない）。全ページ共通の右上バッジで解消する | 完了。`src/components/account-badge.tsx`(サーバーコンポーネント、`getAuthContext()`で判定)を新設し、`src/app/layout.tsx`に追加。未ログイン/認証未設定時は何も描画しない(既存導線を変えない)。ログイン済み・登録未完了は`!`バッジで`/member/profile`へ、有効会員は公開名の頭文字入りバッジで`/member/profile`へ、停止・退会会員は控えめな配色で表示。`lint`/`typecheck`/`NEXT_PUBLIC_NEON_AUTH_ENABLED=true build`/Playwright全111件が緑(ビルドで`/terms`等の静的ページが動的化していないことも確認)。**開発用DBが無いため、実際にログインした状態での表示確認は未実施** |
| P27 | 会員登録失敗の原因特定・修正 | P15 | ユーザーが実際にGoogleでログインし会員登録フォームを送信したところ、「登録を完了できませんでした」で失敗し、本番で会員登録が一度も成功していないことが判明した | 完了（PR #50、`e82e745`で`main`へマージ・**本番反映済み**）。1段階目(PR #49)でログ出力を追加し、ユーザーがVercelのLogsから実エラー`could not determine data type of parameter $2`を提供。2段階目: `completeProfileAction`の監査ログ書き込み`jsonb_build_object('public_name', $2)`がPostgreSQLの型推論エラーを起こし、`profiles`/`consents`書き込み成功後の最後の1文で毎回トランザクション全体がロールバックしていたと判明。`$2::text`のキャストで修正。使い捨てPostgresでエラーの再現とキャストによる解消を実測確認。`lint`/`typecheck`0件、Playwright全111件緑 |
| P28 | Google認証で500エラー(新規・未解決) | P27 | P27修正の反映後、ユーザーが実際にGoogle認証を試みたところGoogle側の汎用エラーページ「500. That's an error.」が出たと報告。発生箇所を特定する前にユーザーがセッションを中断し詳細未回答のまま | 切り分け済み・原因未特定。2026-09-10にユーザー指示（コードを読まず実ブラウザ操作とスクリーンショットのみで検証）に従い本番を操作した。入口（`/register`→`accounts.google.com`のログイン画面）と失敗時の戻り（`error=access_denied`／`code`無効→`/register?auth_error=1`の日本語エラー）はいずれも到達を確認し、500は再現しなかった。4xx/5xxの応答は1件も観測されない。**未検証区間はGoogleアカウント選択→同意→トークン交換→`/member/profile`の1区間のみで、500はここで起きている。** あわせてGmailの記録から時系列を確定した。**2026-09-10 07:21 JST にGoogleログインは一度成功している**（`neon.tech`への許可の通知メールが存在する）。その後 11:07 UTC に会員登録がP27の型推論エラーで失敗し、11:35 UTC にP27の修正が本番反映され、そのあとの試行でGoogle 500に当たった。**11:35 UTC以降にGoogleの許可が成立した記録はメールに無い**（ただし再許可では通知が出ないため、これだけでは不成立の証明にはならない【曖昧】）。500はP29の鍵設定と同じ原因である可能性がある |
| P29 | Googleのログイン画面に`AIueo`と出ない（原因未特定・当初の断定を撤回） | P28の操作検証 | 2026-09-10に「Googleの画面が`neon.tech`と表示される＝自前の鍵への切替が効いていない」と**確定と書いたが、これは誤りだった**（失敗記録 F-10） | **撤回済み。根拠不十分。** Neon公式のトラブルシューティングに「Google OAuth consent screen shows unexpected hostname → That hostname comes from the OAuth redirect URI (your app vs Managed Better Auth)」と明記されている。`redirect_uri`がNeon Authのドメインである以上、**共用鍵か自前鍵かに関係なく`neon.tech`と表示されうる**。したがって画面表示もGoogleの通知メールの件名も、鍵の所有者を判別する根拠にならない。使用中の`client_id`は`1063997916405-quq0arh4eauiuv3rh0d071sigc5dhmj7.apps.googleusercontent.com`（これがユーザー自身のものかは未確認【曖昧】）。判別するには`NEON_API_KEY`でプロバイダー設定を読むか、Google CloudのクライアントIDと突き合わせる必要がある |
| P30 | 保存ボタンを押しても何も進まない | P27・P28 | ユーザーから「保存するを押した後に何も進まない」と報告。実ブラウザで再現し、原因は**ブラウザ標準の必須チェックが送信を黙って止めていた**ことと特定した | **未検証区間: 本番で実ログインした状態からの保存（理由: この環境に実Googleアカウントの資格情報が無い。確かめる手段: ユーザーが本番で金銭欄を空のまま「下書き保存」を押す）。** ローカルにPostgreSQL 16を立てて本番と同じ3migrationを適用し、実Chromiumで再現した。金銭欄（金銭条件の説明・精算方法）が空のままPC幅1280pxで「下書き保存」を押すと、**画面のスクロール位置が1238→1238で1pxも動かない**ことを実測。日付欄に日付だけ入れて時刻が空の場合、3つの掲載確認チェックの入れ忘れでも同じく無反応になる。`src/components/required-fields-notice.tsx`を新設し、空欄の日本語名を消えない形で画面へ出すようにした（企画フォーム・会員登録フォームの両方）。肯定・否定の両方を実測（修正を外すと検証スクリプトがexit 1） |
| P31 | 公開済み企画を下書きに戻す | P30 | ユーザーの指示「公開済み企画を下書きに戻す という機能を追加しろ」。元から`updateProposalAction`に`intent=draft`の経路はあったが、実際には利用者が使えなかった | **未検証区間: 本番で実ログインした状態からの取り下げ（理由: この環境に実Googleアカウントの資格情報が無い。確かめる手段: ユーザーが本番で「公開をやめる」を押し、`/events`から消えることを見る）。** 使えなかった理由は2つ、実測で確認した: (1) ボタンが「下書き保存」のままで押すと公開が落ちることが画面に無い、(2) 編集フォームの3つの掲載確認チェックが編集画面では常に外れており、取り下げるだけなのにブラウザの必須チェックで送信が止まる。単独の`unpublishProposalAction`（所有者チェック二重化、`status='published'`のときだけ実行、`hidden`/`ended`/`cancelled`は対象外、`proposal_versions`/`audit_log`へ`organizer_unpublish`を記録）と「公開をやめる」区画を追加し、公開中はフォームのボタン文言も変えた。実ブラウザで肯定（公開→下書き→再公開と`/events`の出入り）・改ざん（他人の企画IDへ書き換えても変わらない）・否定（区画を外すとexit 1）の3方向を実測 |
| P32 | 状態表示を日本語へ統一 | P31 | ユーザーの指示「ドラフトとかpublicとかplanningじゃ分かりにくい、公開中など他のボタンと同じ表示で統一しろ」。DBの英語の状態名がそのまま画面へ出ていた | **未検証区間: 本番で実ログインした状態での表示（理由: この環境に実Googleアカウントの資格情報が無い。確かめる手段: ユーザーが本番の企画一覧を開き「公開中」「下書き」と出ることを見る）。** 表示用の対応表を`src/lib/proposals/labels.ts`へ1か所に集め、言葉を操作ボタンと揃えた（`draft`→下書き、`published`→公開中、`planning`→調整中、`confirmed`→開催決定、`full`→参加者満席、`auto_hidden`→自動で公開停止、`hidden`→管理者により非公開 ほか。会員状態・権限・公開範囲も同様）。会員3画面（企画一覧・企画詳細・履歴）と管理3画面（企画一覧・状態の選択肢・会員管理）に適用し、`LOCKED_STATUS_LABELS`の重複も共通表へ寄せた。対応表に無い値は英語のまま出す（空欄より気づける）。実ブラウザで5状態を作り、期待した日本語がすべて出て英語の状態名が画面に残らないことを実測。1か所を元に戻すと同じ検証が落ちることも実測 |
| P33 | 引継ぎ到達確認の誤警報を止める | チェックアウトの調査 | ユーザーの指示は未マージ3ブランチの削除。**`git push --delete`が3回とも`HTTP 403`で拒否され、こちらの権限では削除できないと実測した。**そこでユーザーの指示により、警告を出す側（セッション開始フック）を直した | 完了。`.claude/hooks/session-start.sh`の到達確認に**条件C**を追加し、`.claude/handoff-verified.txt`に載せた**先端のコミットSHA**と一致するブランチを落とすようにした。ブランチ名ではなくSHAを鍵にしているため、新しいコミットが積まれれば警告が復活する。落とした件数は毎回画面に出す（黙って消さない）。**実測**: 3件登録で警告が消え件数表示が出る、1件を外すとその1件だけ警告が戻る、本物の未到達ブランチを作ると登録済み3件は落ちたままそれだけが警告に出る。`lint`/`typecheck`0件、`NEXT_PUBLIC_NEON_AUTH_ENABLED=true build`成功、Playwright全111件緑 |

| P34 | 通報の階層下げ・画像添付・立場の統一・導線の実操作検証 | P33 | ユーザーの指示4件。①通報の操作画面が大きく通報ページに見えるので1階層下げる、②画像を添付できるようにする、③権限の曖昧を①管理者②登録者③一般へ統一する、④登録者ページと企画ページの一貫性を、操作経路のチェックリストで順方向・分岐・逆方向とも実操作で検証する | **未検証区間: ログインが必要な操作（画像を選んで保存する／会員側の画面の導線）。理由: この環境に実Googleアカウントの資格情報が無い。確かめる手段: ユーザーが本番でログインし、企画編集画面で画像を選んで「下書き保存」を押し、公開ページにその画像が出ることを見る。** PR #59（`22c8951`）で`main`へマージ・本番反映済み。`drizzle/0003`も本番適用済みで、**適用されたことをこちらで機械的に確かめた**（トップ200・企画一覧200・`/api/proposals/<uuid>/image` が404＝列が存在する。500なら列が無い）。**ログインの要らない範囲は本番でも実測した**: 企画詳細の通報入力欄0個（修正前は2個）、「管理者へ連絡」ボタン1個、通報ページ200・入力欄2個・戻り導線あり・noindexあり、企画詳細からトップと会員登録へ到達可、`/register` に3つの立場が表示。 ④の実測で、**修正前は25項目中12項目が到達不能**だった（公開中の自分の企画の公開ページを見る手段が無い、企画編集から来た道へ戻れない、企画詳細からトップ・会員登録へ行けない、右上バッジが `/member/profile` 固定、ほか）。①は `/events/[slug]/report` を新設し詳細ページからは「管理者へ連絡」ボタンだけにした。②は `drizzle/0003_proposal_images.sql` でDBへ保存し、送信前にブラウザ側で長辺1280pxへ縮める（実測 2314KB→22KB）。下書きの画像は持ち主と管理者以外に見せない。③は `src/lib/auth/roles.ts` に3つの立場を1か所で定め、`/register` と `/member` へ同じ表を出した。④はパンくずと双方向の導線で12件すべて解消。修正後は操作経路40項目・画像10項目がすべてOK。検証は `bash scripts/local-verify-rig.sh` で1コマンドで再現できる |

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
| 2026-09-06 | G1-05を決定。3日前未確定の企画は`auto_hidden`（論理削除・履歴保全）とし、完全消去はしない。`MEMBERSHIP_FEATURE_SPEC.md`企画登録フロー7項・`process_proposal_deadlines`の実装は変更前から既にこの内容だったため、コード変更は無い | ユーザー承認。本ファイルGate 1決定状況へ記録 | 本ファイルGate 1決定状況 |
| 2026-09-06 | G1-06を決定。管理者は全企画の全項目（金銭条件・日程・主催者情報を含む）を編集できるが、版履歴・変更差分・理由・企画者への即時通知を必須とする。`MEMBERSHIP_FEATURE_SPEC.md`敵対検証を受けた公開前の必須設計3項の内容と一致しており、管理者編集の実装も変更前から既にこの内容だったため、コード変更は無い | ユーザー承認。本ファイルGate 1決定状況へ記録 | 本ファイルGate 1決定状況 |
| 2026-09-06 | P17: トップページの「進行中の企画」を`/events`と同じ公開企画クエリ(`src/lib/proposals/public.ts`に共有DAL化)へ接続。0件時はセクション非表示、タグ絞り込みボタンは削除(DBに分類が無く恒久的に無反応になるため)、画像は`mock.ts`の既存素材を順番に割り当て。3視点の敵対検証で見つけた`#events`アンカーリンク破損(who-we-are.tsx/footer.tsx)も同時に修正。PR #24を`main`へマージ | `npm run typecheck`/`lint`/`build`通過、Playwright全95件緑。ローカルDB未接続下で0件時の非表示・リンク遷移・コンソールエラー無しを実測確認。**本番URL(`https://aiueo-lp.vercel.app/`)でも実測**: `id="events"`セクション無し(企画0件のため非表示)、`href="/events"`リンク正常、フィルタボタン文言も残っていない。実企画データでの見た目確認は未実施(運営アカウント不在のため) | PR #24、コミット`d34f539`、`src/lib/proposals/public.ts` |
| 2026-09-06 | P18: `navbar.tsx`(デスクトップ・モバイルドロワーの2箇所)と`footer.tsx`の「Join / Propose」を、トップページ内`#join`アンカーから`/register`への通常リンクに変更。トップページ以外(`/events`、`/member`配下等)でこのボタンを押しても何も起きなかった不具合の修正。PR #26を`main`へマージ | `npm run typecheck`/`lint`/`build`通過、Playwright全95件緑。本番URL(`https://aiueo-lp.vercel.app/`)で`href="/register"`のリンク出現を実測確認 | PR #26、コミット`1564f88` |
| 2026-09-06 | P19: `updateProposalAction`を新設し、`/member/proposals/[id]`で企画内容の編集・下書き⇔公開の切替を可能にした。所有者チェック二重化、`hidden`/`ended`/`cancelled`からの編集拒否、`money_type='undecided'`のまま公開させないガード、`auto_hidden`から日時未更新のまま再公開させない検証(cronへの即時差し戻し=「ヨーヨー」防止)、日時変換(`toDatetimeLocal`)・金銭条件キー変換(`toProposalDefaults`)を実装。`ProposalForm`を`action`/`defaultValues`/`proposalId`のprops化で新規作成・編集共用にした。3視点の敵対検証で見つかった`money_type='undecided'`の新規作成側の検証漏れ(不足#11)、開催状況フォームによる`hidden`企画の無条件status上書きも同時に修正。PR #28を`main`へマージ | `npm run typecheck`/`lint`/`build`通過、Playwright全95件緑。本番URL(`https://aiueo-lp.vercel.app/`)で`/member/proposals/new`が未認証307を実測確認。**運営アカウント不在のため、実DBに対する所有者チェック・状態遷移・日時検証の動作確認は未実施** | PR #28、コミット`5198d8b` |
| 2026-09-07 | P21: `profile-completion-form.tsx`の公開名説明文を実態(公開名は会員ページのみ、企画の主催者名は別項目`organizer_name`)に合わせて修正。`/events/[slug]`に`MoneyConditions`コンポーネントを追加し、`JSON.stringify(money_details)`の生出力を金銭種別ラベル+項目別の整形表示に変更。`/member/history`を固定文言9行から、自分の企画一覧・企画別メッセージ・同意履歴をDBから取得する実データ表示へ全面改修。停止・退会会員は個別企画ページ(`requireActiveMember()`でガードされ非activeはアクセス不可)へのリンクを出さずプレーンテキスト表示にすることで、押しても弾かれるリンクを回避。PR #30を`main`へマージ | `npm run typecheck`/`lint`/`build`通過、Playwright全95件緑。本番URL(`https://aiueo-lp.vercel.app/`)で`/`・`/member/history`とも200を実測確認。**開発用DBが無く、実データでの表示確認(企画・メッセージ・同意履歴)は未実施** | PR #30、コミット`04c625a` |
| 2026-09-07 | P20: `/member/profile`の`status='active'`分岐に、現行3文書(会員規約・免責事項・プライバシーポリシー)への同意確認クエリを追加。未同意なら読み取り専用の「登録内容」表示ではなく、公開名・協力したい内容を既存値で埋めた`ProfileCompletionForm`(再同意用の見出し・説明文)を表示するようにした。サーバー側の`completeProfileAction`(規約更新時のエラー処理、同意済み分だけ追加する`on conflict do nothing`)は元々あったため変更していない | `npm run typecheck`/`lint`/`build`通過、Playwright全95件緑。**開発用DBが無く、規約を実際に更新した状態での再同意フォーム表示・同意後の状態遷移の実DB確認は未実施** | PR #32、コミット`c920152` |
| 2026-09-07 | P22: `moderation_actions.reason_text`(管理者が非公開・状態変更・会員停止時に入力する理由)を会員向けに表示。`/member/proposals/[id]`(hidden/ended/cancelled時)、`/member/history`(企画一覧、状態がロックされた企画のみ)、`/member/profile`(suspended/withdrawn時)の3画面に追加。`action`列で`admin_proposal_state_changed`/`admin_member_status_changed`のみに絞り込み、内容編集(`admin_proposal_edited`)等の無関係な理由が紛れないようにした。クエリはいずれも既存の`owner_id`/認証済み`userId`によるスコープの後に追加しており、他人の企画・会員の理由が漏れる経路はない。スキーマ変更・DBマイグレーションは無い | `npm run typecheck`/`lint`/`NEXT_PUBLIC_NEON_AUTH_ENABLED=true npm run build`通過、Playwright全95件緑。**開発用DBが無く、実際に管理者が理由を入力した状態での表示確認は未実施** | PR #34、コミット`377200a` |
| 2026-09-07 | P23: `MEMBERSHIP_FEATURE_SPEC.md`企画登録フロー4項が実装に存在しない`submitted`を状態一覧に含み、実在する`auto_hidden`を欠いていた点を修正。同7項が3日前の自動除外先を`hidden`と書いており、必須設計4項の`auto_hidden`と矛盾していた点も、`auto_hidden`（企画者が再編集・再公開可能）と`hidden`（管理者の緊急非公開、企画者は編集不可）が別状態であることを明記して解消した。`submitted`は2026-09-05のP10で既にDBのCHECK制約（`drizzle/0000_neon_foundation.sql`）・管理画面の選択肢から除去済みであり、仕様書側が実装に追いついていなかった | ドキュメントのみの変更。`grep`で`src/`に`submitted`の実装参照が`admin/statuses.ts`のコメント（除外理由の説明）のみであることを確認し、コード変更が不要であることを検証した | PR #36、コミット`634a22f` |
| 2026-09-07 | P24: Exploreエージェントで2026-09-05のTier 4リスト13件を現行コードと突き合わせ、2件が既に解消済み（企画一覧のタグ絞り込みボタンはP17で削除、`register-form.tsx`の`role="alert"`/`"status"`分離はP13で実施）であることを確認したうえで、残る11件を修正。`navbar.tsx`にモバイルドロワーの`role="dialog"`/`aria-modal`/`aria-controls`、Escapeでの閉鎖、Tabのフォーカストラップ、閉鎖時のトリガーへのフォーカス返却、未スクロール時のnavへの`inert`、ドロワー表示中のリサイズでのビューポート幅追従、初回マウント時の`handleScroll()`即時実行を追加。`globals.css`に`prefers-reduced-motion`対応、`focus-visible`の可視化（`outline:none`を削除し専用の枠線を追加）、`scroll-padding-top`のブレークポイント追従を追加。コントラスト不足6+2箇所（`navbar.tsx`/`operating-guidelines.tsx`/`philosophy-steps.tsx`/`footer.tsx`/`team-members.tsx`/`recent-log.tsx`）の不透明度を0.6以上へ引き上げ。`hero.tsx`のaria-label付きdivに`role="img"`、英語見出しに`lang="en"`を追加。`upcoming-events.tsx`の横スクロール企画一覧に`tabIndex`/`role="region"`を追加。`layout.tsx`に本文へのスキップリンク(`skip-link.tsx`)を新設。`register-form.tsx`の`window.location.assign`を`useRouter().push`へ置換 | `npm run typecheck`/`lint`（0件）/`NEXT_PUBLIC_NEON_AUTH_ENABLED=true npm run build`通過。Playwright全98件緑（既存95件+新規`tests/accessibility.spec.ts`3件）。新規テストは実ブラウザでドロワーのdialog化・Escape閉鎖・フォーカス返却、スキップリンクのフォーカス可視化と本文への遷移、未スクロールnavが`inert`でTabフォーカスされないことを確認する | PR #38、コミット`f899bf2` |
| 2026-09-09 | P25: 権限6区分（未ログイン／プロフィール未完了／有効会員／停止・退会会員／管理者／システム）について、オーソドックスな操作50件と致命的な危険操作50件を`docs/OPERATION_SCENARIOS.md`へ列挙し、実施できる手順書の形（前提・操作・期待される結果・結果記入欄）に整えた。**シナリオの作成までが今回の範囲で、実施はしていない。** 各行の結果欄は空のまま。実施には運営アカウント・会員アカウント2つ以上・テスト用DBが要るが、いずれも未用意。あわせて、シナリオを書くために実装を読んだ際に「期待どおりに止める処理が見当たらなかった」箇所7件を、検証結果ではなく**要確認の気づき**として同ファイル末尾に分けて記録した | ドキュメントのみの追加。実装は`dal.ts`・会員/管理者の全Server Action・3つのRoute Handlerを読んだ。気づきの7件は実施して確かめる必要があり、この時点では確定した不具合として扱わない | PR #40、コミット`8bccffe` |
| 2026-09-09 | P25の続き: `docs/OPERATION_SCENARIOS.md`を、判定済みの一覧ではなく**実施できる手順書**へ整形した。各行に空の「結果」欄（`—`）を置き、冒頭に「これは手順書であり、検証結果ではない。実施するのは人」「シナリオは実装を読んで書いたが、実際に動かして確かめてはいない」と明記。実施に必要で未用意のもの（運営アカウント・会員アカウント2つ以上・テスト用DB）も冒頭に列挙した。実装を読んだ際の気づき7件は、判定ではなく**要確認**として末尾へ分離した | ドキュメントのみの変更。`main`で結果記入欄100行・旧判定記号0件を確認した | PR #42、コミット`74dafb5` |
| 2026-09-09 | 台帳の整合: `HANDOFF.md`に残っていた整形前の記述（「実コードのガード条件に紐づけて判定したもの」）を手順書としての説明へ差し替え、本ファイルP25行にPR #42を併記した。あわせてセッション終了時に、P25の3本のPR（#40/#42/#43）の経緯と、残件がすべてユーザー側の外部作業か人による実施であることを`HANDOFF.md`へ整理した | ドキュメントのみの変更。`main`（`62c2a55`）で反映を確認した | PR #43、コミット`62c2a55` |
| 2026-09-09 | P15: 会員登録をGoogle認証へ切り替え。`/register`をGoogleボタン1つにし、メール＋パスワード＋確認コードの一式（`/api/membership/registration`、Proxyの`sign-in/email`・`email-otp/*`、Supabase時代の`/auth/callback`）を撤去した。戻りのセッション確定は`src/components/oauth-session-sync.tsx`が`getSession()`で行い、`src/proxy.ts`は素通しのまま。3視点の敵対検証と実操作テストで、当初実装の欠陥3件（相対`callbackURL`でNeonドメインへ解決される／失敗時の戻り先が無く英語のエラー画面に取り残される／middleware委譲は交換失敗時に公開ページを`/register`へ飛ばす）と、既存の同一オリジン検証のバグ（`nextUrl.origin`との比較が`127.0.0.1`と`localhost`の表記違いで正規の送信を403にする）を発見し修正。規約・プライバシーポリシーにGoogleを名指しした | `lint`0件/`typecheck`0件/`NEXT_PUBLIC_NEON_AUTH_ENABLED=true build`成功/Playwright**111件緑**。`sign-in/social`を許可リストから外す、OAuth判定を緩める、交換コンポーネントを外す、の3通りに退行させ、**それぞれテストが実際に落ちることを実測**。同一オリジンは実サーバーへcurlし403/503を確認。マージ後、本番`https://aiueo-lp.vercel.app/register`が「Googleで続ける」を返し、メール・パスワードの入力欄が0件であることを実測。**実Googleアカウントでの通し確認は認証情報が無く未実施** | PR #46、コミット`d2e62c8` |
| 2026-09-09 | `AGENTS.md`に§6「ユーザーへの説明は非エンジニア向けに徹する」を追加。外部サービス（Google Cloud / Neon / Vercel）の設定案内では、画面名・ボタン名・入力値をそのまま示す、専門用語は同じ行で言い換える、1返信で頼む操作は1区切りにする、確定値を知らない項目は`【曖昧】`を付けて取得場所を示す、エラー画面は成否を先に判定して伝える、ユーザー側の外部作業とこちら側のコード作業を毎回分ける、の6点を規約化した | ドキュメントのみの追加。P15（Google認証）の設定案内中にユーザーから受けた指示を、次セッション以降も効くよう規約へ落とした | PR #45、コミット`645ab4a` |
| 2026-09-09 | P26: ユーザーが実際にGoogleログインを試みたところ、トップページに戻っても何も変わって見えず、ログイン済みかどうか判別できないと報告を受けた。原因は`navbar.tsx`がトップページにしか存在せず、しかもログイン状態を一切表示しない設計だったこと。`src/components/account-badge.tsx`(サーバーコンポーネント)を新設し、`getAuthContext()`でログイン状態を判定して`src/app/layout.tsx`から全ページ共通で描画するようにした | `npm run lint`/`typecheck`/`NEXT_PUBLIC_NEON_AUTH_ENABLED=true npm run build`通過(ビルド出力で`/terms`等の静的ページが動的化していないことを確認)。`CHROMIUM_PATH`を指定してPlaywright全111件が緑であることを確認(既存の横スクロール・コンソールエラー・セキュリティヘッダ等のテストに回帰なし)。**開発用DBが無いため、実際にログインした状態でバッジが正しく出ることの確認は未実施** | PR #48、コミット`4f5a054` |
| 2026-09-10 | P27・1段階目: ユーザーが実際にGoogleでログインし会員登録フォームを送信したところ失敗し、「公開されていない」と報告を受けた。調査の結果、企画の非公開ではなく会員登録そのものが完了していないと判明。`completeProfileAction`のcatch節が例外を握り潰し原因をログに残していなかったため、`console.error`を追加した | `lint`/`typecheck`0件、Playwright全111件緑 | PR #49、コミット`83232b4` |
| 2026-09-10 | P27・2段階目(完了): ユーザーがVercelのLogsタブから実エラー`could not determine data type of parameter $2`を提供。`completeProfileAction`の監査ログ書き込み`jsonb_build_object('public_name', $2)`がPostgreSQLの型推論エラーを起こし、`profiles`/`consents`書き込み成功後の最後の1文で毎回トランザクション全体がロールバックしていたと判明。`$2::text`のキャストで修正 | 使い捨てPostgres 16でエラーの再現(`$2`のみ)と、キャスト追加後の成功を実測確認。`lint`/`typecheck`0件、Playwright全111件緑 | PR #50、コミット`e82e745` |
| 2026-09-10 | P28(新規・未解決): P27修正の反映後、ユーザーが実際にGoogle認証を試みたところ、Google側の汎用エラーページ「500. That's an error.」が出たと報告。発生箇所(`/register`の押下直後かGoogle同意後の戻りか、URLが`accounts.google.com`か`aiueo-lp.vercel.app`か)を確認中にユーザーがセッションを中断し、詳細未回答のまま。次セッションはこの2点をまず聞き直すこと。コード側の変更は無い | 未着手。原因の当たりはURLに応じて`HANDOFF.md`「次にやること」に記載 | 本ファイルP27完了の直後 |
| 2026-09-10 | P28の切り分け: ユーザー指示（コードを読まず実ブラウザ操作とスクリーンショットのみで検証）に従い、本番URLに対してChromiumを実操作した。トップ・`/events`・`/member`・`/member/profile`（未ログイン）・`/register`の表示、`/register`のボタン押下による`accounts.google.com`到達、同意キャンセル相当（`error=access_denied`）とコード無効（`code`に無効値）の戻りがいずれも期待どおり動くことを確認。**500は再現しなかった**。未検証区間はGoogleアカウント選択以降の1区間のみと判明。あわせてGoogleのログイン画面が`AIueo`ではなく`neon.tech`と表示されることを発見し、P29として新規に立てた | P28は切り分け済み・原因未特定。P29は未着手 | スクリーンショット12点（セッション作業領域。リポジトリには含めない）。この環境でChromiumを本番URLへ到達させるには`--ssl-version-max=tls1.2`が必須（TLS1.3のClientHelloがエージェントプロキシのトンネルを通らない）ことも実測した。詳細は`HANDOFF.md`「今回の作業（2026-09-10 その4）」 |

| 2026-09-10 | ユーザーから「完了といっただろ」「俺に調べさせることを軽く依頼するな」「同じミスをループしてるだろ」と指摘を受けた。指摘は正しい。(1) 失敗記録を`FAILURES.md`へ1か所に集め（F-01〜F-07）、`CLAUDE.md`の`@`参照とセッション開始フックの両方から必ず読ませるようにした。(2) `AGENTS.md`§7「完了と書ける条件」を新設し、通しで動かしていない区間があるフェーズを「完了」と書くこと、括弧の末尾に「未実施」と添えること、ユーザーの目視報告だけを根拠に「確認済み」と書くことを禁止した。(3) 確認を機械化する`scripts/verify-oauth-entry.mjs`を追加した。(4) P15の状態欄の「完了」と「自前の鍵へ切替済み」を、事実に合わせて訂正した | P15は未完了へ訂正。P29は原因確定・対処未実施 | `FAILURES.md`、`AGENTS.md`§7、`CLAUDE.md`、`.claude/hooks/session-start.sh`、`scripts/verify-oauth-entry.mjs`（期待値一致でexit 0、不一致でexit 1を実測）。P29の根拠はGmailの通知メール（2026-09-10 07:21 JST、件名「Google アカウントの一部のデータを neon.tech と共有しました」）と実ブラウザのスクリーンショット |

| 2026-09-10 | P30: ユーザーの「保存するを押した後に何も進まない」に対応。ローカルにPostgreSQL 16を立てて本番と同じ3migrationを適用し、実Chromiumで開発サーバーを操作して再現した。原因はブラウザ標準の必須チェックが送信を止めていたことで、止まったことが利用者に伝わらない（PC幅では画面のスクロール位置すら動かない）。`src/components/required-fields-notice.tsx`を新設し、送信ボタンを押した時点で同じ判定を行って空欄の日本語名を消えない形で画面へ出し、最初の空欄まで画面を送るようにした。ブラウザ標準の動きは止めていない。`proposal-form.tsx`と`profile-completion-form.tsx`の両方へ適用 | 未検証区間: 本番で実ログイン状態からの保存 | **実測**: 金銭欄が空のときPC幅・スマホ幅とも保存されず「金銭条件の説明 / 精算方法」が画面に出る、全部入力すれば保存される（判定OK・exit 0）。**修正を外すと同じ検証が判定NG・exit 1になることも実測**。`lint`/`typecheck`0件、`NEXT_PUBLIC_NEON_AUTH_ENABLED=true build`成功、Playwright全111件緑 |

| 2026-09-11 | P31: 公開済み企画を下書きに戻す機能を追加。既存の`intent=draft`経路は、ボタン文言が結果を示さないことと、編集画面で3つの掲載確認チェックが常に外れていてブラウザの必須チェックに阻まれることの2点で、実際には使えなかった（実ブラウザで実測）。単独の`unpublishProposalAction`と「公開をやめる」区画を追加し、公開中はフォームのボタン文言も「下書きとして保存（公開はやめます）」「公開したまま保存」に変更 | 未検証区間: 本番で実ログイン状態からの取り下げ | **実測**: ローカルPostgreSQL 16＋本番と同じ3migrationで、公開→下書き（`/events`から消える）→再公開（再び出る）が通る（exit 0）。隠し項目を他人の企画IDへ書き換えて送信しても他人の企画は`published`のまま。区画を外すと同じ検証がexit 1。`lint`/`typecheck`0件、`NEXT_PUBLIC_NEON_AUTH_ENABLED=true build`成功、Playwright全111件緑 |

| 2026-09-11 | P32: 画面に出ていた英語の状態名を日本語へ統一。`src/lib/proposals/labels.ts`を新設して表示用の対応表を1か所に集め、言葉を操作ボタンと揃えた。会員3画面・管理3画面に適用し、`/member/proposals/[id]`が個別に持っていた`LOCKED_STATUS_LABELS`も共通表へ寄せた | 未検証区間: 本番で実ログイン状態での表示 | **実測**: ローカルPostgreSQL 16＋本番と同じ3migrationで`published`/`draft`/`hidden`/`auto_hidden`/`ended`の5件を作り、実Chromiumで6画面を確認。期待した日本語がすべて出て、英語の状態名は画面に1つも残らない（exit 0）。管理画面は権限を`admin`にして選択肢まで確認。一覧の1か所を元に戻すと検証が落ちる。`lint`/`typecheck`0件、`NEXT_PUBLIC_NEON_AUTH_ENABLED=true build`成功、Playwright全111件緑 |

| 2026-09-11 | チェックアウト: セッション開始フックが毎回警告する未マージ3ブランチ（`claude/checkin-6hrtds`・`claude/dazzling-babbage-yxplec`・`docs/handoff-session`）の中身を`main`と突き合わせ、**いずれも取り込み済みで失われた引継ぎは無い**ことを確認した。結果と突き合わせ方法を`HANDOFF.md`「注意点」へ記録し、次セッション以降が同じ調査を繰り返さないようにした | 調査のみ。コード変更なし。ブランチの削除はユーザー判断のため未実施 | `git show origin/<branch>:HANDOFF.md`と`main`版を見出し単位・本文行単位で`comm`比較。`dazzling-babbage-yxplec`は`main`に無い見出し0件、`checkin-6hrtds`は本文1行のみ、`docs/handoff-session`の26行はP9の全行監査前の暫定リストで、確定リストが`main`にある |

| 2026-09-11 | P33: 未マージ3ブランチの削除を試みたが`git push --delete`が`HTTP 403`で拒否され、このセッションのGitHub権限では削除できないと実測した。ユーザーの指示により警告側を修正。`.claude/hooks/session-start.sh`へ条件C（`.claude/handoff-verified.txt`に登録された先端SHAを落とす）を追加した | 完了。ブランチ自体は残っている（削除はユーザーがGitHubのブランチ一覧から行う） | **実測**: 3件登録→警告消失＋「3 件は突き合わせ済みとして除外」、1件除外→その1件だけ警告復活、本物の未到達ブランチを作成→登録済み3件は落ちたままそれだけが警告に出る。検証用ブランチは`commit-tree`でrefのみ作り、確認後に削除した |

| 2026-09-12 | P34: ユーザーの指示4件に対応。①通報を `/events/[slug]/report` へ1階層下げ、企画詳細からは「管理者へ連絡」ボタンだけにした（送信後の受付表示も追加。それまで `?reported=1` を付けて戻るだけで、受け取る側の表示が無かった）。②企画に画像1枚を添付できるようにした（保存先はNeonのDB。外部の保管サービスだと利用者に鍵の発行と環境変数の設定が発生するため避けた。送信前にブラウザ側で長辺1280pxへ縮小）。③`src/lib/auth/roles.ts` に「管理者・登録者・一般」の3つを1か所で定め、`/register` と `/member` へ同じ表を出した。画面に混ざっていた「メンバー登録」も「会員登録」へ揃えた。④操作経路を実ブラウザで通し、**修正前に25項目中12項目が到達不能**であることを実測したうえで全件を直した | 未検証区間: 本番で実ログイン状態での操作 | **実測**: 操作経路40項目すべてOK（修正前は12件NG）、画像の端から端まで10項目すべてOK（2314KBのPNG→22KBのJPEG、下書きは未ログインに404、公開後は200、一覧と詳細に描画、外すと消える、監査ログは726文字まで）。**否定側**: バッジを元に戻すとM-14だけがNGに戻る／「管理者へ連絡」とトップへの導線を外すとG-06・G-10がNGに戻る／`/register` から立場の表を外すと新規テスト3件中2件が落ちる。`lint` 0件、`typecheck` 0件、`NEXT_PUBLIC_NEON_AUTH_ENABLED=true build` 成功、Playwright 全114件緑。再現手段を `scripts/local-verify-rig.sh` として残した |

| 2026-09-12 | P34の仕上げ: PR #59（`22c8951`）を`main`へマージし、本番へ反映した。ユーザーが `drizzle/0003_proposal_images.sql` を本番Neonへ適用した。**適用されたことは、ユーザーの報告ではなくこちらで機械的に確かめた**（失敗記録 F-02 への対処）。あわせて、ログインの要らない範囲の動作を本番で実測した | P34は本番反映済み。残る未検証区間はログインが必要な操作のみ | **実測（本番）**: 新しい列を読む3経路が正常（トップ200／企画一覧200／`/api/proposals/<uuid>/image` が404。列が無ければ500になる）。企画詳細の通報入力欄0個（修正前は2個）、「管理者へ連絡」ボタンと通報ページへのリンクが各1個、通報ページ200・入力欄2個・企画へ戻る導線あり・noindexあり、企画詳細からトップと会員登録へ到達可、「参加するのに会員登録は要りません」の明記あり、`/register` に管理者・登録者・一般の3つが表示。**通報の送信そのものは本番では試していない**（本物の通報記録が残るため。送信経路はローカルの検証装置で通してある） |

## セッション終了チェック

- [ ] `HANDOFF.md`を更新した
- [ ] 本ファイルの状態・証跡・更新履歴を更新した
- [ ] 実装ならPlan mode/`update_plan`、受け入れ条件、敵対検証、ユーザー承認を記録した
- [ ] 実装ならテスト結果、コミット、デプロイURLを記録した
