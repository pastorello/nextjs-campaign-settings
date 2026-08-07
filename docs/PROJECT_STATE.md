# Project State — Campaign Settings

**Last updated:** 2026-08-08
**Status:** Working prototype, not production-ready
**Phase:** 3 (data model and relations) — Phases 1 and 2 are complete; see [`ROADMAP.md`](./ROADMAP.md)
**Goal of the current phase:** entities reference each other instead of being isolated lists — the world tree, real relations, locations and factions the DM authors rather than edits into source. See [SPEC-004](./specs/004-world-model.md) and [SPEC-006](./specs/006-table-backed-options.md).

**The standing goal underneath every phase** is unchanged: keep the project sustainable to work on — no bugs, no dead code, tested, documented, CI-verified, organised so a future session (human or agent) picks it up cheaply. Phases 1 and 2 established that; Phase 3 builds on it without regressing it (see `ROADMAP.md`, "Phases close; they do not stay closed").

---

## 1. What this project is

A self-hosted web app for a Dungeon Master to manage a D&D 5e campaign setting: the reference material of a homebrew world. It is a CRUD dashboard over five domains:

| Domain      | Name in code | Description                                                                                    |
| ----------- | ------------ | ---------------------------------------------------------------------------------------------- |
| Spells      | `spells`     | Spell compendium with level, subclasses (`circle`), classes, casting time, range, duration     |
| Magic items | `magicitems` | Items with rarity, type, attunement flag                                                       |
| NPCs        | `npc`        | Name, title, role, alignment, faction, location, appearance, personality, motivations, secrets |
| Deities     | `deities`    | Patrons with rank, tarot card, celestial body, element, tradition, alignment, divine residence |
| Geography   | `geography`  | Interactive world map (Leaflet) with POIs, measurement, tile switching                         |

**Identifiers are English; the UI ships bilingual (Italian + English).** See [ADR-0005](./adr/0005-english-identifiers.md), implemented as TD-19 on 2026-07-30, and [ADR-0006](./adr/0006-bilingual-ui.md), implemented as TD-21 — copy lives in `messages/{it,en}.json`, not in JSX. Postgres columns keep their Italian names, decoupled from the code by Prisma `@map` (`name @map("nome")`) — so raw SQL and `psql` still show `nome`, `descrizione`, `livello`.

> **This section used to say the opposite,** and the correction is worth keeping.
> It read: _"The domain vocabulary is **intentionally Italian**… a deliberate
> choice, not an inconsistency to fix."_ ADR-0005 explicitly supersedes that
> sentence — the mixture "was not [deliberate], it was inferred from the code and
> recorded as intent in error". The stale version survived here for eight days
> after the ADR was accepted, telling anyone who started a session from this file
> not to fix the exact thing the ADR mandates fixing.
>
> The 16 residual Italian identifiers this note used to track as open (TD-33)
> were finished on 2026-07-30. What remains Italian is deliberate and documented:
> Postgres column names, decoupled by `@map`, and the DM's own campaign content.

---

## 2. Stack

| Layer         | Technology                                                            | Version                                        |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| Framework     | Next.js (App Router, RSC, Server Actions)                             | 16.2.12 — pinned exactly (TD-07)               |
| Runtime       | React                                                                 | 19.2.8 — pinned exactly (TD-07)                |
| Language      | TypeScript (`strict: true`)                                           | 5.9.3                                          |
| Database      | PostgreSQL via Docker Compose                                         | 5432                                           |
| ORM           | Prisma with `@prisma/adapter-pg` driver adapter                       | 7.1.0                                          |
| Auth          | NextAuth v5 (beta) — Credentials provider + bcrypt                    | 5.0.0-beta.30                                  |
| Styling       | Tailwind CSS v4 + `@tailwindcss/forms`                                | 4.1.18                                         |
| UI primitives | Radix UI, Headless UI, Heroicons, Lucide, Framer Motion, Vaul, Sonner | —                                              |
| Maps          | Leaflet + custom hook layer                                           | 1.9.4                                          |
| Validation    | Zod                                                                   | 4.2.0                                          |
| Tests         | Vitest + Testing Library · Playwright                                 | see §6 — counts are derived, not recorded here |

