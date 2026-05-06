# Messenger-Native SaaS

**Reference stack by [Heartmade](https://heartmade.pl)** — subscription software that customers **use inside a messenger** (here: **Telegram**), not as a traditional installable app or as the primary web dashboard.

This project is developed as part of **Heartmade Studio** — https://github.com/heartmade-studio/

Heartmade Studio ships **reference stacks and templates** like this repo; client production code lives in separate, private codebases.

This repository is intentionally **small and opinionated**.

This repo is a **monorepo**: `apps/landing/` contains the static front door, and `docs/` contains the architecture, case study, and launch guidance.

Implementation shipped here is a **static landing page (HTML/CSS)** under `apps/landing/`.
The **messenger-native architecture** (Stripe + Supabase + Telegram webhooks) is documented in `ARCHITECTURE.md` and `docs/` so you can integrate your own backend.

It is **not** the production codebase of any client product. For a real-world narrative, see **[Moon Cue App](docs/moon-cue-app-case-study.md)** and the live site: **[trycue.pl](https://trycue.pl)**.

## What “Messenger-Native SaaS” means

| Traditional SaaS | Messenger-Native SaaS (this pattern) |
| ------------------ | -------------------------------------- |
| Web app + optional mobile app | Core UX in **Telegram / WhatsApp / …** |
| User installs from App Store | User already has the messenger |
| Session in browser | Session in chat + server-side state |

The UX thesis: **meet users where they already spend attention**, keep billing standard (Stripe), and keep data in Postgres (Supabase).

## Documentation

- [DESIGN.md](DESIGN.md) — design tokens and rules for the demo landing (UI agents).

## Contents

| Path | Purpose |
| ------ | --------- |
| [apps/landing/](apps/landing/) | Static landing page (HTML/CSS) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | End-to-end reference flow and data flow |
| [docs/moon-cue-app-case-study.md](docs/moon-cue-app-case-study.md) | Case study: **Moon Cue App** |
| [docs/launch-playbook.md](docs/launch-playbook.md) | How to publish this narrative (HN, LinkedIn, PH, …) |
| [docs/security-and-compliance.md](docs/security-and-compliance.md) | Webhooks, secrets, health data |
| [DESIGN.md](DESIGN.md) | Minimal UI tokens for this template |

## Quick start (static landing)

1. Deploy the folder [`apps/landing/`](apps/landing/) to any static host (or open `index.html` locally).
2. Replace the Stripe button URL inside [`apps/landing/index.html`](apps/landing/index.html) with your configured hosted checkout link.
3. Backend integration (Stripe webhooks + Telegram bot + Supabase) is described conceptually in [`ARCHITECTURE.md`](ARCHITECTURE.md) and `docs/security-and-compliance.md`.

## Positioning (Heartmade)

Use this repo as **proof of a repeatable architecture**, not as “a new invention.” Messengers and bots are established; the story is **shipping subscription products faster** with a **coherent stack** and **Cursor/vibe-coding** velocity.

See [docs/launch-playbook.md](docs/launch-playbook.md) for channels and angles.

## License

MIT — see [LICENSE](LICENSE).
