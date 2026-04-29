---
title: Messenger-Native SaaS — Landing design tokens
version: 1
---

# Overview

Minimal design tokens for the **static demo landing page** in this monorepo.

Primary product UX is **Telegram** (or another messenger). This landing exists for checkout acquisition and documentation links.

Landing implementation: [`apps/landing/`](apps/landing/).

# Colors

| Token | Role |
|-------|------|
| `--color-background` | Page background (`#faf9f7`) |
| `--color-surface` | Cards (`#ffffff`) |
| `--color-text` | Primary text (`#1a1816`) |
| `--color-muted` | Secondary text (`#5c5854`) |
| `--color-accent` | Primary actions / links (`#2d6a4f`) |
| `--color-accent-muted` | Hover / secondary accent (`#40916c`) |

# Typography

- **Font stack**: `system-ui`, `-apple-system`, `"Segoe UI"`, Roboto, Ubuntu, sans-serif
- **Scale**: browser default with heading emphasis via `font-size` on `h1` / `h2` only

# Layout

- **Max content width**: `980px` centered container
- **Spacing**: `16px` horizontal padding on the container; sections use natural vertical rhythm

# Elevation and depth

- **Card shadow**: `--shadow-soft` — soft ambient shadow for primary surface

# Shapes

- **Cards**: `border-radius: 12px` (`--radius-card`)
- **Buttons / small UI**: `8px` radius (`--radius-sm`)

# Components

- **Primary button**: filled `--color-accent`, white label
- **Link + hover**: use accent colors consistently, avoid underlined heavy styling

# Do's and don'ts

**Do**

- Keep the landing minimal; avoid competing with the messenger UX.
- Prefer semantic HTML (`main`, `section`, `label`, `button`).

**Don't**

- Don’t add heavy animation or third-party fonts unless brand guidelines require it.
- Don’t embed tracking without disclosure in your privacy policy.
