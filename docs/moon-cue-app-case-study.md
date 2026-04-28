# Case study: Moon Cue App

**Moon Cue App** is a subscription product built by Heartmade using the **Messenger-Native SaaS** pattern: users interact primarily in **Telegram**, while **Stripe** handles billing and **Supabase** stores application state. Server routes run on **Vercel**.

Live product: **[https://trycue.pl](https://trycue.pl)**.

This file describes the **positioning and architecture narrative** for Heartmade. It does **not** include proprietary implementation details or user data.

## Problem

People who track cycles and related health signals often want **low friction**: no extra app install, no new account paradigm—just a trusted surface they already open daily.

## Approach

- **Primary UX**: conversational / command-driven flows inside **Telegram** (and room to add Mini App UI later).
- **Acquisition**: landing page with clear value proposition and Stripe Checkout for subscriptions.
- **Data**: structured rows in **Supabase** (Postgres), with server-side access only for privileged operations.
- **Delivery speed**: implementation accelerated with **Cursor** and “vibe coding,” then hardened where billing and privacy matter.

## Why messenger-first

- **Distribution**: the messenger is already installed; onboarding reduces to “subscribe → chat.”
- **Habit surface**: notifications and threads match reminder-style products.
- **Separation of concerns**: Stripe remains the system of record for **paid entitlement**; the bot enforces access based on server-side state.

## Stack (reference)

| Concern | Choice |
|---------|--------|
| Messenger | Telegram Bot API + webhook |
| HTTP / landing | Vercel (Next.js) |
| Database | Supabase |
| Billing | Stripe subscriptions |

## Risks and mitigations

- **Sensitive category**: health-adjacent products require careful privacy copy, data minimization, retention policy, and security reviews—see [security-and-compliance.md](security-and-compliance.md).
- **Platform dependence**: messenger policies and APIs change; design abstractions so **entitlement** and **UX** can migrate (e.g. WhatsApp Business API) without rewriting billing.

## Relation to this repository

The code in **this** repo is a **neutral template** (demo landing + webhooks). **Moon Cue App** is the product story; reuse the same architectural ideas, not a copy-paste of production code.

## Heartmade takeaway

**Moon Cue App** demonstrates that Heartmade can ship **modern subscription software** with **AI-accelerated development** and a deliberate **“where users already are”** UX strategy—usable as sales collateral alongside this open reference implementation.
