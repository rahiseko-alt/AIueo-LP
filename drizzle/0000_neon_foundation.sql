create extension if not exists pgcrypto;

create table if not exists profiles (
  id text primary key,
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'pending_profile' check (status in ('pending_profile', 'active', 'suspended', 'withdrawn')),
  public_name text,
  collaboration_interest text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists terms_versions (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('terms', 'disclaimer', 'privacy')),
  version text not null,
  content_hash text not null,
  effective_at timestamptz not null default now(),
  is_current boolean not null default true,
  unique (document_type, version)
);

insert into terms_versions (document_type, version, content_hash)
values
  ('terms', 'draft-2026-08-31', 'static:terms-draft-2026-08-31'),
  ('disclaimer', 'draft-2026-08-31', 'static:disclaimer-draft-2026-08-31'),
  ('privacy', 'draft-2026-08-31', 'static:privacy-draft-2026-08-31')
on conflict (document_type, version) do nothing;

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  terms_version_id uuid not null references terms_versions(id),
  accepted_at timestamptz not null default now(),
  unique (user_id, terms_version_id)
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references profiles(id),
  slug text not null unique,
  title text not null,
  summary text not null,
  format text not null check (format in ('offline', 'online', 'hybrid')),
  tentative_starts_at timestamptz not null,
  recruitment_deadline_at timestamptz,
  public_expires_at timestamptz not null,
  organizer_name text not null,
  participation_method text not null,
  visibility text not null check (visibility in ('public', 'unlisted')),
  money_type text not null check (money_type in ('none', 'fixed_fee', 'range_or_upper_limit', 'reimbursement', 'reward', 'donation', 'undecided')),
  money_details jsonb not null default '{}'::jsonb,
  publishing_declarations jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'needs_revision', 'auto_hidden', 'hidden', 'ended', 'cancelled', 'expired')),
  event_status text not null default 'planning' check (event_status in ('planning', 'confirmed', 'full', 'completed', 'cancelled')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  actor_id text references profiles(id),
  reason_code text,
  reason_text text,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists proposal_messages (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  sender_id text not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  reporter_id text references profiles(id),
  category text not null,
  details text,
  resolved_at timestamptz,
  resolved_by text references profiles(id),
  resolution_reason text,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id text not null references profiles(id),
  proposal_id uuid references proposals(id) on delete cascade,
  kind text not null,
  body text not null,
  dedupe_key text unique,
  email_status text not null default 'pending' check (email_status in ('pending', 'sending', 'sent', 'failed')),
  email_attempts integer not null default 0,
  email_last_attempt_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null references profiles(id),
  target_type text not null,
  target_id text not null,
  action text not null,
  reason_code text not null,
  reason_text text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id text references profiles(id),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists proposals_public_idx on proposals (status, visibility, tentative_starts_at);
create index if not exists proposals_owner_idx on proposals (owner_id, updated_at desc);
create index if not exists notifications_recipient_idx on notifications (recipient_id, created_at desc);
create index if not exists proposal_messages_proposal_idx on proposal_messages (proposal_id, created_at);

create or replace function aiueo_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function aiueo_set_updated_at();
drop trigger if exists proposals_updated_at on proposals;
create trigger proposals_updated_at before update on proposals for each row execute function aiueo_set_updated_at();

create or replace function aiueo_prevent_audit_mutation() returns trigger language plpgsql as $$
begin raise exception 'audit_log is append-only'; end;
$$;
drop trigger if exists audit_log_immutable on audit_log;
create trigger audit_log_immutable before update or delete on audit_log for each row execute function aiueo_prevent_audit_mutation();
