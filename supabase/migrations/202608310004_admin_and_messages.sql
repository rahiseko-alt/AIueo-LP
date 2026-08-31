-- Administrative actions, proposal messaging, and public reports.
-- Every write derives the actor from auth.uid() and records an audit event.

begin;

create or replace function private.current_admin_profile()
returns public.profiles
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result public.profiles;
begin
  select * into result from public.profiles where id = auth.uid() and role = 'admin' and status = 'active';
  if not found then raise exception 'admin access required' using errcode = '42501'; end if;
  return result;
end;
$$;

create or replace function public.admin_set_proposal_state(
  p_proposal_id uuid,
  p_status public.proposal_status,
  p_reason_code text,
  p_reason_text text
)
returns public.proposal_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles := private.current_admin_profile();
  proposal_row public.proposals;
  reason_code_clean text := nullif(trim(p_reason_code), '');
  reason_text_clean text := nullif(trim(p_reason_text), '');
begin
  if reason_code_clean is null or reason_text_clean is null then raise exception 'reason is required' using errcode = '22023'; end if;
  select * into proposal_row from public.proposals where id = p_proposal_id for update;
  if not found then raise exception 'proposal not found' using errcode = 'P0002'; end if;
  update public.proposals set status = p_status, auto_hidden_at = case when p_status = 'auto_hidden' then now() else auto_hidden_at end, version = version + 1 where id = p_proposal_id;
  insert into public.proposal_versions (proposal_id, version, snapshot, change_reason, changed_by)
  values (p_proposal_id, proposal_row.version + 1, to_jsonb(proposal_row), reason_code_clean || ': ' || reason_text_clean, actor.id);
  insert into public.moderation_actions (proposal_id, action, reason_code, reason_text, performed_by)
  values (p_proposal_id, 'set_status:' || p_status::text, reason_code_clean, reason_text_clean, actor.id);
  insert into public.notifications (recipient_id, proposal_id, kind, body)
  values (proposal_row.owner_id, p_proposal_id, 'moderation_action', '管理者が企画の掲載状態を変更しました。理由: ' || reason_text_clean);
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, reason_code, old_value, new_value)
  values (actor.id, actor.role, 'admin.proposal_state', 'proposal', p_proposal_id, reason_code_clean,
          jsonb_build_object('status', proposal_row.status), jsonb_build_object('status', p_status));
  return p_status;
end;
$$;

create or replace function public.admin_update_proposal(
  p_proposal_id uuid,
  p_payload jsonb,
  p_reason_code text,
  p_reason_text text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles := private.current_admin_profile();
  proposal_row public.proposals;
  snapshot jsonb := private.proposal_payload_snapshot(p_payload);
  next_version integer;
  reason_code_clean text := nullif(trim(p_reason_code), '');
  reason_text_clean text := nullif(trim(p_reason_text), '');
begin
  if reason_code_clean is null or reason_text_clean is null then raise exception 'reason is required' using errcode = '22023'; end if;
  select * into proposal_row from public.proposals where id = p_proposal_id for update;
  if not found then raise exception 'proposal not found' using errcode = 'P0002'; end if;
  next_version := proposal_row.version + 1;
  update public.proposals set
    title = snapshot->>'title', summary = snapshot->>'summary', format = snapshot->>'format',
    tentative_starts_at = nullif(snapshot->>'tentative_starts_at', '')::timestamptz,
    recruitment_deadline_at = nullif(snapshot->>'recruitment_deadline_at', '')::timestamptz,
    public_expires_at = nullif(snapshot->>'public_expires_at', '')::timestamptz,
    organizer_name = snapshot->>'organizer_name', participation_method = snapshot->>'participation_method',
    visibility = snapshot->>'visibility', money_type = (snapshot->>'money_type')::public.money_type,
    money_details = snapshot->'money_details', publishing_declarations = snapshot->'publishing_declarations',
    version = next_version
  where id = p_proposal_id;
  insert into public.proposal_versions (proposal_id, version, snapshot, change_reason, changed_by)
  values (p_proposal_id, next_version, snapshot, reason_code_clean || ': ' || reason_text_clean, actor.id);
  insert into public.moderation_actions (proposal_id, action, reason_code, reason_text, performed_by)
  values (p_proposal_id, 'edit', reason_code_clean, reason_text_clean, actor.id);
  insert into public.notifications (recipient_id, proposal_id, kind, body)
  values (proposal_row.owner_id, p_proposal_id, 'proposal_changed', '管理者が企画内容を変更しました。理由: ' || reason_text_clean);
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, reason_code, old_value, new_value)
  values (actor.id, actor.role, 'admin.proposal_edit', 'proposal', p_proposal_id, reason_code_clean, to_jsonb(proposal_row), snapshot);
  return p_proposal_id;
end;
$$;

create or replace function public.admin_set_member_status(
  p_user_id uuid,
  p_status public.member_status,
  p_reason_code text,
  p_reason_text text
)
returns public.member_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles := private.current_admin_profile();
  target public.profiles;
  reason_code_clean text := nullif(trim(p_reason_code), '');
  reason_text_clean text := nullif(trim(p_reason_text), '');
