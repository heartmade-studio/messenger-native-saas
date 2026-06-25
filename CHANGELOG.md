# Changelog

All notable changes to this starter kit are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-25

First runnable release. The repository turns from a documentation blueprint into
a fork-and-run starter kit.

### Added

- `telegram-webhook` Supabase Edge Function (Deno): webhook authentication via
  the Telegram secret token, a command dispatcher (`/start`, `/help`, `/status`,
  `/upgrade`), and a pure four-step onboarding state machine that activates a
  14-day trial.
- Postgres schema migration: `users` and `events` tables, an `updated_at`
  trigger, Row Level Security, and `service_role` grants.
- Shared adapters under `supabase/functions/_shared/`:
  - AI (`ai.ts`): Gemini composer with a deterministic stub fallback.
  - Billing (`billing.ts`): Stripe checkout link + a webhook handling skeleton
    (signature verification + event→status mapping).
  - Analytics (`analytics.ts`): PostHog event tracking and Sentry error
    reporting — both optional and no-op without env.
  - Repository (`repository.ts`, `supabase-repository.ts`): a `UserRepository`
    interface with in-memory and Postgres implementations.
- `stripe-webhook` Edge Function skeleton.
- Deno tests for the onboarding state machine, the dispatcher, and graceful
  degradation of optional integrations.
- A dependency-free smoke test (`scripts/smoke-test.ts`) and a webhook
  registration helper (`scripts/set-webhook.sh`).
- GitHub Actions CI: `deno fmt`, `deno lint`, `deno check`, `deno test`, smoke.
- `.env.example` documenting every variable the code reads (REQUIRED vs OPTIONAL).
- Rewritten README with the method definition, named principles, a comparison
  table, when-to-use guidance, and a Quick start whose steps map 1:1 to files.

[1.0.0]: https://github.com/heartmade-studio/messenger-native-saas/releases/tag/v1.0.0
