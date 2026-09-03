-- Atomic member profile completion. This migration depends on 202608310001.
-- The browser never supplies role/status/consent timestamps; the function
-- derives the actor and current document versions from the database.

begin;

create or replace function public.complete_member_profile(
  p_public_name text,
  p_collaboration_interest text,
  p_age_confirmed boolean,
  p_terms_version_ids uuid[]
)
returns public.member_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_role public.aiueo_role;
  current_status public.member_status;
  current_document_count integer;
  supplied_document_count integer;
  matched_document_count integer;
  clean_name text := nullif(trim(coalesce(p_public_name, '')), '');
  clean_interest text := nullif(trim(coalesce(p_collaboration_interest, '')), '');
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from auth.users
    where id = current_user_id and email_confirmed_at is not null
  ) then
    raise exception 'confirmed email required' using errcode = '42501';
  end if;

  if clean_name is null or char_length(clean_name) > 80 then
    raise exception 'public name is required and must be 80 characters or fewer' using errcode = '22023';
  end if;
  if clean_interest is null or char_length(clean_interest) > 500 then
    raise exception 'collaboration interest is required and must be 500 characters or fewer' using errcode = '22023';
  end if;
  if p_age_confirmed is not true then
    raise exception 'age confirmation is required' using errcode = '22023';
  end if;

  select role, status into current_role, current_status
  from public.profiles where id = current_user_id for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if current_status in ('suspended', 'withdrawn') then
    raise exception 'member is not eligible for activation' using errcode = '42501';
  end if;

  select count(*)::integer into current_document_count
  from public.terms_versions where is_current;
  supplied_document_count := coalesce(cardinality(p_terms_version_ids), 0);
  select count(*)::integer into matched_document_count
  from public.terms_versions
  where is_current and id = any(coalesce(p_terms_version_ids, '{}'::uuid[]));

  if current_document_count = 0
     or supplied_document_count <> current_document_count
     or matched_document_count <> current_document_count then
    raise exception 'all current terms documents must be accepted' using errcode = '23514';
  end if;

  insert into public.consents (user_id, terms_version_id)
  select current_user_id, id
  from public.terms_versions
  where is_current
  on conflict (user_id, terms_version_id) do nothing;

  update public.profiles
  set public_name = clean_name,
      collaboration_interest = clean_interest,
      age_confirmed_at = coalesce(age_confirmed_at, now()),
      status = 'active',
      updated_at = now()
  where id = current_user_id;

  insert into public.audit_log (
    actor_id, actor_role, action, entity_type, entity_id,
    old_value, new_value, terms_version
  ) values (
    current_user_id, current_role, 'member.activate', 'profile', current_user_id,
    jsonb_build_object('status', current_status),
    jsonb_build_object('status', 'active'),
    (select string_agg(version, ',' order by document_type) from public.terms_versions where is_current)
  );

  return 'active'::public.member_status;
end;
$$;

revoke all on function public.complete_member_profile(text, text, boolean, uuid[]) from public, anon;
grant execute on function public.complete_member_profile(text, text, boolean, uuid[]) to authenticated;

commit;
