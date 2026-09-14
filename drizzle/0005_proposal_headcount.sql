-- 企画に「定員」と「参加人数」を持たせる。
--
-- **参加人数は主催者を含めた数である。** 1なら主催者だけ、2なら主催者ともう1人。
-- 「参加者」だと主催者だけなのか別に参加者がいるのか読み手に分からないため、
-- 画面の言葉も数え方もこれに合わせている。定員も主催者を含めた上限とする。
--
-- 企画の一覧カード（企画の中に入る前）で、何人集まっているかが分かるようにする
-- ためだけの列である。**応募者の氏名・連絡先はAIueoに一切保存しない**
-- （MEMBERSHIP_FEATURE_SPEC.md 実装前提「参加申込も初期版では外部フォームまたは
-- 主催者指定の方法へ委ねる」を変えていない）。数を入れるのは企画者本人で、
-- AIueoが自動で数えることはしない。
--
-- capacity は未設定を許す（上限を決めない呼びかけがあるため）。
-- participant_count は 0 から始まる。定員を超える値も拒まない
-- （主催者が実際に定員より多く受け入れることがあるため。画面では「満席」と出す）。
--
-- Vercelの Query 画面は1度に1命令しか実行できないため、全体を1つの
-- do ブロックにしてある。何度流しても結果は変わらない。
do $do$
begin
  alter table proposals
    add column if not exists capacity integer,
    add column if not exists participant_count integer not null default 0;

  alter table proposals drop constraint if exists proposals_capacity_check;
  alter table proposals add constraint proposals_capacity_check
    check (capacity is null or (capacity >= 1 and capacity <= 100000));

  alter table proposals drop constraint if exists proposals_participant_count_check;
  alter table proposals add constraint proposals_participant_count_check
    check (participant_count >= 0 and participant_count <= 100000);
end
$do$;