pnpm is the only package manager (TD-07): `package-lock.json` is gone, `packageManager` and `engines` are declared, and CI derives its pnpm version from that field rather than pinning its own.

---

## 3. Repository layout

```
.
├── app/
│   ├── api/                 # Route handlers: 4 DELETE, 2 countries GeoJSON, 2 map-image (ADR-0008)
│   ├── [locale]/dashboard/  # Authenticated area (locale segment added by TD-21)
│   │   ├── (overview)/      # Landing cards
│   │   ├── admin/           # Create pages for each domain
│   │   ├── spells|magicitems|npc|deities|geography/
│   ├── lib/
│   │   ├── config/          # Per-domain field metadata (the "meta" system)
│   │   ├── connections/     # prisma.ts (singleton) — the only DB connection
│   │   ├── data/            # Data access: create/update/delete/fetch per domain
│   │   ├── definitions/     # enums / interfaces / types, one per file
│   │   ├── hooks/           # usePageManager (one, generic) + useFilterController
│   │   ├── utils/           # validators, data helpers
│   │   └── actions/
│   │       ├── authenticate.ts  # authenticate() server action
│   │       └── search/          # useClearSearchParams
│   ├── modules/maps/        # Self-contained Leaflet module (components/hooks/contexts/types)
│   ├── seed/                # Prisma seed + initial data
│   └── ui/                  # All presentational components
├── prisma/                  # schema.prisma + migrations
├── generated/prisma/        # Generated client (gitignored)
├── __test__/                # Vitest tests and Next mocks (getQuery suite lives in app/)
├── auth.ts, auth.config.ts, proxy.ts
└── docker-compose.yaml
```

### Architectural patterns already in place

**The "meta" system** is the most interesting idea in the codebase and its main differentiator. Each domain declares its fields once in `app/lib/config/<domain>/<domain>Meta.ts` (field type, label, control type, options). That single declaration drives:

- form rendering (`PageForm` → `InputComponent` → `Select`/`TextInput`/…)
- list columns and sorting
- filter controls
- Prisma `where` clause construction (`app/lib/data/getQuery.ts`)

This is a genuinely good pattern, and since TD-08 it is type-safe: `PageMeta` is a discriminated union on `fieldType`, the registry keys survive inference, the query layer is generic over the Prisma where type, and the `any` count is zero with `no-explicit-any` enforced as an error.

**One generic component per shape** (TD-09): `EntityList` for the admin tables, `EntityLibrary` for the public card lists, `EntityForm` for the shells, `usePageManager` for form state. Each is driven by a declaration in `app/lib/config/` — `listConfig`, `formFields` — rather than by four hand-written copies. The four per-domain quartets they replaced had silently diverged into real defects.

**The maps module** (`app/modules/maps/`) is cleanly separated with its own components, hooks, contexts, constants and types — including an error boundary and a `useSafeMapOperations` hook. It is the best-structured part of the codebase and should be the template for how other domains get refactored.

---

## 4. Data model

Seven Prisma models — the four domains plus `users`, and two added by the SPEC-004 map work: `poi` (the world tree) and `faction`. `grep "^model" prisma/schema.prisma` is the current list.

Seed data is four to six demo records per domain. A real library — 361 spells, 119 NPCs, 62 magic items — is loaded with `pnpm db:import <export.json>`; those exports are gitignored, because campaign content is the DM's and the spell prose is rulebook text.

Observations:

