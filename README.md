# Campaign Settings

**A self-hosted campaign bible for a D&D 5e homebrew world** — spells, magic items, NPCs, deities and an interactive map, in one searchable dashboard instead of six drifting Google Docs.

Built with the Next.js App Router, Server Components for reads and Server Actions for writes. Its distinguishing idea is a **metadata layer**: each of the 39 domain fields is declared exactly once, and that single declaration drives the form control, the list column, the filter, the Zod validation and the Prisma `where` clause. Adding a field is one object, not five edits across five files.

> **Status:** working prototype, actively being hardened. Phase 1 — auth guards, input validation, a real test suite, CI, reproducible builds — has landed, and most of Phase 2 with it: the metadata layer is typed, the duplicated per-domain components are collapsed, lint is at zero warnings, and the identifier rename is done. Coverage is deliberately still low and ratcheting upward. See [Project status](#project-status).
>
> **The interface is deliberately unstyled.** Effort is going into correctness first — nothing can be written without a session, no invalid payload reaches the database, and every change lands behind a green pipeline. The visual layer is scheduled after the foundations, not before, which is why there are no screenshots here yet.

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
  metaField: "level",
  label: "Livello",          // identifiers English, UI copy Italian — ADR-0005
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
| Database   | PostgreSQL 16 + Prisma 7 | Array columns (`circle`, `classes`) map cleanly; the driver adapter keeps the client edge-compatible                                             |
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

- **`db push` or `prisma migrate deploy` — both work now.** The four committed migrations reproduce the schema exactly (`prisma migrate diff` reports no difference), so either path gives you a correct database. `db push` stays the quickstart default because it is one step and needs no migration history; CI uses `migrate deploy`. If you switch an existing `db push` database over to migrations, baseline it first with `prisma migrate resolve --applied`, or `deploy` will try to re-create tables that already exist.
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

---

## Testing

**173 unit tests across 19 files (~3.5s) and 40 Playwright tests in 10 files.** The suite concentrates on the parts where a silent failure would be expensive, rather than chasing a coverage number:

- **Query construction** — `getQuery` is a pure function from search params to a Prisma query, so it is covered exhaustively without a database. Its tests were mutation-checked: breaking `hasSome`, the pagination offset and case-insensitivity each turned the suite red.
- **Auth guards** — every DELETE endpoint returns 401 and every mutation throws, without a session, with no query reaching the database.
- **Input validation** — invalid payloads are rejected with field-keyed errors and never written; a payload of every field's declared default is proven to pass its schema.

- **Critical flows, end to end** — login, the CRUD round trip for two domains, filtering, pagination arithmetic, the map, and an axe accessibility scan. Written to be independent of how much data exists, so the same specs run against the demo seed and against a 361-spell library. They earn their keep: the first green run found a component effect that was silently filtering the spell list.

Line coverage is **22%**, enforced in CI as a ratchet that only moves up. That number is low and honestly reported: it reflects a suite covering the risky core and not yet the UI.

CI runs lint + typecheck + formatting, the unit suite against a real Postgres, a production build, and the Playwright suite — five blocking gates on every pull request.

### Loading a campaign library

`pnpm db:seed` installs a handful of demo records. To work with a real library, export it as JSON and load it:

```bash
pnpm db:import ~/path/to/export.json --dry-run   # validate, write nothing
pnpm db:import ~/path/to/export.json
```

Every record is checked against the same Zod validators the app's own mutations use, and records are matched by name, so re-importing updates rather than duplicates. Export files are gitignored by design — campaign content belongs to whoever wrote it.

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
| [`TECH_DEBT.md`](./docs/TECH_DEBT.md)         | Prioritised debt register, 33 items        |
| [`TESTING.md`](./docs/TESTING.md)             | Test strategy and coverage targets         |
| [`ROADMAP.md`](./docs/ROADMAP.md)             | Phased plan and feature backlog            |
| [`adr/`](./docs/adr/)                         | Six decision records                       |

---

## Project status

Phase 1 — correctness and safety — is complete. Phase 2 is most of the way there:

|     | Phase 1                                                              |
| --- | -------------------------------------------------------------------- |
| ✅  | Dead code removed, TypeScript errors cleared, ESLint + Prettier + CI |
| ✅  | Jest → Vitest, a suite that actually runs                            |
| ✅  | Auth guards on every write path, with tests                          |
| ✅  | Zod validation wired from the metadata, with tests                   |
| ✅  | Pinned versions, one lockfile, Turbopack builds                      |
| ✅  | Playwright E2E — 40 tests, blocking in CI as the fifth gate          |

|     | Phase 2                                                                     |
| --- | --------------------------------------------------------------------------- |
| ✅  | `PageMeta` a discriminated union; zero `any`, the rule enforced as an error |
| ✅  | Per-domain component quartets collapsed into `Entity*` + config             |
| ✅  | Typed error hierarchy, correct status codes, toasts instead of `alert()`    |
| ✅  | Lint 293 warnings → 0; every rule back to `error`                           |
| ✅  | Accessibility: zero axe violations across eleven pages, keyboard focus ring |
| ✅  | Identifiers renamed to English; columns kept via `@map`                     |
| ⏳  | Bilingual UI (it + en) — the last 🟠 item                                   |

Next: the bilingual UI (TD-21), the residual identifier rename TD-19 missed (TD-33), and the remaining trust boundaries (TD-02b). The full plan is in [`ROADMAP.md`](./docs/ROADMAP.md); everything known to be wrong is written down in [`TECH_DEBT.md`](./docs/TECH_DEBT.md) rather than left to be discovered.
