# CronLens — Build Log & Phase Tracker

Living record of what's been built, the decisions taken along the way, and how each phase was verified.
Phase definitions live in [Architecture.md §8](./Architecture.md#8-phased-build-plan).

Status legend: ⬜ not started · 🟡 in progress · ✅ done

---

**Live:** https://bhupendranegi.github.io/CronLens/ — CI, E2E, and Pages deploy all green on `main` (2026-07-03).

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-02 | Deploy to **GitHub Pages** (not Vercel) | Pure static, zero backend; keeps hosting in the repo, free. Trade-off: no per-PR previews. |
| 2026-07-02 | Serve from project subpath `bhupendra.github.io/CronLens/` | No custom domain for now. `basePath: '/CronLens'` is free config. |
| 2026-07-02 | `basePath`/`assetPrefix` **env-gated** on `PAGES=true` | Local dev at `localhost:3000` stays path-free; only CI builds with the subpath. |
| 2026-07-02 | Stack: Next.js (App Router) + TS, static export, Tailwind v4, pnpm, Node 22 | See Architecture.md §2. |
| 2026-07-02 | Dev inside Docker on a dedicated Colima profile `cronlens` | Isolated from other profiles (`webhook`, `itsaprom`). Docker socket addressed via `DOCKER_HOST`, not a global context switch. |
| 2026-07-02 | `bin/` scripts (setup/dev/lint/test) as the entry points; retired the Makefile | Matches the sibling `hookview` project's ergonomics (idempotent, colored, cleanup trap, free-port). One clear path instead of two. |
| 2026-07-02 | Separate `ci.yml` (lint/typecheck/test/build) from `deploy.yml` | CI runs pnpm directly on the runner — fast, no Docker. Deploy stays a distinct concern. |

---

## Phase 0 — Scaffold  ✅

Goal: a blank CronLens page building, running in the dev container, tests green, and a Pages workflow.

Path taken:
- Next.js App Router + TypeScript, hand-scaffolded (not `create-next-app`) to match the documented repo
  structure and avoid conflicts with existing `docs/` and `CLAUDE.md`.
- Tailwind v4 via `@tailwindcss/postcss` (CSS-first config, no `tailwind.config` needed for basics).
- `next.config.ts`: `output: 'export'`, `images.unoptimized`, `trailingSlash`, env-gated `basePath`/`assetPrefix`.
- Pure core seeded with `lib/cron/types.ts` (data model from Design §20) — zero React/DOM deps.
- Vitest wired with one green scaffold test.
- Dev container: `Dockerfile` (Node 22 + corepack pnpm), `docker-compose.yml` (bind-mount source, named
  `node_modules` volume, polling file-watch), `Makefile` targeting the `cronlens` Colima profile via
  `DOCKER_HOST` (no global docker-context mutation).
- `.github/workflows/deploy.yml`: build static export with `PAGES=true`, drop `.nojekyll`, publish to Pages.

Verify gate (all passed 2026-07-02, inside the `cronlens` Colima profile):
- [x] `make up` serves the blank page at `localhost:3000` — `HTTP 200`, `<title>CronLens</title>`
- [x] `make test` runs the Vitest suite green — 1 file / 1 test passed
- [x] `pnpm build` emits static `out/` (`index.html`, `_next/`, `404.html`); workflow adds `.nojekyll` in CI
- [x] Pages workflow written (`.github/workflows/deploy.yml`)

Also added in this pass (per user request to borrow from `hookview`):
- `bin/setup`, `bin/dev`, `bin/lint`, `bin/test` — colored, idempotent; route through the `cronlens`
  container locally, use host `pnpm` when present (CI). `bin/dev` has a teardown trap + free-port selection.
- `.github/workflows/ci.yml` — lint + typecheck + test + build on every PR/main push.
- `README.md` rewritten with the `bin/` quick start. Makefile removed.

Notes for future me:
- Host has no `pnpm`. **Regenerate the lockfile after any `package.json` dep change** with
  `docker compose run --rm web pnpm install --lockfile-only` (writes to the bind-mounted repo, no
  node_modules purge prompt). Do NOT rely on extracting it from the image — that drifted once and broke CI
  with `ERR_PNPM_OUTDATED_LOCKFILE`.
- `pnpm install` inside the bind-mounted container prompts to purge the `node_modules` volume — expected;
  don't run it interactively. Rebuild the image (`docker compose build`) to refresh deps instead.
- Resolved versions: Next 15.x, React 19, Tailwind 4.3, Vitest 3.2, TypeScript 5.9 (see `pnpm-lock.yaml`).
- **Tech debt:** `next lint` is deprecated (removed in Next 16). Migrate to the ESLint CLI
  (`npx @next/codemod@canary next-lint-to-eslint-cli .`) before bumping to Next 16.

### CI roadmap
- [x] Lint + typecheck + test + build on PR/main (`ci.yml`)
- [x] Playwright E2E job (`e2e.yml`) — chromium, on PR/main
- [ ] Test coverage reporting
- [ ] Branch protection: require `check` + `playwright` to pass before merge

---

## Phase 1 — Core parser + scheduler  ✅

Built `parser.ts` (field syntax), `expression.ts` (field-count + per-field parse), `timezone.ts` (Intl-based
offset/wall/DST helpers), `scheduler.ts` (bounded next-N-runs, DOM/DOW OR rule, DST-gap skip). All ported from
the design prototype into pure, typed modules with zero React/DOM deps.

Verify gate (passed 2026-07-02):
- [x] 32 unit tests green: parser syntax + errors, expression validation, scheduler
- [x] Five canonical expressions produce correct instants in **UTC** and **Asia/Kolkata**
- [x] DOM/DOW OR behavior and count/horizon bounds covered
- [x] lint + typecheck clean
## Phase 2 — Translator + field breakdown  ✅

Built `translator.ts`: `buildSummary` (plain-English, Design §12) and `buildFieldExplanations` (per-field
breakdown, §13). Full month/weekday names with contiguous-run collapsing ("Monday through Friday").

Verify gate (passed 2026-07-02):
- [x] Exact-match tests for all §12 example translations and §22 edge-case phrasings
- [x] §13 field breakdown of `0 9 * * 1-5` matches the documented table
- [x] 41 tests total green; lint + typecheck clean

Note: used exact-string assertions against the design doc (the oracle) rather than opaque snapshots — stronger
and self-documenting.
## Phase 3 — UI wiring (v0.1 MVP)  ✅

Built the orchestrator (`preview.ts`) and run formatting (`format.ts`), then the React UI: `CronLens`
(client component: input, examples, timezone/runs controls, live recompute) + `SummaryCard`, `RunsTable`
(responsive table/cards), `FieldBreakdown`. Wired into `app/page.tsx`.

Verify gate (passed 2026-07-02):
- [x] Static export prerenders the full UI — summary, runs (correct weekend-skipping Thu→Fri→Mon), UTC
      offsets, and breakdown all present in `out/index.html`
- [x] `preview.ts` unit tests assert the exact rendered strings (45 unit tests total)
- [x] **Playwright E2E (3 specs) pass in a real browser** — weekday cron, invalid-expression error,
      example-chip fill — run via the official Playwright image against the dev container
- [x] lint + typecheck clean

Notes:
- E2E locally: ran the `mcr.microsoft.com/playwright:v1.61.1-jammy` image on the compose network against
  `http://web:3000` (browsers aren't installable in our alpine dev image). In CI, `e2e.yml` runs it natively.
- Deferred to later phases: warnings panel (Phase 4), copy/share + custom start (Phase 5).
## Phase 4 — Warnings + DST surfacing  ✅

Built `warnings.ts` (every-minute, frequent, DOM-and-DOW OR, leap-year, some-months-skipped, DST-gap,
tz-observes-DST) wired into `preview.ts`; `WarningsPanel` renders them with severity styling. Per-run DST
notes already surfaced in Phase 3's `RunsTable`.

Verify gate (passed 2026-07-02):
- [x] 8 warning tests cover every §16/§22 trigger and confirm a plain weekday schedule is warning-free
- [x] 53 tests total green; typecheck + lint clean
## Phase 5 — Copy/share + custom start (v0.2)  ✅

Built `share.ts` (encode/decode `?expr&tz&n`, `buildShareUrl`), `exporters.ts` (summary text, runs text,
Markdown), `CopyActions` component (clipboard with "Copied!" flash), and a "Start from" Now/Custom control
that reads a `datetime-local` value as wall-clock time in the selected timezone (`localInputValue` seeds it).

Verify gate (passed 2026-07-02):
- [x] Share params round-trip (`decode(encode(p)) === p`); out-of-range count ignored
- [x] Exporter output asserted (summary/runs/Markdown); 61 unit tests total
- [x] 4 Playwright specs pass incl. copy actions + custom-start control visible
- [x] typecheck + lint + build clean

**v0.2 is feature-complete.**

## Phase 6 — Dialect expansion (v0.3)  ✅

Introduced the `dialects.ts` **registry** and generalized the parser core over it (no per-dialect fork):

- **Nicknames**: `@yearly`/`@annually`, `@monthly`, `@weekly`, `@daily`/`@midnight`, `@hourly` (expanded to
  the dialect's field count).
- **6-field (seconds)**: seconds field prepended; scheduler iterates seconds; summary/breakdown seconds-aware
  (second 0 stays silent so 5-field-equivalent output is unchanged).
- **Quartz**: 6–7 fields (optional **year**), `SUN=1` day-of-week numbering, `?` = unrestricted. `L`/`W`/`#`
  are explicitly rejected with a clear message (**deliberately deferred** — advanced, high-risk).
- Refactor threaded through `parser` (`?` + custom dow normalize), `expression` (dialect-aware, nickname
  expand, variable field count), `timezone`/`scheduler` (seconds + year), `translator`, `warnings`,
  `preview`, plus a UI **Dialect** selector.

Verify gate (passed 2026-07-02):
- [x] All 61 prior tests stayed green through the refactor (behavior-preserving)
- [x] 13 new dialect tests (nicknames, 6-field seconds scheduling, Quartz `?`/year/day-numbering, L/W/#)
- [x] **74 unit tests + 5 Playwright specs** green; typecheck + lint + build clean

## Phase 7 — Roadmap cleanup  ✅

Cleared the three carried-over items (2026-07-02):

- **Dialect in share URLs** — `?d=<dialect>` (omitted for the default 5-field), read on load; round-trip tested.
- **`next lint` → ESLint CLI** — flat `eslint.config.mjs` via `FlatCompat` extending `next/core-web-vitals`;
  `lint` script is now `eslint .`; dropped `.eslintrc.json`; added `@eslint/eslintrc`. No deprecation warning.
- **Quartz `L`/`W`/`#`** — `special.ts` parses and matches `L`, `L-<n>`, `LW`, `<d>W` (day-of-month) and
  `<d>L`, `<d>#<n>` (day-of-week). `ParsedField.special` carries a per-date rule the scheduler evaluates;
  summary + breakdown describe them. 10 tests scheduling on real 2026 dates.

Verify gate: **87 unit tests** + Playwright specs green; typecheck + lint + build clean.

Remaining/optional: `@weekly`-style extras, additional platform-preset dialects (K8s/GHA/EventBridge), and
per-run 12-hour formatting toggle — all deferred, none blocking.