- ✅ `createdAt` / `updatedAt` on the four domain models (TD-11); `@@index([name])` on each (`users` is indexed by its unique `email`).
- **Relations exist now, in two places, and the rest is still bare `Int`s.** `poi.parentId` is a self-relation with `onDelete: Restrict` — the world tree ([ADR-0009](./adr/0009-world-tree-as-one-polymorphic-table.md)) — and `npc.faction` has a real foreign key to `faction`. Every other option-backed column (`alignment`, `rarity`, `class`, …) is still an `Int` indexing a hardcoded TypeScript array. Since TD-61 those are membership-validated at the Zod boundary, so a value outside the list is rejected rather than silently rendering as a blank cell; renumbering an array still repoints existing rows, and that has not changed.
- **`faction` is a table nothing reads.** SPEC-004 T1 shipped it and its foreign key; the UI still renders `factions.ts`'s static list beside it. Consuming it is [SPEC-006](./specs/006-table-backed-options.md).
- **No ownership**, and per [SPEC-004](./specs/004-world-model.md) §3 that is now a decision rather than a gap: a campaign is a story told inside the one universe, not a scoping boundary, so **no `campaignId` belongs on any entity**. (This section previously said multi-campaign support "requires a schema change" — it does not, because it is not being built that way.) What is genuinely still open is authorisation; see §5.
- Migrations: nine, listed by `ls prisma/migrations`. Two are worth knowing about — `20260730020000_rename_png_table_to_npc` (TD-19: `@map` retargets a field, but renaming a _model_ renames the table, so this was hand-written to avoid dropping 119 rows) and `20260806220000_add_faction_table_and_fk` (seeds `faction` with raw SQL, which is why `db push` cannot substitute for `migrate deploy` — TD-73).
- **The local dev database's migration history is broken**, and has been since before this file was written: two migrations are unapplied and `migrate dev`/`migrate deploy` both fail against it, so every schema change is hand-applied. Tracked as **TD-63**, still open.

---

## 5. Auth and access control

