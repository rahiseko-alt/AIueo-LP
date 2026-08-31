-- AIueo membership, proposal, moderation, and audit foundation.
-- This migration is intentionally committed but NOT applied until the existing
-- Supabase project and data have been inspected and backed up.

begin;

create extension if not exists pgcrypto;

create type public.aiueo_role as enum ('member', 'admin');
create type public.member_status as enum ('pending_profile', 'active', 'suspended', 'withdrawn');
create type public.proposal_status as enum (
  'draft',
  'submitted',
  'published',
  'needs_revision',
  'auto_hidden',
  'hidden',
  'ended',
  'cancelled',
  'expired'
);
create type public.event_status as enum ('planning', 'confirmed', 'full', 'cancelled', 'completed');
create type public.money_type as enum (
  'none',
  'fixed_fee',
  'range_or_upper_limit',
  'reimbursement',
  'reward',
  'donation',
  'undecided'
);
create type public.term_document_type as enum ('terms', 'disclaimer', 'privacy');
create type public.notification_kind as enum (
  'message_received',
  'proposal_changed',
  'proposal_auto_hidden',
  'proposal_confirmation_reminder',
  'moderation_action'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.aiueo_role not null default 'member',
  status public.member_status not null default 'pending_profile',
  public_name text,
  collaboration_interest text,
  age_confirmed_at timestamptz,
  suspended_reason text,
  suspended_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_public_name_length check (public_name is null or char_length(trim(public_name)) between 1 and 80),
  constraint profiles_collaboration_interest_length check (
    collaboration_interest is null or char_length(trim(collaboration_interest)) <= 500
  )
);

create table public.terms_versions (
  id uuid primary key default gen_random_uuid(),
  document_type public.term_document_type not null,
  version text not null,
  content_hash text not null,
  effective_at timestamptz not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (document_type, version)
);

create unique index terms_versions_one_current_per_document
  on public.terms_versions (document_type)
  where is_current;

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  terms_version_id uuid not null references public.terms_versions(id) on delete restrict,
  consented_at timestamptz not null default now(),
  unique (user_id, terms_version_id)
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  slug text not null unique,
  status public.proposal_status not null default 'draft',
  event_status public.event_status not null default 'planning',
  title text not null,
  summary text not null,
  format text not null,
  tentative_starts_at timestamptz,
  recruitment_deadline_at timestamptz,
  public_expires_at timestamptz,
  organizer_name text not null,
  participation_method text not null,
  visibility text not null default 'public' check (visibility in ('public', 'unlisted')),
  money_type public.money_type not null default 'undecided',
  money_details jsonb not null default '{}'::jsonb,
  publishing_declarations jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  auto_hidden_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposals_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint proposals_title_length check (char_length(trim(title)) between 1 and 140),
  constraint proposals_summary_length check (char_length(trim(summary)) between 1 and 5000),
  constraint proposals_format_length check (char_length(trim(format)) between 1 and 120),
  constraint proposals_organizer_length check (char_length(trim(organizer_name)) between 1 and 120),
  constraint proposals_participation_method_length check (char_length(trim(participation_method)) between 1 and 2000)
);

create index proposals_owner_status_idx on public.proposals (owner_id, status);
create index proposals_public_index on public.proposals (status, visibility, tentative_starts_at);

create table public.proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete restrict,
  version integer not null,
  snapshot jsonb not null,
  change_reason text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now(),
  unique (proposal_id, version)
);

create table public.proposal_messages (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete restrict,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  constraint proposal_messages_body_length check (char_length(trim(body)) between 1 and 5000)
);

create index proposal_messages_proposal_created_idx on public.proposal_messages (proposal_id, created_at);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete restrict,
  category text not null,
  details text not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  constraint reports_category_length check (char_length(trim(category)) between 1 and 80),
  constraint reports_details_length check (char_length(trim(details)) between 1 and 3000)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete set null,
  kind public.notification_kind not null,
  body text not null,
  dedupe_key text unique,
  read_at timestamptz,
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed', 'suppressed')),
  created_at timestamptz not null default now()
);

