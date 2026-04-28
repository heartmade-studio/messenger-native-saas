---
title: Messenger-Native SaaS — UI tokens
version: 1
---

# Overview

Minimal design tokens for the **demo landing page** in this repository. The primary product UX is **Telegram**; this page exists for checkout acquisition and documentation links.

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

- **Max content width**: `640px` centered main column
- **Spacing**: `2.5rem` outer padding; `1.5rem` card padding

# Elevation and depth

- **Card shadow**: `--shadow-soft` — soft ambient shadow for primary surface

# Shapes

- **Cards**: `border-radius: 12px` (`--radius-card`)
- **Inputs / buttons**: `8px` radius

# Components

- **Primary button**: filled `--color-accent`, white label
- **Form inputs**: light border, no heavy chrome

# Do's and don'ts

**Do**

- Keep the landing minimal; avoid competing with the messenger UX.
- Prefer semantic HTML (`main`, `section`, `label`, `button`).

**Don't**

- Don’t add heavy animation or third-party fonts unless brand guidelines require it.
- Don’t embed tracking without disclosure in your privacy policy.
