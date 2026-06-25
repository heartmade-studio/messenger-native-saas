# Billing (Stripe) and AI (Gemini) — what's real, what's a TODO

The v1 starter keeps both Stripe and Gemini as **optional adapters**. The core
bot runs fully without either. This document explains exactly how far each one
goes in v1 and what you'd add for production.

## AI (Gemini) — `supabase/functions/_shared/ai.ts`

**What's real**

- An `AiComposer` interface with two implementations: `GeminiComposer` (REST call
  to the Generative Language API) and `StubComposer` (returns the input verbatim).
- `createAiComposer()` returns Gemini when `GEMINI_API_KEY` is set, otherwise the
  stub — so the bot works with no AI account.
- The composer only *rewrites* a deterministic base message. It never decides
  business logic, and it falls back to the base message on any error.

**TODO for production**

- A prompt/version strategy and content guardrails.
- Caching and rate-limit handling.
- Choosing the model deliberately (`GEMINI_MODEL`) and monitoring cost.
- Confining AI to paid tiers if you want to control spend (the MoonQ pattern).

## Billing (Stripe) — `supabase/functions/_shared/billing.ts` + `stripe-webhook/`

**What's real**

- `createCheckoutLink()` creates a Stripe Checkout session (subscription mode)
  and returns its URL. Inert (`billing_not_configured`) without
  `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID`.
- `interpretWebhookEvent()` — a pure mapping from Stripe event type to the user
  status it should produce.
- `verifyStripeSignature()` — HMAC-SHA256 verification of the `Stripe-Signature`
  header against the raw body.
- `stripe-webhook/index.ts` — a deployable function that verifies the signature,
  maps the event, and records the intent. Inert without `STRIPE_WEBHOOK_SECRET`.

**Intentionally NOT in v1**

- Provisioning products/prices (you create these in the Stripe dashboard and set
  `STRIPE_PRICE_ID`).
- The customer portal, proration, plan changes.
- Idempotency keys / replay protection on webhook delivery.
- Dunning on failed payments and grace periods.
- Reconciling `stripe_customer_id` and subscription ids back onto the user row
  (the schema would gain those columns).
- Looking the user up by internal id in the webhook (the v1 schema keys users by
  `telegram_id`; the skeleton records the event rather than mutating status).

## Setup pointers

1. Create a product + recurring price in Stripe; copy the price id into
   `STRIPE_PRICE_ID`.
2. Add a webhook endpoint pointing at your deployed `stripe-webhook` URL; copy
   the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Set `STRIPE_SECRET_KEY` (use a test key while developing).
4. For Gemini, create an API key at <https://ai.google.dev/> and set
   `GEMINI_API_KEY`.