create index notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.proposals(id) on delete set null,
  subject_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  reason_code text not null,
  reason_text text not null,
  performed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint moderation_actions_action_length check (char_length(trim(action)) between 1 and 80),
  constraint moderation_actions_reason_code_length check (char_length(trim(reason_code)) between 1 and 80),
  constraint moderation_actions_reason_text_length check (char_length(trim(reason_text)) between 1 and 2000)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.aiueo_role,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  reason_code text,
  old_value jsonb,
  new_value jsonb,
  terms_version text,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  constraint audit_log_action_length check (char_length(trim(action)) between 1 and 120),
  constraint audit_log_entity_type_length check (char_length(trim(entity_type)) between 1 and 80)
);

-- Application-facing writes are deliberately not granted in this foundation.
-- P4+ must use narrow RPCs that derive the actor from auth.uid(), enforce the
-- allowed state transition and append an audit record in the same transaction.
-- The service role is reserved for scheduled maintenance only.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger proposals_set_updated_at
before update on public.proposals
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, public_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_current_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

revoke all on function public.is_current_admin() from public;
grant execute on function public.is_current_admin() to anon, authenticated;

create or replace function private.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

create trigger audit_log_is_append_only
before update or delete on public.audit_log
for each row execute function private.prevent_audit_log_mutation();

alter table public.profiles enable row level security;
alter table public.terms_versions enable row level security;
alter table public.consents enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_versions enable row level security;
alter table public.proposal_messages enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_log enable row level security;

revoke all on all tables in schema public from anon, authenticated;

grant select on public.terms_versions to anon, authenticated;
grant select, update (public_name, collaboration_interest) on public.profiles to authenticated;
grant select on public.consents to authenticated;
grant select on public.proposals, public.proposal_versions, public.proposal_messages, public.notifications, public.moderation_actions, public.audit_log to authenticated;
grant select (
  id,
  slug,
  title,
  summary,
  format,
  tentative_starts_at,
  recruitment_deadline_at,
  organizer_name,
  participation_method,
  visibility,
  money_type,
  published_at,
  updated_at
) on public.proposals to anon;

create policy "terms are publicly readable"
on public.terms_versions for select
using (true);

create policy "members read their own profile"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_current_admin());

create policy "members update their safe profile fields"
on public.profiles for update to authenticated
using (id = auth.uid() or public.is_current_admin())
with check (id = auth.uid() or public.is_current_admin());

create policy "members read their own consent history"
on public.consents for select to authenticated
using (user_id = auth.uid() or public.is_current_admin());

create policy "proposal owners and admins read private proposals"
on public.proposals for select to authenticated
using (owner_id = auth.uid() or public.is_current_admin());

create policy "anon readers see only published public proposals"
on public.proposals for select to anon
using (status = 'published' and visibility = 'public');

create policy "proposal owners and admins read versions"
on public.proposal_versions for select to authenticated
using (
  public.is_current_admin()
  or exists (select 1 from public.proposals p where p.id = proposal_id and p.owner_id = auth.uid())
);

create policy "proposal owners and admins read messages"
on public.proposal_messages for select to authenticated
using (
  public.is_current_admin()
  or exists (select 1 from public.proposals p where p.id = proposal_id and p.owner_id = auth.uid())
);

create policy "notification recipients and admins read notifications"
on public.notifications for select to authenticated
using (recipient_id = auth.uid() or public.is_current_admin());

create policy "admins read moderation actions"
on public.moderation_actions for select to authenticated
using (public.is_current_admin());

create policy "admins read audit logs"
on public.audit_log for select to authenticated
using (public.is_current_admin());

-- Public readers use this restricted view rather than the base proposal table.
create view public.public_proposals
with (security_invoker = true, security_barrier = true)
as
select
  id,
  slug,
  title,
  summary,
  format,
  tentative_starts_at,
  recruitment_deadline_at,
  organizer_name,
  participation_method,
  visibility,
  money_type,
  published_at,
  updated_at
from public.proposals
where status = 'published'
  and visibility = 'public';

revoke all on public.public_proposals from public;
grant select on public.public_proposals to anon, authenticated;

commit;
