# CronLens

**Paste a cron expression and see exactly when it runs.**

🔗 **Live:** https://bhupendranegi.github.io/CronLens/

CronLens is a lightweight, developer-focused cron expression visualizer. Paste a
cron string and instantly get a plain-English summary, the next N run times
(timezone- and DST-aware), a field-by-field breakdown, and warnings for
expressions that are valid but surprising.

- **No accounts, nothing to install.**
- **Nothing leaves your browser** — parsing, scheduling, and translation all run
  client-side.
- 5-field, 6-field (seconds), and Quartz dialects; nicknames like `@daily`.
- Shareable via URL params; copy results as text or Markdown.

**Stack:** Next.js (App Router, TypeScript) · Tailwind CSS · static export to
**GitHub Pages**. Developed inside a dedicated Colima/Docker profile.

## Quick start (local)

No host Node/pnpm needed — everything runs in the container.

```bash
bin/setup     # one-time: Colima 'cronlens' profile, dev image, lockfile
bin/dev       # dev server (Ctrl-C tears the container down); auto-picks a free port
bin/test      # vitest suite
bin/lint      # eslint + typecheck
```

`bin/dev` prints the URL (defaults to http://localhost:3000).

## Deployment

Pushes to `main` build a static export and publish it to GitHub Pages. See
**[docs/deployment.md](docs/deployment.md)** for the full flow, commands, and
troubleshooting.

## Documentation

| Doc | What's in it |
|---|---|
| [docs/Design Document.md](docs/Design%20Document.md) | Product spec: goals, cron support, timezone/DST behavior, data model, edge cases, non-goals |
| [docs/Architecture.md](docs/Architecture.md) | Stack, module layout, local dev, and the phased build plan |
| [docs/deployment.md](docs/deployment.md) | How deployment works: pipeline diagrams, commands, troubleshooting |
| [docs/Progress.md](docs/Progress.md) | Build log, decisions, and per-phase status |
