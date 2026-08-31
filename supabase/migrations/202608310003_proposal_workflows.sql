-- Owner-only proposal workflows. All writes derive owner/actor from auth.uid().
-- No browser role has direct INSERT/UPDATE access to proposal tables.

begin;

create or replace function private.current_active_profile()
returns public.profiles
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result public.profiles;
begin
  select * into result from public.profiles
  where id = auth.uid() and status = 'active';
  if not found then raise exception 'active member required' using errcode = '42501'; end if;
  return result;
end;
$$;

create or replace function private.proposal_payload_snapshot(p_payload jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'title', trim(coalesce(p_payload->>'title', '')),
    'summary', trim(coalesce(p_payload->>'summary', '')),
    'format', trim(coalesce(p_payload->>'format', '')),
    'tentative_starts_at', nullif(p_payload->>'tentative_starts_at', ''),
    'recruitment_deadline_at', nullif(p_payload->>'recruitment_deadline_at', ''),
    'public_expires_at', nullif(p_payload->>'public_expires_at', ''),
    'organizer_name', trim(coalesce(p_payload->>'organizer_name', '')),
    'participation_method', trim(coalesce(p_payload->>'participation_method', '')),
    'visibility', coalesce(p_payload->>'visibility', 'public'),
    'money_type', coalesce(p_payload->>'money_type', 'undecided'),
    'money_details', coalesce(p_payload->'money_details', '{}'::jsonb),
    'publishing_declarations', coalesce(p_payload->'publishing_declarations', '{}'::jsonb)
  );
$$;

create or replace function public.save_proposal(p_proposal_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles := private.current_active_profile();
  existing public.proposals;
  proposal_id uuid;
  proposal_version integer;
  snapshot jsonb := private.proposal_payload_snapshot(p_payload);
  slug_value text := lower(trim(coalesce(p_payload->>'slug', '')));
begin
  if slug_value !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid proposal slug' using errcode = '22023';
  end if;

  if p_proposal_id is null then
    insert into public.proposals (
      owner_id, slug, title, summary, format, tentative_starts_at,
      recruitment_deadline_at, public_expires_at, organizer_name,
      participation_method, visibility, money_type, money_details,
      publishing_declarations
    ) values (
      actor.id, slug_value, snapshot->>'title', snapshot->>'summary', snapshot->>'format',
      nullif(snapshot->>'tentative_starts_at', '')::timestamptz,
      nullif(snapshot->>'recruitment_deadline_at', '')::timestamptz,
      nullif(snapshot->>'public_expires_at', '')::timestamptz,
      snapshot->>'organizer_name', snapshot->>'participation_method',
      snapshot->>'visibility', (snapshot->>'money_type')::public.money_type,
      snapshot->'money_details', snapshot->'publishing_declarations'
    ) returning id, version into proposal_id, proposal_version;
  else
    select * into existing from public.proposals
    where id = p_proposal_id and owner_id = actor.id for update;
    if not found then raise exception 'proposal not found' using errcode = 'P0002'; end if;
    if existing.status in ('hidden', 'ended', 'cancelled') then
      raise exception 'proposal cannot be edited in its current state' using errcode = '42501';
    end if;
    update public.proposals set
      title = snapshot->>'title', summary = snapshot->>'summary', format = snapshot->>'format',
      tentative_starts_at = nullif(snapshot->>'tentative_starts_at', '')::timestamptz,
      recruitment_deadline_at = nullif(snapshot->>'recruitment_deadline_at', '')::timestamptz,
      public_expires_at = nullif(snapshot->>'public_expires_at', '')::timestamptz,
      organizer_name = snapshot->>'organizer_name', participation_method = snapshot->>'participation_method',
      visibility = snapshot->>'visibility', money_type = (snapshot->>'money_type')::public.money_type,
      money_details = snapshot->'money_details', publishing_declarations = snapshot->'publishing_declarations',
      version = existing.version + 1
    where id = existing.id
    returning id, version into proposal_id, proposal_version;
  end if;

  insert into public.proposal_versions (proposal_id, version, snapshot, changed_by)
  values (proposal_id, proposal_version, snapshot, actor.id);
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, old_value, new_value)
  values (actor.id, actor.role, 'proposal.save', 'proposal', proposal_id,
          case when p_proposal_id is null then null else to_jsonb(existing) end, snapshot);
  return proposal_id;
