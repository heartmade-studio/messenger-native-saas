-- Messenger-Native SaaS starter — initial schema.
--
-- Two tables are enough for the v1 loop:
--   users  — one row per Telegram chat; holds lifecycle status, the trial clock,
--            and the onboarding answers (in a generic `preferences` JSONB blob).
--   events — append-only funnel log (onboarding_started, trial_activated, ...).
--            Keeping the funnel in Postgres means you can analyze retention with
--            plain SQL even before wiring up PostHog.

create extension if not exists "pgcrypto";

-- =========================================================================
-- users
-- =========================================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  status text not null default 'new'
    check (status in ('new', 'onboarding', 'trialing', 'active', 'cancelled')),
  trial_ends_at timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_status_idx on public.users (status);

-- =========================================================================
-- events (append-only audit / funnel log)
-- =========================================================================
create table if not exists public.events (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_user_id_idx on public.events (user_id);
create index if not exists events_type_idx on public.events (type);
create index if not exists events_created_at_idx on public.events (created_at desc);

-- =========================================================================
-- updated_at maintenance
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Row Level Security
-- =========================================================================
-- The bot talks to Postgres with the service-role key, which bypasses RLS.
-- We still enable RLS with no policies so that anon / authenticated roles are
-- denied by default — a safe baseline you extend when you add user-facing reads.
alter table public.users enable row level security;
alter table public.events enable row level security;
