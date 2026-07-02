# CronLens — Architecture & Setup Plan

Companion to [Design Document.md](./Design%20Document.md). The design doc defines *what* CronLens is;
this defines *how* we build, run, and ship it.

---

## 1. Guiding constraint

CronLens is a **single-purpose, 100% client-side developer utility**. The design's core promise is
*"nothing leaves this page"* — all parsing, scheduling, translation, and DST logic run in the browser.

That one constraint drives every decision below:

- **No backend, no database, no auth** for the MVP. Sharing is URL-param based.
- The app is a **static bundle** — hostable on any CDN, deployed to **GitHub Pages**.
- Docker/Colima is for **local dev parity only**, not the production artifact. GitHub Actions builds from source.

---

## 2. Stack (decided)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Strong TS/tooling story; static export deploys anywhere, incl. GitHub Pages. |
| Rendering | **Static export** (`output: 'export'`) | Emits a plain static site → deployable to GitHub Pages, honors the privacy promise. |
| UI | React 19 (client components) | The whole tool is interactive; core is one client-rendered page. |
| Styling | **Tailwind CSS** | Matches the utilitarian aesthetic; fast to build the dense control/results layout. |
| State | React hooks only | No global store needed — single-page, derived-from-input state. URL params via `URLSearchParams`. |
| Package manager | **pnpm** | Fast, disk-efficient, plays well with Docker layer caching. |
| Runtime (container) | **Node 22 LTS** pinned in Docker | Reproducible builds regardless of host Node version. |
| Unit/snapshot tests | **Vitest** | Fast, TS-native, snapshot support for translation/breakdown output. |
| E2E/integration | **Playwright** | Full input→preview flows, timezone/DST scenarios across real browser. |
| Lint/format | ESLint + Prettier | Standard. |

**Note on the tension:** "Next.js" + "pure static" resolves to `output: 'export'`. GitHub Pages serves
only static files — there are no serverless functions at all, which actually *reinforces* the privacy
promise. If we ever want server-rendered OG images for shared links, that would mean moving to a host with
functions (e.g. Vercel) — a deliberate, explicit future decision, not an accident.

---

## 3. Architecture

The critical design rule: **`lib/cron/` is pure TypeScript with zero React/DOM dependency.** This is the
testable, reusable core — it mirrors the design's "Logic Modules" (§24) and could later back an API or an
embeddable widget without a rewrite. UI components stay thin and just render what the core returns.

```
Browser (static page)
  UI layer (components/)        ← thin, presentational, React
        │  CronPreviewRequest
        ▼
  Core (lib/cron/)              ← pure TS, framework-agnostic, 100% unit-tested
   parser → validator → translator → scheduler → (timezone / dst)
        │  CronPreviewResult
        ▼
  UI renders summary, runs table, field breakdown, warnings
```

Data model (`CronPreviewRequest` / `CronPreviewResult` / `CronRun` / etc.) is taken verbatim from
Design Document §20 and lives in `lib/cron/types.ts`.

---

## 4. Repo structure

