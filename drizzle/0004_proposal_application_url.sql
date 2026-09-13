-- 企画に「参加申し込みフォームのURL」を1つ持たせる。
--
-- AIueoは申し込みを受け取らない（MEMBERSHIP_FEATURE_SPEC.md 実装前提）。
-- 主催者が自分で用意した外部フォーム（Googleフォーム等）へ、公開ページから
-- 1押しで行けるようにするためだけの列である。応募者の氏名・連絡先は
-- AIueo側に一切保存しない。
--
-- Vercelの Query 画面は1度に1命令しか実行できないため、全体を1つの
-- do ブロックにしてある。何度流しても結果は変わらない。
do $do$
begin
  alter table proposals
    add column if not exists application_url text;

  alter table proposals drop constraint if exists proposals_application_url_check;
  alter table proposals add constraint proposals_application_url_check
    check (
      application_url is null
      or (application_url ~ '^https?://[^[:space:]]+$' and length(application_url) <= 2000)
    );
end
$do$;