- NextAuth v5 Credentials provider, bcrypt-hashed passwords in the `users` table.
- `proxy.ts` (Next.js 16's renamed middleware) matches everything except `api`, `_next/static`, `_next/image`, `favicon.ico` and `.png`/`.jpg`/`.jpeg` files. The image exclusion is TD-36's fix — the gate was blocking Leaflet's own tile requests — and [ADR-0008](./adr/0008-map-image-storage.md) is why uploaded maps are served through an authenticated route handler instead of from `public/`: anything under `public/` would be readable by anyone with the URL, which is exactly what the DM does not want for a map of secret locations.
- The `authorized` callback returns `true` if logged in, `false` otherwise, for **every** matched route.

The matcher excludes `/api`, so the proxy cannot protect the route handlers or Server Actions. TD-01 closed that gap at the boundary instead: the four DELETE handlers call `requireApiSession()` (401 without a session) and the eight `create*` / `update*` mutations call `requireSession()` (throws `UnauthorizedError`), each with tests. What remains open is **authorisation**, not authentication: every logged-in user can still edit everything, with no per-record or per-campaign ownership. Acceptable for a single-DM tool; a prerequisite for multi-campaign.

---

## 6. Current health

**Every gate is green, and none of them is green by exception** — no skipped test, no disabled rule, no lowered threshold.

| Check               | State                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`    | ✅ clean (19 errors before TD-06)                                                                               |
| `pnpm build`        | ✅ passes on Turbopack — same bundler as `dev` (TD-18)                                                          |
| `pnpm test`         | ✅ all passing, nothing skipped                                                                                 |
| `pnpm lint`         | ✅ 0 errors, 0 warnings (was 293) — TD-22; every rule back to `error`, including `no-explicit-any`              |
| `pnpm format:check` | ✅ clean — Prettier repo-wide (TD-05/TD-16)                                                                     |
| `pnpm test:e2e`     | ✅ all passing, nothing skipped (TD-24, then TD-15's zero-violation axe gate)                                   |
| CI                  | ✅ five blocking gates: `static` / `test` / `build` / `e2e` (TD-23 made the last one blocking)                  |
| Coverage            | ✅ above the Phase 2 exit criterion; enforced as a CI ratchet, thresholds in `vitest.config.ts` — never lowered |
| `.env`              | ✅ gitignored                                                                                                   |

> **Counts deliberately are not written here.** This table used to carry "267 tests", "40 E2E", "27.6% lines" and "PRs #1–#61", every one of which was wrong within days — and a 2026-07-30 audit had already caught this same table claiming 117 tests against an actual 173. [`docs/README.md`](./README.md#keeping-them-honest) drew the conclusion: _counts and statuses rot; prose about why does not._ So the numbers now come from the commands that produce them:
>
> ```bash
> pnpm test 2>&1 | tail -4          # unit test and file counts
> pnpm test:e2e --list | tail -1    # E2E count, no database needed
> pnpm test:coverage                # current coverage against the ratchet
> ```

`typecheck` must run `next typegen` first: route-handler signatures live in generated types a fresh checkout does not have, so a bare `tsc --noEmit` passes vacuously. That is why the script is `next typegen && tsc --noEmit` and not just the latter.

**A local trap, found 2026-07-25 and still live.** An agent worktree left behind in `.claude/worktrees/<name>/` is a _complete second checkout of this repo_ — git-ignored, so `git status` stays clean and nothing hints at it, but ESLint and Vitest walk the filesystem rather than the index, so a leftover one gets collected too: double-counted tests, inflated coverage, thousands of duplicate lint findings, none of it visible in CI since CI checks out clean. Both configs now ignore `.claude/**`, which fixes the counts but not the trap itself — a finished worktree still needs `git worktree remove` by hand, and a stale one still doubles every `grep` hit across the repo.

---

## 7. Dead code inventory

**Cleared by TD-06 on 2026-07-22.** Deleted: `app/ui/components/Header.tsx`, `app/ui/components/NotificationBar.tsx`, `app/ui/forms/PngForm.tsx`, `app/ui/forms/SpellForm.tsx`, `app/lib/connections/sql.ts`, `app/lib/utils.ts` and `app/lib/data.ts`. The two survivors of those last two files moved to their conventional homes (`app/lib/utils/data/generatePagination.ts`, `app/lib/data/fetchCardData.ts`). The `postgres` and `@wordpress/html-entities` packages were uninstalled, and the stray `SpellMetaField;` statement in `createSpell.ts` is gone. `auth.ts` and `fetchCardData` now read through Prisma, so `DATABASE_URL` is the only connection string the app needs.

**Nothing is outstanding here.** Both items this section used to list are closed:

- ✅ `copy-webpack-plugin` and the `webpack` hook are gone from `next.config.ts` — which is now four lines, `reactStrictMode` only — and the plugin is not in `package.json`. `pnpm build` passes on Turbopack (TD-18). This section claimed the hook made the build "fail outright" for three days after §6 above recorded the build as passing; the two statements sat in the same document.
- ✅ `sendNotification.ts` is deleted, along with the whole `app/lib/actions/notifications/` directory. TD-10 split it by audience, which was the actual bug: `app/lib/notifications/notify.ts` raises a sonner toast for the user, `logServerIssue.ts` writes to the server console and does not pretend to be a notification. No `alert()` remains anywhere in `app/`.

Two things are deliberately kept despite having no importers, and must survive a cleanup pass — see CLAUDE.md, _Decisions and rejected approaches_:

- `app/lib/definitions/enums/deities/Circle.ts` — 23 thematic magic circles from the setting's original design, which the DM intends to revisit. (Named `Circolo.ts` until TD-33 renamed it; this line still said the old name until 2026-08-08.)
- `app/ui/components/Spinner.tsx` — a full-page framer-motion loader, orphaned when `BaseButton.buttonState` absorbed the inline save spinner. Reads as an intended `loading.tsx` affordance, not a leftover.

---

## 8. What is genuinely good

Worth saying explicitly, because the refactor should preserve these:

- The metadata-driven form/filter/query system is a real design idea, not boilerplate.
- `app/modules/maps/` is well-factored: separated hooks, contexts, error boundary, typed constants.
- One-concept-per-file discipline in `definitions/` and `data/` is consistent and easy to navigate.
- Prisma singleton correctly guards against hot-reload connection leaks.
- `loading.tsx`, `error.tsx`, `not-found.tsx` and `Suspense` boundaries are already used — the App Router idioms are understood.
- Skeleton components exist for loading states.

---

## 9. Related documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the pieces fit together
- [`TECH_DEBT.md`](./TECH_DEBT.md) — prioritised debt register
- [`TESTING.md`](./TESTING.md) — test strategy
- [`ROADMAP.md`](./ROADMAP.md) — phased plan and backlog
- [`adr/`](./adr/) — architecture decision records
- [`../CLAUDE.md`](../CLAUDE.md) — conventions for AI-assisted development
