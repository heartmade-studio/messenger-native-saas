# Architecture — Messenger-Native SaaS

This technical document describes the **reference flow and Edge-first architecture**.

## Main system components (tech stack)

| Layer | Technology & role |
| ----- | ---------------- |
| **UX & interface** | **Telegram** — Primary user interface. This is where the four-step “Onboarding-First Flow” runs. |
| **Data & state** | **Supabase (PostgreSQL)** — Auth via `chat_id`, user profiles, and subscription assignment. |
| **Logic (compute)** | **Supabase Edge Functions (Deno)** — Fast, serverless handlers for Telegram traffic (webhooks) and cron jobs (dispatcher). |
| **AI engine** | **Gemini API** — Called from Edge Functions to compose personalized content and assist the user. |
| **Payments** | **Stripe** — Trial period (14 days) and recurring billing (Checkout + webhooks). |
| **Observability** | **PostHog & Sentry** — Event analytics (PostHog) for the bot funnel and error tracking (Sentry) for Deno. |

## Sequence — Onboarding-first flow

The user does not create an account in the traditional way. Authorization and record creation happen seamlessly during the conversation.

```mermaid
sequenceDiagram
  participant U as User (Telegram)
  participant T as Telegram API
  participant EF as Edge Function (Deno)
  participant AI as Gemini API
  participant DB as Supabase DB

  U->>T: /start
  T->>EF: Webhook update (JSON)
  EF->>DB: Create empty profile with telegram_chat_id
  EF->>T: Onboarding question 1 of 4
  U->>T: User reply
  T->>EF: Webhook update (JSON)
  EF->>AI: (Optional) Intent classification with Gemini
  EF->>DB: Save preferences
  EF->>T: Confirmation and 14-day trial activation
```

*Documentation **v1.4** — same MAJOR.MINOR rules as the footer in `README.md`.*
