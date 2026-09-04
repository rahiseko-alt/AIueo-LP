-- 未認証で叩ける登録エンドポイントの回数制限。
--
-- 上流の Neon Auth (better-auth) は /email-otp/send-verification-otp を
-- 60秒あたり3回に制限しているが、そのキーは呼び出し元のIPである。
-- 呼び出し元はこのアプリのサーバーなので、枠は全利用者で共有される。
-- 手前で止めなければ、攻撃者がその共有枠を食い潰し、正規の登録が全員止まる。
--
-- 固定ウィンドウ方式。1行 = 1つの制限対象 × 1つのウィンドウ。
-- window_started_at を主キーに含めることで、ウィンドウが変われば別の行になり、
-- カウンタのリセット処理が不要になる（古い行は cron が掃除する）。

create table if not exists rate_limits (
  -- 'email:foo@example.com' / 'ip:203.0.113.1' のように、対象の種類を前置する
  bucket_key text not null,
  window_started_at timestamptz not null,
  attempts integer not null default 0,
  primary key (bucket_key, window_started_at)
);

-- 掃除用。古いウィンドウの行をまとめて消す。
create index if not exists rate_limits_window_idx on rate_limits (window_started_at);
