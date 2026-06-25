# Roadmap

The v1 starter deliberately ships a small, working core with optional adapters.
These are the natural next steps — most are self-contained and make good
contributions. Items marked **(good first issue)** are scoped for newcomers.

## Transport

- **WhatsApp transport (good first issue-ish).** Add a `whatsapp-webhook`
  function that reuses the same dispatcher + onboarding state machine behind a
  different `TelegramSender`-style adapter. The dispatcher is already
  transport-agnostic in spirit; extract a `MessageSender` interface.
- **Discord / Slack transport.** Same idea, different sender + update shape.

## AI

- **OpenAI adapter alongside Gemini (good first issue).** Add an
  `OpenAiComposer implements AiComposer` and let `createAiComposer()` pick a
  provider via an env var (e.g. `AI_PROVIDER=openai|gemini`). The interface and
  stub fallback already exist.
- **Streaming / retry policy** for the AI composer.

## Billing

- **Complete the Stripe flow.** v1 ships a checkout link + a webhook skeleton.
  Flesh out: idempotency/replay protection, the customer portal, dunning on
  failed payments, and reconciling `stripe_customer_id` back to users. See
  [docs/billing-and-ai.md](docs/billing-and-ai.md).

## Product loop

- **Scheduled dispatcher.** A `pg_cron` tick + a `dispatcher` function that sends
  the daily message to users whose local hour matches — the natural companion to
  the onboarding flow.
- **Inline keyboards (good first issue).** Offer onboarding choices as buttons
  (callback queries) in addition to numbered text replies.
- **Localization (good first issue).** Externalize the English copy in
  `onboarding.ts` / `dispatcher.ts` into a small message catalog and add a second
  language.

## Tooling

- **`supabase db lint` in CI** once a hosted Postgres is available to lint
  against.
- **Container/E2E test** that runs the function against a throwaway Postgres.

---

> Note: at the time of writing, these candidates live here rather than as GitHub
> issues. Maintainers can promote them to issues (and apply `good first issue`)
> when the repository is ready for contributors.
