# Security and compliance

This template handles **payments** and **personal identifiers** (Telegram chat ids). Treat it as **development-grade** until you add policies appropriate for your domain.

## Secrets

- Never commit `.env` or service keys.
- **Rotate** keys if they leak; Stripe and Supabase dashboards support rotation.
- On Vercel, use **project environment variables** (encrypted at rest); restrict team access.

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

Products such as **Moon Cue App** may fall under **health data** regulations depending on jurisdiction and what you store.

Minimum bar:

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
