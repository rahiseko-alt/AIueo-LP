-- 企画の「時刻を指定したか」「開催形式を選んだか」を持たせる（P40 企画登録の短縮）。
--
-- 登録画面を短くし、開催日は日付だけ、開催形式は選ばなくても公開できるようにする。
-- 選ばなかったことを値から区別できないと、次の誤表示が起きる。
--   - 時刻を入れていない企画が、0:00 開催に見える
--   - 形式を選んでいない企画が、既定値の「オフライン」と断定して表示される
-- そこで「指定したか」を別の列で持つ。既存の企画はすべて指定済み（true）として扱う。
--
-- Vercelの Query 画面は1度に1命令しか実行できないため、全体を1つの
-- do ブロックにしてある。何度流しても結果は変わらない。
do $do$
begin
  alter table proposals
    add column if not exists tentative_time_specified boolean not null default true,
    add column if not exists format_specified boolean not null default true;
end
$do$;
