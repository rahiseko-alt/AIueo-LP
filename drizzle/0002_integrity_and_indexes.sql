-- 監査の保全と、実クエリに対して欠けているインデックス。
--
-- 適用順の注意: このファイルは本番Neonへ適用してからマージすること。
-- ここで追加するのはインデックスとトリガのみで、アプリのコードはどれにも
-- 依存していない。適用が遅れてもエンドポイントは例外にならない。

-- 1. 措置記録を追記専用にする。
--
-- audit_log には既に同じトリガがあるが、moderation_actions には無かった。
-- 措置記録（誰が・なぜ・何を停止したか）は audit_log と同じ重みを持つので、
-- 後から書き換え・削除できてはならない。
-- 例外文言はテーブル名を含める。audit_log 専用の文言のままだと、
-- moderation_actions で弾かれたときに原因を取り違える。
create or replace function aiueo_prevent_audit_mutation() returns trigger language plpgsql as $$
begin raise exception '% is append-only', tg_table_name; end;
$$;

drop trigger if exists moderation_actions_immutable on moderation_actions;
create trigger moderation_actions_immutable
  before update or delete on moderation_actions
  for each row execute function aiueo_prevent_audit_mutation();

-- 2. 「現行の規約は文書種別ごとに1つ」をDBで保証する。
--
-- src/app/member/profile/actions.ts は is_current = true の3行が揃っている
-- ことを前提に同意を保存する。新しい版を入れるときに旧版の is_current を
-- 落とし忘れると、その前提が静かに崩れて登録が通らなくなる。
--
-- 適用前の確認: 既に種別ごとに2行以上 is_current = true がある場合、この
-- インデックス作成は失敗する。その場合は先にデータを直すこと。
create unique index if not exists terms_versions_current_unique
  on terms_versions (document_type)
  where is_current;

-- 3. 実際に走っているクエリに対して欠けているインデックス。

-- 管理画面トップの未処理通報カウントと、通報一覧の並び替え。
-- reports にはこれまでインデックスが1本も無く、毎回全走査していた。
create index if not exists reports_unresolved_idx on reports (created_at desc) where resolved_at is null;
create index if not exists reports_created_idx on reports (created_at desc);
create index if not exists reports_proposal_idx on reports (proposal_id);

-- 期限処理（cron）が毎日引く2本。既存の proposals_public_idx は
-- (status, visibility, tentative_starts_at) なので、visibility を条件に
-- 持たないこれらのクエリでは使われず、毎回全走査になる。
create index if not exists proposals_expiry_idx
  on proposals (public_expires_at)
  where status = 'published';
create index if not exists proposals_unconfirmed_idx
  on proposals (tentative_starts_at)
  where status = 'published' and event_status <> 'confirmed';

-- 企画者からのメッセージ通知先を引くときに使う。
create index if not exists profiles_admin_idx on profiles (role, status);

-- 通知outboxの送信待ちを拾うとき。
create index if not exists notifications_pending_idx
  on notifications (created_at)
  where email_status = 'pending';

-- CASCADE 削除と親からの参照で使う外部キー列。
create index if not exists proposal_versions_proposal_idx on proposal_versions (proposal_id, created_at desc);
create index if not exists notifications_proposal_idx on notifications (proposal_id);
create index if not exists consents_terms_version_idx on consents (terms_version_id);

-- 追記専用テーブルは肥大化する側なので、実際にたどる順で引けるようにする。
create index if not exists audit_log_entity_idx on audit_log (entity_type, entity_id, created_at desc);
create index if not exists moderation_actions_target_idx on moderation_actions (target_type, target_id, created_at desc);
