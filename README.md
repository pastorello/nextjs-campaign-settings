# Campaign Settings

**A self-hosted campaign bible for a D&D 5e homebrew world** — spells, magic items, NPCs, deities and an interactive map, in one searchable dashboard instead of six drifting Google Docs.

Built with the Next.js App Router, Server Components for reads and Server Actions for writes. Its distinguishing idea is a **metadata layer**: each of the 41 domain fields is declared exactly once, and that single declaration drives the form control, the list column, the filter, the Zod validation and the Prisma `where` clause. Adding a field is one object, not five edits across five files.

> **Status:** working prototype, actively being hardened. Phase 1 — auth guards, input validation, a real test suite, CI, reproducible builds — has landed. Coverage is deliberately still low and ratcheting upward. See [Project status](#project-status).

---

## Screenshots

<!-- Add the three images described in docs/screenshots/README.md, then delete this comment. -->

| Spell list  | Metadata-driven form | World map   |
| ----------- | -------------------- | ----------- |
| _(pending)_ | _(pending)_          | _(pending)_ |

---

## What it does

- **Five domains.** Spells (level, school, classes, casting time, range, duration), magic items (rarity, type, attunement), NPCs (alignment, faction, location, appearance, motivations, secrets), deities (rank, tarot card, celestial body, element, tradition) and geography.
- **Filter, sort and paginate** every list, with the state held in the URL so a filtered view is shareable and survives a reload.
- **Create and edit** through forms generated from field metadata rather than hand-written per domain.
- **An interactive world map** (Leaflet): custom tile sets, POI placement with a details panel, distance measurement, search, a light/dark switcher and its own error boundary.
- **Single-user auth** — credentials with bcrypt hashes; every write path verifies a session.

The interface is in Italian, matching the campaign material it holds. Identifiers and documentation are English; a bilingual UI is planned ([ADR-0006](./docs/adr/0006-bilingual-ui.md)).

---

## The metadata layer

The part worth reading the source for. One declaration per field:

```ts
{
  metaField: "livello",
  label: "Livello",
  defaultValue: 0,
  fieldType: FieldType.integer,
  controlType: ControlType.Select,
  options: levels,
  validator: z.number().int(),
  getDatum: (datum) => getDataLabel(levels, datum),
}
```

From that one object the app derives:

| Consumer       | What it takes                                     |
| -------------- | ------------------------------------------------- |
| Form rendering | `controlType`, `label`, `placeholder`, `options`  |
| List columns   | `label`, sort behaviour                           |
| Filters        | `fieldType`, `options`                            |
| Query building | `fieldType` → `hasSome` for arrays, else equality |
| **Validation** | `validator`, composed per entity on every write   |
| Value display  | `getDatum`                                        |

`buildCreateSchema(PageType.Spell)` composes the declared validators into one Zod schema; the mutation `safeParse`s before Prisma sees anything, and returns field-keyed errors the form renders inline.

Full write-up in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and [ADR-0003](./docs/adr/0003-metadata-driven-domain-configuration.md).

---

## Tech stack

| Layer      | Choice                   | Why                                                                                                                                              |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework  | Next.js 16 (App Router)  | Server Components keep database access on the server with no API layer to maintain ([ADR-0004](./docs/adr/0004-server-actions-over-rest-api.md)) |
| Language   | TypeScript 5.9, `strict` | The metadata layer is the kind of abstraction that only pays off if the compiler checks it                                                       |
| Database   | PostgreSQL 16 + Prisma 7 | Array columns (`circolo`, `classi`) map cleanly; the driver adapter keeps the client edge-compatible                                             |
| Auth       | NextAuth v5 + bcrypt     | Credentials only — this is a single-DM tool, not a SaaS                                                                                          |
| Validation | Zod 4                    | Already declared per field, so validation composes from metadata instead of being written twice                                                  |
| Styling    | Tailwind CSS v4          | Utility classes keep styling next to markup in a project with no design system                                                                   |
| Maps       | Leaflet                  | Self-hosted tiles, no API key, no vendor account                                                                                                 |
| Tests      | Vitest + Testing Library | Native ESM/TS, materially faster than the Jest setup it replaced ([ADR-0002](./docs/adr/0002-testing-stack.md))                                  |

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

Create a `.env` in the project root:

```
POSTGRES_DB=your_db_name
POSTGRES_USER=your_admin_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5432
AUTH_SECRET=your-secret-key

DATABASE_URL="postgresql://your_admin_user:your_secure_password@localhost:5432/your_db_name"
```

Generate `AUTH_SECRET` with:

```bash
pnpm dlx auth secret
```

### 3. Start the database

```bash
docker-compose up -d
```

### 4. Create the schema and seed it

```bash
pnpm prisma generate
pnpm prisma db push
pnpm db:seed
```

Two things worth knowing here:

- **`db push`, not `prisma migrate deploy`.** The committed migration has drifted from the schema and is scheduled for regeneration (TD-23 in [`docs/TECH_DEBT.md`](./docs/TECH_DEBT.md)). `db push` syncs the schema directly and is the supported path today.
- **The seed is safe to re-run.** Its records carry explicit ids, so rows that already exist are skipped rather than duplicated.

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
pnpm db:seed        # seed initial data
pnpm db:studio      # Prisma Studio
```

---

## Testing

**111 tests across 11 files, ~2s.** The suite concentrates on the parts where a silent failure would be expensive, rather than chasing a coverage number:

- **Query construction** — `getQuery` is a pure function from search params to a Prisma query, so it is covered exhaustively without a database. Its tests were mutation-checked: breaking `hasSome`, the pagination offset and case-insensitivity each turned the suite red.
- **Auth guards** — every DELETE endpoint returns 401 and every mutation throws, without a session, with no query reaching the database.
- **Input validation** — invalid payloads are rejected with field-keyed errors and never written; a payload of every field's declared default is proven to pass its schema.

Line coverage is **18%**, enforced in CI as a ratchet that only moves up. That number is low and honestly reported: it reflects a suite covering the risky core and not yet the UI. End-to-end tests (Playwright) are specified in [`docs/TESTING.md`](./docs/TESTING.md) but **not yet written** — the CI job for them exists and is deliberately non-blocking until it is real.

CI runs lint + typecheck + formatting, the test suite against a real Postgres, and a production build, on every pull request.

---

## Architecture

```
app/
├── api/            route handlers — 4 DELETE endpoints + read-only GeoJSON
├── dashboard/      authenticated pages, one route per domain
├── lib/
│   ├── config/     ← field metadata: start here
│   ├── data/       data access, one function per file
│   ├── auth/       requireSession / requireApiSession guards
│   └── hooks/      list state: filters, sorting, pagination
├── modules/maps/   self-contained Leaflet module
└── ui/             components, one folder per domain
```

| Document                                      | What it covers                             |
| --------------------------------------------- | ------------------------------------------ |
| [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md)   | How the pieces fit, and where they diverge |
| [`PROJECT_STATE.md`](./docs/PROJECT_STATE.md) | Inventory and current health               |
| [`TECH_DEBT.md`](./docs/TECH_DEBT.md)         | Prioritised debt register, 25 items        |
| [`TESTING.md`](./docs/TESTING.md)             | Test strategy and coverage targets         |
| [`ROADMAP.md`](./docs/ROADMAP.md)             | Phased plan and feature backlog            |
| [`adr/`](./docs/adr/)                         | Six decision records                       |

---

## Project status

Phase 1 — correctness and safety — is complete apart from the E2E layer:

|     |                                                                      |
| --- | -------------------------------------------------------------------- |
| ✅  | Dead code removed, TypeScript errors cleared, ESLint + Prettier + CI |
| ✅  | Jest → Vitest, a suite that actually runs                            |
| ✅  | Auth guards on every write path, with tests                          |
| ✅  | Zod validation wired from the metadata, with tests                   |
| ✅  | Pinned versions, one lockfile, Turbopack builds                      |
| ⏳  | Playwright E2E — specified, not yet written                          |

Next: typing the metadata layer as a discriminated union, an English identifier rename, and the bilingual UI. The full plan is in [`ROADMAP.md`](./docs/ROADMAP.md); everything known to be wrong is written down in [`TECH_DEBT.md`](./docs/TECH_DEBT.md) rather than left to be discovered.