```
CronLens/
├─ app/                       # Next.js App Router
│  ├─ layout.tsx
│  ├─ page.tsx                # the single-page tool
│  └─ globals.css
├─ components/                # UI components (Design §24)
│  ├─ CronInput.tsx           TimezoneSelect.tsx   DialectSelect.tsx
│  ├─ RunCountSelect.tsx      StartDateTimePicker.tsx
│  ├─ SummaryCard.tsx         ValidationPanel.tsx  NextRunsTable.tsx
│  ├─ FieldBreakdown.tsx      WarningsPanel.tsx    CopyActions.tsx
│  └─ ExamplesPanel.tsx
├─ lib/cron/                  # framework-agnostic core (Design §24 logic modules)
│  ├─ types.ts                # data model (Design §20)
│  ├─ parser.ts               # normalize, split, parse each field
│  ├─ validator.ts            # errors vs warnings vs info
│  ├─ translator.ts           # plain-English summary + field breakdown
│  ├─ scheduler.ts            # next-N-runs search (bounded)
│  ├─ timezone.ts             # IANA offset/wall-time helpers
│  ├─ dst.ts                  # spring-forward gaps / fall-back doubles
│  ├─ dialects.ts             # DialectDefinition registry (Design §24)
│  ├─ shareUrl.ts             # encode/decode ?expr=&tz=&n=&start=
│  └─ __tests__/              # Vitest unit + snapshot tests
├─ e2e/                       # Playwright specs (added in Phase 3)
├─ public/
├─ bin/                       # dev entry points (setup / dev / lint / test)
├─ .github/workflows/
│  ├─ ci.yml                  # PR + main: install → lint → typecheck → test → build
│  └─ deploy.yml              # main: build static export → publish to GitHub Pages
├─ Dockerfile                 # dev + build image (Node 22)
├─ docker-compose.yml         # dev service w/ hot reload
├─ .dockerignore
├─ next.config.ts             # output: 'export' + Pages basePath/assetPrefix
├─ vitest.config.ts
├─ playwright.config.ts       # (added in Phase 3)
└─ package.json
```

---

## 5. Local dev: Colima + Docker

Docker gives a reproducible dev environment; Colima is the container runtime on macOS. We isolate CronLens
in its **own Colima profile** (`cronlens`) so it can't collide with other projects' VMs/ports. There is **no
host toolchain requirement** — no local Node/pnpm needed; everything runs in the container.

### `bin/` scripts (the supported entry points)

Modeled on the sibling `hookview` project. Each script points docker at the `cronlens` profile's socket via
`DOCKER_HOST` (no global `docker context` switch), with colored, idempotent output.

```bash
bin/setup      # one-time: start Colima profile, build dev image, extract pnpm-lock.yaml
bin/dev        # start the dev server → http://localhost:3000 (Ctrl-C tears the container down)
bin/test       # run the vitest suite (extra args passed through, e.g. bin/test --watch)
bin/lint       # eslint + tsc --noEmit
```

`bin/dev` picks the next free host port if 3000 is taken (`PORT=3939 bin/dev` or `bin/dev 3939` to force one)
and installs a cleanup trap so `docker compose down` always runs on exit. `bin/lint`/`bin/test` auto-detect a
host `pnpm` (used in CI) and otherwise run inside the container.

