# Case study: MoonQ

**MoonQ** is a Telegram bot that sends a man in a committed relationship **one message per day**: where his partner is in her menstrual cycle, and **one concrete action** he can take that day. It is built by Heartmade using the **Messenger-Native SaaS** pattern — users interact entirely in **Telegram**, while **Stripe** handles billing, **Supabase Edge Functions** run the logic, and the **Gemini API** personalizes the message for paying users.

Live product: **[https://moonq.app](https://moonq.app)** — tagline *"Her moon, your cue."*

This file describes the **positioning and architecture narrative** for Heartmade. It does **not** include proprietary implementation details or user data.

## Problem

In many committed relationships, a partner's needs and mood shift across the monthly cycle. For the supporting partner (often male), this can feel confusing and easy to get wrong. The common "solutions" — cycle-tracking apps — are built for the woman logging her own body, not for a partner who wants to show up better day to day.

## What MoonQ is — and is not

- **It computes, it does not track.** The man enters two values **once** (his partner's last-period start date and her typical cycle length). MoonQ derives the phase from those; it **never** asks him to log symptoms, mood, or daily check-ins. It is **not a cycle tracker**.
- **It is one daily cue, not a dashboard.** Each morning, at the hour the user chose, MoonQ sends a single message: the current phase, what it tends to mean, and one specific thing to do or say.
- **It is consent-by-design, not covert.** Setup includes an "ask her" script; the partner is meant to know. MoonQ stores only a label the user types for her (her first name or a nickname) plus the cycle dates — no account, contact, or symptom data about her.

## Approach

- **Onboarding-first flow.** No web form, no card. The user taps **"Start free on Telegram"**, opens the bot, completes a **four-question setup in chat**, and a **free 14-day trial starts right away** — everything happens inside Telegram.
- **Deterministic engine, AI on top.** The cycle math is plain, testable TypeScript — never delegated to an LLM. **Gemini** personalizes the wording, and only for paying users.
- **Edge compute.** Webhooks and the hourly dispatcher run on **Supabase Edge Functions (Deno)** — fast responses to Telegram, no servers to babysit.
- **Event-driven by default.** Checkout, activation, cue delivery, and acknowledgement are all rows in one `events` table, so retention can be analyzed without third-party tooling.

## Deterministic cycle engine (engineering rigor)

The heart of MoonQ is a pure function `(cycle_start, cycle_length, today) → (phase, day_in_cycle)`. No AI touches this — it has to be correct and explainable.

- **Luteal phase is fixed at 14 days**, so `ovulation_day = cycle_length − 14`, with the ovulatory window `{ovulation_day − 1, ovulation_day}`.
- **Phases** (28-day example): menstrual `1–5`, follicular `6–12`, ovulatory `13–14`, luteal `15–28`.
- **Content invariant:** every piece of advice carries a phase tag, and the system holds `advice.phase == computePhase(cycle_length, day).phase` for every day of every supported cycle length. A cue can never be served against the wrong phase.
- **Property-based tests** (fast-check, via `deno test`) assert that invariant across the full range of cycle lengths and days, instead of a handful of hand-picked cases.

This is the "vibe-coding" discipline made visible: the risky part (a woman's body, a man acting on it) is the *deterministic* part; AI is confined to tone.

## Trial vs. paid (a deliberate cost + trust decision)

There is **no free tier**. Everyone starts on the same **14-day free trial** (no card); to keep going after it, the user moves to a paid plan (Monthly/Annual) or buys Lifetime. What changes across that line is *how each message is composed*:

- **During the trial (14 days):** advice comes straight from a **manually reviewed seed bank** for the current phase — a simple, deterministic lookup, **no AI**. Cheap to run, and every word has been read by a human before it ships.
- **On a paid plan:** the same evidence base, **personalized by Gemini** (the partner's name, lighter or warmer tone) on top of the deterministic phase.

The split keeps unit economics sane (no LLM spend during the free trial) and de-risks quality (AI never improvises the trial experience).

## Activation contract (UX)

There is no signup form — onboarding happens **entirely inside Telegram**. The bot captures every product field in four steps:

1. **Partner label** — her first name *or* a nickname; optional, defaults to `"Partner"`.
2. **Last-period start date** — required, paired with an *ask-her* script.
3. **Cycle length** — defaults to `28`, with an *ask-her* script and gentle `(?)` framing for users who don't know.
4. **Notification hour** — `0–23`, default `8`.

The bot confirms with a one-line recap, flips the user to `trialing`, and sends the first cue immediately. Day-to-day control lives in a small command set — `/start`, `/days`, `/nick`, `/language` (en/pl/es), `/hour`, plus `/help` and `/status` — while billing for paid plans lives in the Stripe Customer Portal and support is at `moonq@heartmade.pl`.

## Content & localization

- **Polish is the source language;** copy is localized to **en / pl / es**.
- The partner label is injected via a `{nickname}` placeholder (nominative case) — whatever name the user chose, rendered literally.
- **No emoji.** A fixed body shape keeps every cue scannable:

  ```
  {situation}

  — "{say}"

  Tip: {tips}
  ```

## Measurement (PM)

- **North Star Metric — ACAW:** *Active Cues Acknowledged per Week.* Not installs, not opens — whether a man actually acted on the guidance.
- **One hypothesis, one metric, one path to kill or scale.** Before build-out, the idea ran through a **10-interview validation protocol** with an explicit decision gate, so engineering effort followed evidence rather than enthusiasm.

## Why messenger-first

- **Distribution:** no app to install — onboarding reduces to "start chat → trial."
- **Habit surface:** messenger notifications see ~80–90% open rates vs. ~20% for email, and the product sits next to messages from family and friends.
- **Frictionless upgrade:** Stripe handles the move to paid; the first value lands on day one.

## Stack (reference)

| Concern | Choice |
| --------- | -------- |
| UX / Messenger | Telegram Bot API (free, no template approval, webhook-native) |
| Compute / Logic | Supabase Edge Functions (Deno) |
| AI / LLM | Google Gemini API (2.5 Flash) — paid personalization only |
| Database | Supabase (PostgreSQL), EU region, RLS on every table |
| Billing | Stripe Checkout (via an Edge Function) — **card-free** 14-day trial; Monthly/Annual convert after the trial, Lifetime is a one-time purchase |
| Scheduling | `pg_cron` hourly tick → dispatcher matches each user's local hour |
| Observability | PostHog (funnel) & Sentry (errors) |

WhatsApp is explicitly a **Phase 2** channel, not part of the MVP.

## FAQ

**Is MoonQ a cycle tracker for men?**
No. The user enters two dates once; MoonQ computes the phase and never asks him to log symptoms.

**Does the AI decide the cycle phase?**
No. The phase comes from a deterministic TypeScript function. Gemini only rewords the message, and only for paying users.

**Why Telegram?**
It is fast, already on the user's phone, and webhook-native with no message-template approval — so the product can live as a daily message instead of another app to open.

**Is it medical advice?**
No. MoonQ is informational and relationship-focused, not a medical or diagnostic tool.

## Relation to this repository

The code in **this** repo is a **neutral blueprint**. **MoonQ** is the proof point — reuse the same architectural ideas (Deno webhooks, an `events` table, a deterministic core with AI confined to the edges, a card-free trial) to build your own messenger-native product.

## Heartmade takeaway

**MoonQ** shows that Heartmade can ship **modern, AI-powered subscription software** with a deliberate **"where users already are"** UX strategy — and the engineering judgment to keep the AI where it belongs.