end;
$$;

create or replace function public.publish_proposal(p_proposal_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles := private.current_active_profile();
  proposal_row public.proposals;
  next_version integer;
begin
  select * into proposal_row from public.proposals
  where id = p_proposal_id and owner_id = actor.id for update;
  if not found then raise exception 'proposal not found' using errcode = 'P0002'; end if;
  if proposal_row.status in ('hidden', 'ended', 'cancelled') then raise exception 'proposal cannot be published' using errcode = '42501'; end if;
  if proposal_row.tentative_starts_at is null then raise exception 'tentative start is required for publishing' using errcode = '23514'; end if;
  if proposal_row.public_expires_at is null or proposal_row.public_expires_at <= now() then raise exception 'future public expiry is required' using errcode = '23514'; end if;
  if proposal_row.money_type = 'undecided' then raise exception 'money terms must be decided' using errcode = '23514'; end if;
  if coalesce((proposal_row.publishing_declarations->>'prohibited_confirmed')::boolean, false) is not true
     or coalesce((proposal_row.publishing_declarations->>'rights_confirmed')::boolean, false) is not true
     or coalesce((proposal_row.publishing_declarations->>'money_confirmed')::boolean, false) is not true then
    raise exception 'publishing declarations are required' using errcode = '23514';
  end if;
  next_version := proposal_row.version + 1;
  update public.proposals set status = 'published', published_at = coalesce(published_at, now()), version = next_version where id = p_proposal_id;
  insert into public.proposal_versions (proposal_id, version, snapshot, change_reason, changed_by)
  values (p_proposal_id, next_version, to_jsonb(proposal_row), 'published', actor.id);
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, old_value, new_value)
  values (actor.id, actor.role, 'proposal.publish', 'proposal', p_proposal_id,
          jsonb_build_object('status', proposal_row.status), jsonb_build_object('status', 'published'));
  return p_proposal_id;
end;
$$;

create or replace function public.set_proposal_event_status(p_proposal_id uuid, p_event_status public.event_status)
returns public.proposal_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles := private.current_active_profile();
  proposal_row public.proposals;
  next_status public.proposal_status;
begin
  select * into proposal_row from public.proposals where id = p_proposal_id and owner_id = actor.id for update;
  if not found then raise exception 'proposal not found' using errcode = 'P0002'; end if;
  if proposal_row.status in ('hidden', 'ended', 'cancelled', 'expired') and p_event_status <> 'cancelled' then
    raise exception 'proposal cannot change event status' using errcode = '42501';
  end if;
  next_status := case when p_event_status = 'cancelled' then 'cancelled'::public.proposal_status when p_event_status = 'completed' then 'ended'::public.proposal_status else proposal_row.status end;
  update public.proposals set event_status = p_event_status, status = next_status, version = version + 1 where id = p_proposal_id;
  insert into public.proposal_versions (proposal_id, version, snapshot, change_reason, changed_by)
  values (p_proposal_id, proposal_row.version + 1, to_jsonb(proposal_row), 'event status: ' || p_event_status::text, actor.id);
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, old_value, new_value)
  values (actor.id, actor.role, 'proposal.event_status', 'proposal', p_proposal_id,
          jsonb_build_object('event_status', proposal_row.event_status, 'status', proposal_row.status),
          jsonb_build_object('event_status', p_event_status, 'status', next_status));
  return next_status;
end;
$$;

revoke all on function public.save_proposal(uuid, jsonb), public.publish_proposal(uuid), public.set_proposal_event_status(uuid, public.event_status) from public, anon;
grant execute on function public.save_proposal(uuid, jsonb), public.publish_proposal(uuid), public.set_proposal_event_status(uuid, public.event_status) to authenticated;

commit;
