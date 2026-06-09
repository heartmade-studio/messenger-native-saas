# Security and compliance

This template handles **payments** and **personal identifiers** (Telegram chat ids). Treat it as **development-grade** until you add policies appropriate for your domain.

## Secrets

- Never commit `.env` or service keys.
- **Rotate** keys if they leak; Stripe and Supabase dashboards support rotation.
- On your deployment platform, use **project environment variables** (encrypted at rest); restrict team access.

## Webhooks

### Stripe

- Verify every event with **`stripe-signature`** using `STRIPE_WEBHOOK_SECRET`.
- Prefer **idempotent** handlers: Stripe may retry delivery.

### Telegram

- When using `setWebhook` with `secret_token`, Telegram sends **`X-Telegram-Bot-Api-Secret-Token`**. This repo compares it to `TELEGRAM_WEBHOOK_SECRET`.
- Do not expose admin-only bot commands without authentication.

## Supabase

- The template uses the **service role** key **only on the server** to upsert subscription rows.
- For production:
  - Enable **Row Level Security** where appropriate.
  - Prefer **least privilege**: separate DB roles for bot vs admin tasks if complexity warrants it.
  - Avoid storing unnecessary PII in chat-accessible tables.

## Sensitive domains (e.g. health)

Products such as **MoonQ** may touch **health-adjacent data** depending on jurisdiction and what you store. MoonQ's posture is **data minimization by design**:

- The user enters a **label for his partner** (her first name or a nickname — his choice) plus **two cycle dates**. That is the entire partner-related footprint — no account, contact details, or symptom logs about her.
- **Consent-by-design:** onboarding includes an "ask her" script; the product is not covert.
- **Row Level Security on every table**, the **service-role key server-side only**, data hosted in the **EU region**.
- MoonQ is **informational, not medical advice**.

Minimum bar (any product in this model):

- Data minimization (store only what you need).
- Clear **privacy policy** and retention/deletion story.
- Secure transport (HTTPS everywhere), audit logs for admin actions.
- Legal review before launch in regulated markets.

This document is **not** legal advice.

## Operational checklist

- [ ] Stripe webhook endpoint locked to your domain
- [ ] Telegram webhook secret enabled
- [ ] Supabase backups / point-in-time recovery per plan
- [ ] Error monitoring (e.g. Sentry) on API routes
- [ ] Rate limiting / abuse controls if endpoints are public