`Dockerfile`: Node 22 + corepack pnpm. `docker-compose.yml`: `pnpm dev`, source bind-mounted for hot reload,
`node_modules` in a named volume (so the bind-mount doesn't shadow the installed deps).

**Known caveat — file watching:** hot reload across the Colima VM's mount can miss events. We enable polling
via env in compose (`WATCHPACK_POLLING=true`, `CHOKIDAR_USEPOLLING=true`). Slightly higher CPU, reliable reload.

**Lockfile note:** with no host pnpm, `pnpm-lock.yaml` is generated during the image build and extracted to the
repo (`bin/setup` does this) so CI's `--frozen-lockfile` and Pages build are reproducible.

Colima forwards container ports to `localhost` automatically, so `localhost:3000` just works.

---

## 6. Deployment: GitHub Pages

**Important:** the Docker image is *not* the deploy artifact. A **GitHub Actions** workflow builds the static
site on CI and publishes it to Pages. Docker/Colima is purely for local parity.

### Flow

1. `next build` with `output: 'export'` emits a static site into `./out`.
2. A workflow (`.github/workflows/deploy.yml`) on push to `main`: install → build → upload `out/` artifact →
   deploy to Pages via `actions/deploy-pages`.
3. No environment variables, no functions, no secrets (zero backend).
4. `main` → production. (GitHub Pages has **no built-in per-PR previews** — a trade-off vs Vercel.)

### Static-export config required for Pages

Because Pages serves a Jekyll pipeline over static files at a project subpath, `next.config.ts` needs:

```ts
const repo = 'CronLens';
export default {
  output: 'export',
  basePath: process.env.PAGES ? `/${repo}` : '',      // only when served from /<repo>/
  assetPrefix: process.env.PAGES ? `/${repo}/` : '',
  images: { unoptimized: true },                        // no image optimizer on Pages
  trailingSlash: true,
};
```

- The build step also drops a **`.nojekyll`** file into `out/` so Jekyll doesn't strip `_next/` assets.
- **`basePath` only matters if we serve from `bhupendra.github.io/CronLens/`.** A **custom domain** (or a
  `bhupendra.github.io` root repo) removes the need for `basePath`/`assetPrefix` entirely — the cleaner path
  if we ever attach a domain.

Trade-off of static export: no Next image optimization / middleware / ISR. We need none — it's a client-side
tool.

---

## 7. Testing strategy (maps to Design §29)

- **Unit (Vitest)** — the heart of it, all in `lib/cron/`: field/range/step/list parsing, named months/days,
  invalid values, field-count errors, translation, timezone conversion, DST gaps/doubles, leap-year schedules.
- **Snapshot (Vitest)** — translation output, field breakdown, warning sets.
- **E2E (Playwright)** — full input→preview for the canonical expressions (`*/5 * * * *`, `0 9 * * 1-5`,
  `0 0 1 * *`, `0 0 29 2 *`, `0 9,17 * * MON-FRI`) across UTC, `Asia/Kolkata` (no DST), `America/New_York` (DST).

Because the core is pure TS, the vast majority of correctness is covered by fast unit tests — Playwright only
guards the wiring and rendering.

### Continuous integration

Two GitHub Actions workflows, both using `pnpm` directly on the runner (no Docker — Colima/Docker is a local
concern only):

- **`ci.yml`** — on every PR and push to `main`: `pnpm install --frozen-lockfile` → `bin/lint` (eslint +
  `tsc --noEmit`) → `pnpm test` → `pnpm build`. This is the correctness/quality gate.
- **`deploy.yml`** — on push to `main`: static export with `PAGES=true` → publish to GitHub Pages.

Roadmap for CI as the project grows: add Playwright E2E (Phase 3) as a job, wire in test coverage reporting,
and (optionally) require the `check` job to pass before merge via branch protection.

---

## 8. Phased build plan

Mapped to Design Document §31, each phase with a concrete verify gate (per our goal-driven convention).

**Phase 0 — Scaffold** → *verify:* `bin/dev` serves a blank page at `localhost:3000` from inside the container;
`bin/test` runs an empty Vitest suite green; `ci.yml` and the Pages workflow build the blank page. ✅ done.

**Phase 1 — Core parser + scheduler (v0.1 engine)** → *verify:* unit tests pass for all §29 parsing cases and
the five canonical expressions produce correct next-run instants in UTC and `Asia/Kolkata`.

**Phase 2 — Translator + field breakdown** → *verify:* snapshot tests match the design's example translations
(§12) and breakdowns (§13).

**Phase 3 — UI wiring (v0.1 MVP)** → *verify:* Playwright drives paste→summary→runs→breakdown; empty/valid/
invalid/warning states (§25) render; keyboard-navigable (§19).

**Phase 4 — Warnings + DST surfacing** → *verify:* DOM+DOW OR warning, leap-year, "every minute", and DST
gap/transition notes appear for their trigger expressions (§16, §22).

**Phase 5 — Copy/share + custom start (v0.2)** → *verify:* share URL round-trips (`shareUrl` encode/decode
unit test); copy actions produce expected text/Markdown; custom start time changes the run list.

Dialects beyond standard-5-field (v0.3+) are deferred, but `dialects.ts` is structured as a registry from day
one so adding them doesn't touch the parser core.

---

## 9. Open questions carried from the design (§32) — MVP answers we're building to

1. **5-field only** for MVP.
2. Accept **both `0` and `7`** as Sunday.
3. **OR** matching for DOM/DOW, documented, with a warning when both are restricted.
4. DST: **show warnings, skip non-existent local times**, make behavior explicit.
5. Share links **encode the expression in the URL**, only on explicit Share click.
6. **Defer** platform presets.
7. **Run entirely client-side.**
