# Case study: Moon Cue App

**Moon Cue App** is a subscription product built by Heartmade using the **Messenger-Native SaaS** pattern. Users interact primarily in **Telegram**, while **Stripe** handles billing, **Supabase Edge Functions** execute logic, and **Gemini API** generates personalized insights.

Live product: **[https://trycue.pl](https://trycue.pl)**.

This file describes the **positioning and architecture narrative** for Heartmade. It does **not** include proprietary implementation details or user data.

## Problem

In many committed relationships, a partner’s mood can vary depending on the monthly cycle phase. For the supporting partner (often male), this can feel confusing.

Moon Cue App tracks the cycle phase and sends partner-facing information ("Cues"). The goal is to reduce misunderstandings and build a supportive bond.

## Approach

- **Onboarding-First Flow**: Instead of a web form, users click "Start" and complete a 4-step interactive onboarding inside Telegram, immediately receiving a 14-day free trial.
- **AI Composition**: We leverage **Google Gemini API** to analyze cycle states and generate highly empathetic, personalized guidance in real-time.
- **Edge Compute**: Webhooks and cron jobs (Dispatcher) run on **Supabase Edge Functions (Deno)**, ensuring zero cold starts and fast responses to Telegram.
- **Observability**: **PostHog** tracks funnel conversion during the chat onboarding, while **Sentry** catches any Deno errors.

## Why messenger-first

- **Distribution**: No app to install. Onboarding reduces to "start chat -> trial."
- **Habit surface**: 80%+ open rates for notifications.
- **Frictionless**: Stripe handles the eventual upgrade to paid, but the initial value delivery is immediate.

## Stack (reference)

| Concern | Choice |
| --------- | -------- |
| UX / Messenger | Telegram Bot API |
| Compute / Logic | Supabase Edge Functions (Deno) |
| AI / LLM | Google Gemini API |
| Database | Supabase (PostgreSQL) |
| Billing | Stripe subscriptions |
| Observability | PostHog & Sentry |

## Relation to this repository

The code in **this** repo is a **neutral template**. **Moon Cue App** is the product story; reuse the same architectural ideas—like Deno webhooks and Gemini integration—to build your own.

## Heartmade takeaway

**Moon Cue App** demonstrates that Heartmade can ship **modern, AI-powered subscription software** with a deliberate **"where users already are"** UX strategy.
