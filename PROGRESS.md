# PROGRESS — starter-kit-v1

Working tracker for the v1 build. Updated after every verify→fix cycle.

## Definition of Done

| # | Item | Status |
|---|------|--------|
| 1 | `deno check` clean on all TS (zero type errors) | ⬜ |
| 2 | `deno test` green (dispatcher + onboarding) | ⬜ |
| 3 | Smoke test: simulated `/start` → 200 + expected reply (local) | ⬜ |
| 4 | Runs with only REQUIRED env; optionals degrade gracefully (test-proven) | ⬜ |
| 5 | `.env.example` covers every var the code reads | ⬜ |
| 6 | Every README Quick-Start step maps 1:1 to a real file/command | ⬜ |
| 7 | Method elements present (definition, comparison table, named principles, when-to-use/not) | ⬜ |
| 8 | `CITATION.cff`, `CONTRIBUTING.md`, `CHANGELOG.md` present and correct | ⬜ |
| 9 | Architecture diagram renders as Mermaid | ⬜ |
| 10 | CI workflow passes (verified by running its steps locally) | ⬜ |
| 11 | Secret scan on generated code clean (no key patterns, no real IDs, no `.env` with real values) | ⬜ |
| 12 | Leak-check report delivered | ⬜ |

## Gates

- **Gate 1 (plan approval)** — ✅ approved (focus-coach demo domain, Stripe webhook skeleton included).
- **Gate 2 (method copy review)** — pending.
- **Sanitization gate (diff + leak report before any push)** — pending.

## Notes

- Reference repo (MoonQ / `try-cue-app`) used read-only for structure only. No code copied; clean-room generic implementation.
- Nothing pushed and no GitHub issues created until Gate 2 + sanitization approval.
