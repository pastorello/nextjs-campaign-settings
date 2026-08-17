# Campaign Settings

A self-hosted Next.js app for managing a D&D 5e homebrew campaign setting — spells, magic items, NPCs, deities, and an interactive world map — for a single DM.

Its core idea is a **metadata layer**: each domain field is declared once (type, label, control, validator) and that single declaration drives the form, the list column, the filter and the Prisma query. See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and [ADR-0003](./docs/adr/0003-metadata-driven-domain-configuration.md) for how.

---

## Tech stack

| Layer      | Choice                               | Why                                                                                                                                              |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework  | Next.js 16 (App Router)              | Server Components keep database access on the server with no API layer to maintain ([ADR-0004](./docs/adr/0004-server-actions-over-rest-api.md)) |
| Language   | TypeScript 5.9, `strict`             | The metadata layer is the kind of abstraction that only pays off if the compiler checks it                                                       |
| Database   | PostgreSQL 16 + Prisma 7             | Array columns (`circle`, `classes`) map cleanly; the driver adapter keeps the client edge-compatible                                             |
| Auth       | NextAuth v5 + bcrypt                 | Credentials only — this is a single-DM tool, not a SaaS                                                                                          |
| Validation | Zod 4                                | Declared per field, so validation composes from metadata instead of being written twice                                                          |
| Styling    | Tailwind CSS v4                      | Utility classes keep styling next to markup in a project with no design system                                                                   |
| Maps       | Leaflet                              | Self-hosted tiles, no API key, no vendor account                                                                                                 |
| Tests      | Vitest + Testing Library, Playwright | Native ESM/TS unit suite + E2E — see [`docs/TESTING.md`](./docs/TESTING.md)                                                                      |

Framework versions are pinned exactly and pnpm is the only package manager — a clone in six months resolves the same tree.

---

## Quickstart

### Requirements

- Node.js >= 22
- pnpm — the version is pinned in `package.json`'s `packageManager` field; run `corepack enable` once and it is picked up automatically
- Docker, for Postgres

### 1. Install

```bash
pnpm install
```

### 2. Configure

Copy `.env.example` to `.env` and edit the values:

```bash
cp .env.example .env
```

Then generate a strong `AUTH_SECRET`:

```bash
pnpm dlx auth secret
```

This command will replace the placeholder in `.env` with a cryptographically secure value.

### 3. Start the database

```bash
docker-compose up -d
```

### 4. Create the schema and seed it

```bash
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed
```

Two things worth knowing here:

- **Use `prisma migrate deploy` — not `db push`.** Some migrations embed data (the `faction` table is seeded by `20260806220000_add_faction_table_and_fk` via raw SQL), which `db push` skips. The seed script then fails on foreign key constraints. `prisma migrate deploy` applies both schema and migration-embedded data correctly.
- **The seed is safe to re-run.** It matches existing records by name (and users by email) before creating, so a second run creates nothing rather than duplicating. It does _not_ insert explicit ids — the database assigns them, exactly as it does for a record created through the UI.

### 5. Run it

```bash
pnpm dev
```

---

## Commands

```bash
pnpm dev            # dev server (Turbopack)
pnpm build          # production build
pnpm typecheck      # next typegen && tsc --noEmit
pnpm lint           # eslint .
pnpm format:check   # prettier --check .
pnpm test           # vitest run
pnpm test:coverage  # vitest run --coverage
pnpm test:e2e       # playwright test
pnpm test:e2e:ui    # playwright test --ui
pnpm db:seed        # seed demo data
pnpm db:import FILE # load a campaign library export (see below)
pnpm db:studio      # Prisma Studio
```

### Loading a campaign library

`pnpm db:seed` installs a handful of demo records. To work with a real library, export it as JSON and load it:

```bash
pnpm db:import ~/path/to/export.json --dry-run   # validate, write nothing
pnpm db:import ~/path/to/export.json
```

Every record is checked against the same Zod validators the app's own mutations use, and records are matched by name, so re-importing updates rather than duplicates. Export files are gitignored by design — campaign content belongs to whoever wrote it.

---

## Layout

```
app/
├── api/            route handlers — 4 DELETE, 2 read-only GeoJSON, 2 map image
├── [locale]/       authenticated pages under dashboard/, one route per domain
├── lib/
│   ├── config/     ← field metadata: start here
│   ├── data/       data access, one function per file
│   ├── auth/       requireSession / requireApiSession guards
│   └── hooks/      list state: filters, sorting, pagination
├── modules/maps/   self-contained Leaflet module
└── ui/             components, one folder per domain
```

## Documentation

| Document                                           | What it covers                             |
| -------------------------------------------------- | ------------------------------------------ |
| [`CLAUDE.md`](./CLAUDE.md)                         | Conventions and rules for AI-assisted work |
| [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md) | Inventory and current health               |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)   | How the pieces fit, and where they diverge |
| [`docs/TECH_DEBT.md`](./docs/TECH_DEBT.md)         | Debt register — summary + open items       |
| [`docs/TESTING.md`](./docs/TESTING.md)             | Test strategy and coverage targets         |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md)             | Phased plan and feature backlog            |
| [`docs/adr/`](./docs/adr/)                         | Architecture decision records              |

`docs/README.md` explains how these fit together and links the rest (specs, domain notes).