begin
  if p_user_id = actor.id then raise exception 'admin cannot change own status' using errcode = '42501'; end if;
  if reason_code_clean is null or reason_text_clean is null then raise exception 'reason is required' using errcode = '22023'; end if;
  select * into target from public.profiles where id = p_user_id for update;
  if not found then raise exception 'member not found' using errcode = 'P0002'; end if;
  update public.profiles set status = p_status, suspended_reason = case when p_status = 'suspended' then reason_text_clean else suspended_reason end, suspended_at = case when p_status = 'suspended' then now() else suspended_at end, withdrawn_at = case when p_status = 'withdrawn' then now() else withdrawn_at end where id = p_user_id;
  insert into public.moderation_actions (subject_user_id, action, reason_code, reason_text, performed_by)
  values (p_user_id, 'member_status:' || p_status::text, reason_code_clean, reason_text_clean, actor.id);
  insert into public.notifications (recipient_id, kind, body)
  values (p_user_id, 'moderation_action', '会員状態が変更されました。理由: ' || reason_text_clean);
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, reason_code, old_value, new_value)
  values (actor.id, actor.role, 'admin.member_status', 'profile', p_user_id, reason_code_clean, jsonb_build_object('status', target.status), jsonb_build_object('status', p_status));
  return p_status;
end;
$$;

create or replace function public.send_proposal_message(p_proposal_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  proposal_row public.proposals;
  recipient_id uuid;
  message_id uuid;
  clean_body text := nullif(trim(p_body), '');
begin
  select * into actor from public.profiles where id = auth.uid();
  if not found or actor.status = 'withdrawn' then raise exception 'signed-in member required' using errcode = '42501'; end if;
  if clean_body is null or char_length(clean_body) > 5000 then raise exception 'message must be 1-5000 characters' using errcode = '22023'; end if;
  select * into proposal_row from public.proposals where id = p_proposal_id;
  if not found or (proposal_row.owner_id <> actor.id and not (actor.role = 'admin' and actor.status = 'active')) then raise exception 'message access denied' using errcode = '42501'; end if;
  if actor.role = 'admin' then select owner_id into recipient_id from public.proposals where id = p_proposal_id; else select id into recipient_id from public.profiles where role = 'admin' and status = 'active' order by created_at limit 1; end if;
  insert into public.proposal_messages (proposal_id, sender_id, body) values (p_proposal_id, actor.id, clean_body) returning id into message_id;
  if recipient_id is not null then insert into public.notifications (recipient_id, proposal_id, kind, body) values (recipient_id, p_proposal_id, 'message_received', '企画スレッドに新しいメッセージがあります。'); end if;
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id) values (actor.id, actor.role, 'proposal.message', 'proposal_message', message_id);
  return message_id;
end;
$$;

create or replace function public.create_report(p_proposal_id uuid, p_category text, p_details text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare report_id uuid; reporter uuid := auth.uid(); clean_category text := nullif(trim(p_category), ''); clean_details text := nullif(trim(p_details), '');
begin
  if clean_category is null or clean_details is null then raise exception 'report category and details are required' using errcode = '22023'; end if;
  if not exists (select 1 from public.proposals where id = p_proposal_id and status = 'published' and visibility = 'public') then raise exception 'public proposal not found' using errcode = 'P0002'; end if;
  insert into public.reports (proposal_id, category, details, reporter_id) values (p_proposal_id, clean_category, clean_details, reporter) returning id into report_id;
  return report_id;
end;
$$;

create or replace function public.admin_resolve_report(p_report_id uuid, p_reason_code text, p_reason_text text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles := private.current_admin_profile();
  report_row public.reports;
begin
  if nullif(trim(p_reason_code), '') is null or nullif(trim(p_reason_text), '') is null then raise exception 'reason is required' using errcode = '22023'; end if;
  select * into report_row from public.reports where id = p_report_id for update;
  if not found then raise exception 'report not found' using errcode = 'P0002'; end if;
  update public.reports set resolved_at = now(), resolved_by = actor.id where id = p_report_id;
  insert into public.moderation_actions (proposal_id, action, reason_code, reason_text, performed_by) values (report_row.proposal_id, 'report_resolved', trim(p_reason_code), trim(p_reason_text), actor.id);
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, reason_code) values (actor.id, actor.role, 'admin.report_resolve', 'report', p_report_id, trim(p_reason_code));
  return p_report_id;
end;
$$;

revoke all on function public.admin_set_proposal_state(uuid, public.proposal_status, text, text), public.admin_update_proposal(uuid, jsonb, text, text), public.admin_set_member_status(uuid, public.member_status, text, text), public.send_proposal_message(uuid, text), public.admin_resolve_report(uuid, text, text) from public, anon;
grant execute on function public.admin_set_proposal_state(uuid, public.proposal_status, text, text), public.admin_update_proposal(uuid, jsonb, text, text), public.admin_set_member_status(uuid, public.member_status, text, text), public.send_proposal_message(uuid, text), public.admin_resolve_report(uuid, text, text) to authenticated;
revoke all on function public.create_report(uuid, text, text) from public;
grant execute on function public.create_report(uuid, text, text) to anon, authenticated;

commit;
