# Messenger-Native SaaS

**Reference stack by [Heartmade](https://heartmade.pl)** — subscription software that customers **use inside a messenger** (here: **Telegram**), not as a traditional installable app or as the primary web dashboard.

This repository is intentionally **small and opinionated**: a landing page and API routes on **Vercel**, **Stripe** subscriptions, **Supabase** persistence, and a **Telegram** bot via webhooks.

It is **not** the production codebase of any client product. For a real-world narrative, see **[Moon Cue App](docs/moon-cue-app-case-study.md)** and the live site: **[trycue.pl](https://trycue.pl)**.

## What “Messenger-Native SaaS” means

| Traditional SaaS | Messenger-Native SaaS (this pattern) |
|------------------|--------------------------------------|
| Web app + optional mobile app | Core UX in **Telegram / WhatsApp / …** |
| User installs from App Store | User already has the messenger |
| Session in browser | Session in chat + server-side state |

The UX thesis: **meet users where they already spend attention**, keep billing standard (Stripe), and keep data in Postgres (Supabase).

## Documentation

- [DESIGN.md](DESIGN.md) — design tokens and rules for the demo landing (UI agents).

## Contents

| Path | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | End-to-end diagram and data flow |
| [docs/moon-cue-app-case-study.md](docs/moon-cue-app-case-study.md) | Case study: **Moon Cue App** |
| [docs/launch-playbook.md](docs/launch-playbook.md) | How to publish this narrative (HN, LinkedIn, PH, …) |
| [docs/security-and-compliance.md](docs/security-and-compliance.md) | Webhooks, secrets, health data |
| [DESIGN.md](DESIGN.md) | Minimal UI tokens for this template |
| [supabase/schema.sql](supabase/schema.sql) | Example `subscriptions` table |

## Quick start (development)

1. **Requirements**: Node 20+ (see [.node-version](.node-version)), `fnm use` recommended.

2. **Clone and install**

   ```bash
   cd messenger-native-saas
   fnm use
   npm install
   ```

3. **Configure environment** — copy [.env.example](.env.example) to `.env.local` and fill values.

4. **Apply database schema** — run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor.

5. **Stripe**

   - Create a **Product** and recurring **Price**; set `STRIPE_PRICE_ID`.
   - For local webhooks, use Stripe CLI:

     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```

     Use the printed **signing secret** as `STRIPE_WEBHOOK_SECRET`.

6. **Telegram**

   - Create a bot with [@BotFather](https://t.me/BotFather), set `TELEGRAM_BOT_TOKEN`.
   - Point the webhook to your deployment (or tunnel):

     ```bash
     curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
       -H "Content-Type: application/json" \
       -d '{"url":"https://<your-domain>/api/webhooks/telegram","secret_token":"<same as TELEGRAM_WEBHOOK_SECRET>"}'
     ```

     When `TELEGRAM_WEBHOOK_SECRET` is set, this repo verifies `X-Telegram-Bot-Api-Secret-Token`.

7. **Run**

   ```bash
   npm run dev
   ```

8. **Demo flow**

   - Message the bot → `/start` → copy **chat id**.
   - Paste chat id on the landing page → **Subscribe** (test card).
   - After webhook processing → `/status` in Telegram.

## Deploy (Vercel)

- Connect the repo, set env vars in the Vercel project (same keys as `.env.example`).
- Update Stripe webhook endpoint to `https://<domain>/api/webhooks/stripe`.
- Set Telegram `setWebhook` to `https://<domain>/api/webhooks/telegram`.

## Positioning (Heartmade)

Use this repo as **proof of a repeatable architecture**, not as “a new invention.” Messengers and bots are established; the story is **shipping subscription products faster** with a **coherent stack** and **Cursor/vibe-coding** velocity.

See [docs/launch-playbook.md](docs/launch-playbook.md) for channels and angles.

## License

MIT — see [LICENSE](LICENSE).
