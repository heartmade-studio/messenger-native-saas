# Contributing

Thanks for your interest in the Messenger-Native SaaS starter. This is a
reference starter kit, so the bar is: **changes keep it small, runnable, and
honest.** A first-time forker should still get a working bot in ten minutes.

## Ground rules

- **English everywhere** — code, comments, commits, docs.
- **Keep the core dependency-light.** The only runtime dependency is
  `@supabase/supabase-js`; integrations use plain `fetch`. Please don't add SDKs
  for optional adapters.
- **Optional stays optional.** Anything beyond the core (AI, billing, analytics)
  must degrade gracefully and never throw when its env vars are absent.
- **Deterministic core.** Keep business logic (like the onboarding state
  machine) pure and unit-tested; reserve the network/LLM for the edges.

## Development

Prerequisites: [Deno](https://deno.com/) ≥ 2.x, [Docker](https://www.docker.com/),
and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
deno task fmt        # format
deno task lint       # lint
deno task check      # type-check
deno task test       # unit tests
deno task smoke      # simulated /start → 200 (no Docker)
```

Before opening a pull request, make sure `fmt`, `lint`, `check`, `test`, and
`smoke` all pass — these are exactly what CI runs.

## Pull requests

1. Fork and branch from `main`.
2. Make a focused change with tests where it makes sense.
3. Run the checks above.
4. Update `CHANGELOG.md` under an "Unreleased" heading.
5. Open the PR with a clear description of the what and why.

## Good first issues

See [ROADMAP.md](ROADMAP.md) for scoped ideas — additional transport channels,
an OpenAI adapter alongside Gemini, and more. Issues labeled `good first issue`
are a friendly place to start.

## Reporting bugs

Open an issue using the bug template. Include your OS, Deno and Supabase CLI
versions, and the exact command and output. **Never paste real secrets, tokens,
or project refs** into an issue.
