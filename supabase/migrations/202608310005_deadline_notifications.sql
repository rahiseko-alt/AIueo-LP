-- Deadline processing is idempotent. It only creates an outbox notification
-- or moves a published proposal out of the public list; email delivery is
-- performed by the authenticated Edge Function.

begin;

alter table public.notifications drop constraint if exists notifications_email_status_check;
alter table public.notifications add constraint notifications_email_status_check check (email_status in ('pending', 'sending', 'sent', 'failed', 'suppressed'));
alter table public.notifications add column email_attempts integer not null default 0;
alter table public.notifications add column email_last_attempt_at timestamptz;
alter table public.notifications add constraint notifications_email_attempts_check check (email_attempts >= 0 and email_attempts <= 10);

create or replace function public.process_proposal_deadlines()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  proposal_row public.proposals;
  processed_count integer := 0;
  dedupe text;
begin
  for proposal_row in
    select * from public.proposals
    where status = 'published'
      and public_expires_at is not null
      and public_expires_at <= now()
  loop
    update public.proposals set status = 'expired', version = version + 1 where id = proposal_row.id;
    insert into public.proposal_versions (proposal_id, version, snapshot, change_reason)
    values (proposal_row.id, proposal_row.version + 1, to_jsonb(proposal_row), 'public expiry');
    insert into public.audit_log (action, entity_type, entity_id, old_value, new_value)
    values ('cron.proposal_expired', 'proposal', proposal_row.id, jsonb_build_object('status', proposal_row.status), jsonb_build_object('status', 'expired'));
    dedupe := 'expiry:' || proposal_row.id::text || ':' || to_char(proposal_row.public_expires_at at time zone 'Asia/Tokyo', 'YYYY-MM-DD');
    insert into public.notifications (recipient_id, proposal_id, kind, body, dedupe_key)
    values (proposal_row.owner_id, proposal_row.id, 'proposal_auto_hidden', '公開期限を過ぎたため、企画を公開一覧から除外しました。', dedupe)
    on conflict (dedupe_key) do nothing;
    processed_count := processed_count + 1;
  end loop;

  for proposal_row in
    select * from public.proposals
    where status = 'published' and event_status <> 'confirmed' and tentative_starts_at is not null
      and tentative_starts_at > now() and tentative_starts_at <= now() + interval '3 days'
  loop
    update public.proposals set status = 'auto_hidden', auto_hidden_at = now(), version = version + 1 where id = proposal_row.id;
    insert into public.proposal_versions (proposal_id, version, snapshot, change_reason)
    values (proposal_row.id, proposal_row.version + 1, to_jsonb(proposal_row), 'not confirmed three days before candidate date');
    insert into public.audit_log (action, entity_type, entity_id, old_value, new_value)
    values ('cron.proposal_auto_hidden', 'proposal', proposal_row.id, jsonb_build_object('status', proposal_row.status), jsonb_build_object('status', 'auto_hidden'));
    dedupe := 'auto-hidden:' || proposal_row.id::text || ':' || to_char(proposal_row.tentative_starts_at at time zone 'Asia/Tokyo', 'YYYY-MM-DD');
    insert into public.notifications (recipient_id, proposal_id, kind, body, dedupe_key)
    values (proposal_row.owner_id, proposal_row.id, 'proposal_auto_hidden', '開催決定がないため、開催候補日の3日前に企画を公開一覧から除外しました。候補日時を更新して再掲載できます。', dedupe)
    on conflict (dedupe_key) do nothing;
    processed_count := processed_count + 1;
  end loop;

  for proposal_row in
    select * from public.proposals
    where status = 'published' and event_status <> 'confirmed' and tentative_starts_at is not null
      and tentative_starts_at > now() + interval '3 days' and tentative_starts_at <= now() + interval '7 days'
  loop
    dedupe := 'reminder:' || proposal_row.id::text || ':' || to_char(proposal_row.tentative_starts_at at time zone 'Asia/Tokyo', 'YYYY-MM-DD');
    insert into public.notifications (recipient_id, proposal_id, kind, body, dedupe_key)
    values (proposal_row.owner_id, proposal_row.id, 'proposal_confirmation_reminder', '開催候補日の1週間前です。開催決定になっていないため、内容を確認してください。', dedupe)
    on conflict (dedupe_key) do nothing;
    processed_count := processed_count + 1;
  end loop;
  return processed_count;
end;
$$;

revoke all on function public.process_proposal_deadlines() from public, anon, authenticated;
grant execute on function public.process_proposal_deadlines() to service_role;

commit;
