# CLAUDE.md
**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Conventions

- **Git commits:** Do NOT add Claude as a co-author. No `Co-Authored-By: Claude` trailer and no "Generated with Claude Code" line in commit messages.

## Project Setup (CronLens)

See [docs/Architecture.md](docs/Architecture.md) for the full plan; [docs/Design Document.md](docs/Design%20Document.md) for the product spec.

- **What it is:** a 100% client-side cron expression explainer. Core promise: "nothing leaves the page." No backend, no DB, no auth in the MVP.
- **Stack:** Next.js (App Router) + TypeScript, static export (`output: 'export'`), Tailwind CSS, React hooks only, pnpm, Node 22 (in Docker).
- **Core rule:** `lib/cron/` is pure TypeScript with zero React/DOM deps — the testable, reusable engine. UI components stay thin.
- **Tests:** Vitest (unit + snapshot) for the core; Playwright for E2E.
- **Deploy:** GitHub Pages via `.github/workflows/deploy.yml` (`PAGES=true` static export → publish `out/`). No per-PR previews. Needs `.nojekyll` + `basePath`/`assetPrefix` unless a custom domain is used.
- **CI:** `.github/workflows/ci.yml` runs lint + typecheck + test + build on every PR/main push (pnpm on the runner, no Docker).
- **Local dev:** Colima profile `cronlens`, develop inside Docker. Use the `bin/` scripts (no host Node/pnpm needed): `bin/setup` (one-time), `bin/dev` (server on `localhost:3000`, free-port fallback, teardown on exit), `bin/test`, `bin/lint`. Hot reload uses polling (`WATCHPACK_POLLING`/`CHOKIDAR_USEPOLLING`). Lockfile is generated in the image and extracted to the repo.
