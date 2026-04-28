# Architecture — Messenger-Native SaaS

This document describes the **reference** flow implemented in this repository. Swap **Telegram** for another messenger API when needed; the billing and data layers stay the same.

## High-level diagram

```mermaid
flowchart LR
  Visitor["Visitor"] --> LandingPage["Landing Page"]
  LandingPage --> CheckoutAPI["POST /api/checkout"]
  CheckoutAPI --> StripeCheckout["Stripe Checkout"]
  StripeCheckout --> StripeWebhook["POST /api/webhooks/stripe"]
  StripeWebhook --> VercelApi["Vercel Server"]
  VercelApi --> Supabase["Supabase Postgres"]
  TelegramUser["User in Telegram"] --> TelegramWebhook["POST /api/webhooks/telegram"]
  TelegramWebhook --> VercelApi
  VercelApi --> TelegramAPI["Telegram Bot API sendMessage"]
  TelegramAPI --> TelegramUser
```

## Components

| Layer | Role |
|-------|------|
| **Landing (Next.js)** | Marketing + CTA; collects optional `telegram_chat_id` so Stripe metadata can link billing to chat. |
| **Stripe** | Checkout Session (subscription mode), webhooks for lifecycle events. |
| **Vercel** | Hosts HTTP routes: checkout creation, Stripe webhook, Telegram webhook. |
| **Supabase** | Persists `subscriptions` (customer id, subscription id, status, `telegram_chat_id`). |
| **Telegram** | Primary UX: commands such as `/start` and `/status`, implemented via **getUpdates webhook** (not long polling in serverless). |

## Sequence — subscribe

```mermaid
sequenceDiagram
  participant U as User
  participant L as Landing
  participant S as Stripe
  participant W as StripeWebhook
  participant DB as Supabase

  U->>L: Enter telegram_chat_id optional
  L->>S: Checkout Session metadata telegram_chat_id
  U->>S: Pay test card
  S->>W: checkout.session.completed
  W->>DB: Upsert subscriptions row
```

## Sequence — bot command

```mermaid
sequenceDiagram
  participant U as User
  participant T as Telegram
  participant H as POST /api/webhooks/telegram
  participant DB as Supabase

  U->>T: /status
  T->>H: Update JSON
  H->>DB: Select by telegram_chat_id
  DB-->>H: Row
  H->>T: sendMessage summary
  T-->>U: Chat reply
```

## Environment boundaries

- **Public**: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL` (anon key is **not** required for this template’s server routes; the server uses the **service role** key only in trusted routes).
- **Secret**: Stripe keys, webhook secret, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, optional `TELEGRAM_WEBHOOK_SECRET`.

Never expose the **service role** key to the browser.

## Extending the pattern

- **Richer bot UX**: inline keyboards, Mini Apps (Telegram), structured flows per feature flag.
- **Account linking**: magic links, email verification, or OAuth if you add a web account center.
- **Multi-tenant**: separate Stripe customers per workspace; map `telegram_chat_id` → `workspace_id` in Supabase.

See [docs/security-and-compliance.md](docs/security-and-compliance.md) before handling regulated or sensitive data.
