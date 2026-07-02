# CronLens

**Paste a cron expression and see exactly when it runs.**

CronLens is a lightweight, developer-focused cron expression visualizer. Paste a
5-field cron string and instantly get a plain-English summary, the next N run
times (timezone- and DST-aware), a field-by-field breakdown, and warnings for
expressions that are valid but surprising.

- **No accounts, nothing to install.**
- **Nothing leaves your browser** — parsing, scheduling, and translation all run
  client-side.
- Shareable via URL params; copy results as text or Markdown.

**Stack:** Next.js (App Router, TypeScript) · Tailwind CSS · static export.
Deployed to **GitHub Pages**; developed inside a dedicated Colima/Docker profile.

## Quick start (local)

```bash
bin/setup     # one-time: Colima 'cronlens' profile, dev image, lockfile
bin/dev       # start the dev server; Ctrl-C tears the container down
```

Then open the printed URL (defaults to http://localhost:3000; `bin/dev`
auto-bumps to the next free port if 3000 is taken). No host Node/pnpm needed —
everything runs in the container.

```bash
bin/test      # run the vitest suite
bin/lint      # eslint + typecheck
```

## Deploy (GitHub Pages)

Pushes to `main` trigger [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the static export (`PAGES=true pnpm build`) and publishes it. Enable
**Settings → Pages → Source: GitHub Actions** once, and the site serves from
`https://<user>.github.io/CronLens/`. A custom domain removes the `/CronLens`
base path — see [docs/Architecture.md §6](docs/Architecture.md).

## Documentation

| Doc | What's in it |
|---|---|
| [docs/Design Document.md](docs/Design%20Document.md) | Product spec: goals, cron support, timezone/DST behavior, data model, edge cases |
| [docs/Architecture.md](docs/Architecture.md) | Stack, module layout, local dev, deployment, phased build plan |
| [docs/Progress.md](docs/Progress.md) | Build log, decisions, and per-phase status |

## Out of scope (v1)

Executing jobs, storing schedules, user accounts, monitoring/alerting, and full
support for every cron dialect. Dialects beyond standard 5-field (6-field, Quartz,
AWS EventBridge, …) come later behind a dialect registry.
