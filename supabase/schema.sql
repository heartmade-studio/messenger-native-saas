-- Messenger-Native SaaS reference schema (Supabase / Postgres)
-- Run in Supabase SQL editor or via migrations tooling.

create extension if not exists "pgcrypto";

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  status text,
  telegram_chat_id bigint unique,
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_status_idx on public.subscriptions (status);

comment on table public.subscriptions is
  'Demo billing + messenger bridge. Production apps should enable RLS and narrow policies.';

-- Example RLS (optional; service role bypasses RLS — use only for server webhooks)
-- alter table public.subscriptions enable row level security;
