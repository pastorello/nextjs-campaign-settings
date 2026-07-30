# Project State — Campaign Settings

**Last updated:** 2026-07-30
**Status:** Working prototype, not production-ready
**Goal of the current phase:** make the project portfolio-grade — no bugs, no dead code, tested, documented, CI-verified. Feature expansion comes after.

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

**Identifiers are English; user-facing copy is Italian.** See [ADR-0005](./adr/0005-english-identifiers.md), implemented as [TD-19](./TECH_DEBT.md) on 2026-07-30. Postgres columns keep their Italian names, decoupled from the code by Prisma `@map` (`name @map("nome")`) — so raw SQL and `psql` still show `nome`, `descrizione`, `livello`.

> **This section used to say the opposite,** and the correction is worth keeping.
> It read: _"The domain vocabulary is **intentionally Italian**… a deliberate
> choice, not an inconsistency to fix."_ ADR-0005 explicitly supersedes that
> sentence — the mixture "was not [deliberate], it was inferred from the code and
> recorded as intent in error". The stale version survived here for eight days
> after the ADR was accepted, telling anyone who started a session from this file
> not to fix the exact thing the ADR mandates fixing.
>
> Residual Italian identifiers do still exist — 16 of them, tracked as
> [TD-33](./TECH_DEBT.md). They are unfinished work under ADR-0005, **not**
> a surviving deliberate choice.

---

## 2. Stack

| Layer         | Technology                                                            | Version                                              |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| Framework     | Next.js (App Router, RSC, Server Actions)                             | 16.2.11 — pinned exactly (TD-07)                     |
| Runtime       | React                                                                 | 19.2.8 — pinned exactly (TD-07)                      |
| Language      | TypeScript (`strict: true`)                                           | 5.9.3                                                |
| Database      | PostgreSQL via Docker Compose                                         | 5432                                                 |
| ORM           | Prisma with `@prisma/adapter-pg` driver adapter                       | 7.1.0                                                |
| Auth          | NextAuth v5 (beta) — Credentials provider + bcrypt                    | 5.0.0-beta.30                                        |
| Styling       | Tailwind CSS v4 + `@tailwindcss/forms`                                | 4.1.18                                               |
| UI primitives | Radix UI, Headless UI, Heroicons, Lucide, Framer Motion, Vaul, Sonner | —                                                    |
| Maps          | Leaflet + custom hook layer                                           | 1.9.4                                                |
| Validation    | Zod                                                                   | 4.2.0                                                |
| Tests         | Vitest + Testing Library · Playwright                                 | 173 unit tests ~3.5s · 40 E2E · 22% lines, ratcheted |

pnpm is the only package manager (TD-07): `package-lock.json` is gone, `packageManager` and `engines` are declared, and CI derives its pnpm version from that field rather than pinning its own.

---

## 3. Repository layout

```
.
├── app/
│   ├── api/                 # Route handlers: DELETE endpoints + countries GeoJSON search
│   ├── dashboard/           # Authenticated area
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
│   │   └── actions.ts       # authenticate() server action
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

Five Prisma models: `deities`, `magicitems`, `npc`, `spells`, `users`.

Seed data is four to six demo records per domain. A real library — 361 spells, 119 NPCs, 62 magic items — is loaded with `pnpm db:import <export.json>`; those exports are gitignored, because campaign content is the DM's and the spell prose is rulebook text.

Observations:

- ✅ `createdAt` / `updatedAt` on all five models (TD-11).
- No relations between models. Everything that is conceptually a foreign key (`faction`, `location`, `alignment`, `class`) is stored as a bare `Int` that indexes into a hardcoded TypeScript array. Renumbering an enum silently corrupts existing rows.
- ✅ `@@index([name])` on `deities`, `magicitems`, `npc`, `spells` (TD-11). `users` is indexed by its unique `email`.
- No ownership: records are not tied to a user or a campaign. Multi-campaign support (which you have in mind for later) requires a schema change.
- Four migrations: `resetio`, a 2026-07-26 corrective one patching its drift forward (TD-23), the timestamps-and-indexes one (TD-11), and `20260730020000_rename_png_table_to_npc` (TD-19 — `@map` retargets a field, but renaming a _model_ renames the table, so this one was hand-written to avoid dropping 119 rows). `prisma migrate diff` against the schema is clean. The original drift was wider than a name-level comparison suggested — eight `deities` columns were `VARCHAR(255)` where the schema says `Int`.

---

## 5. Auth and access control

- NextAuth v5 Credentials provider, bcrypt-hashed passwords in the `users` table.
- `proxy.ts` (Next.js 16's renamed middleware) matches everything except `api`, `_next/static`, `_next/image`, `favicon.ico` and `.png` files.
- The `authorized` callback returns `true` if logged in, `false` otherwise, for **every** matched route.

The matcher excludes `/api`, so the proxy cannot protect the route handlers or Server Actions. TD-01 closed that gap at the boundary instead: the four DELETE handlers call `requireApiSession()` (401 without a session) and the eight `create*` / `update*` mutations call `requireSession()` (throws `UnauthorizedError`), each with tests. What remains open is **authorisation**, not authentication: every logged-in user can still edit everything, with no per-record or per-campaign ownership. Acceptable for a single-DM tool; a prerequisite for multi-campaign.

---

## 6. Current health

| Check               | Result                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| `pnpm typecheck`    | ✅ **0 errors** (19 before TD-06; `next typegen && tsc --noEmit`)                |
| `pnpm build`        | ✅ **Passes** on Turbopack — same bundler as `dev` (TD-18)                       |
| `pnpm test`         | ✅ **173 passed** across 19 files in ~3.5s (Vitest)                              |
| `pnpm lint`         | ✅ **0 errors, 0 warnings** (was 293) — TD-22 closed; every rule back to `error` |
| `pnpm format:check` | ✅ Clean — Prettier applied repo-wide (TD-05/TD-16)                              |
| E2E tests           | ✅ **40 Playwright tests** in 10 files, nothing skipped; TD-24 then TD-15        |
| CI                  | ✅ All five gates blocking: `static` / `test` / `build` / `e2e` (TD-23 closed)   |
| Test coverage       | 22.1% lines / 15.4% branches / 21.8% statements — thresholds at 22/18/15/21      |
| Git history         | Active — PRs #1–#47 merged on `main`                                             |
| `.env`              | ✅ Correctly gitignored                                                          |
| `.DS_Store`         | ✅ Present on disk but untracked — `.gitignore` is working                       |

TD-04 closed the remaining nine on 2026-07-22. Note that `typecheck` must run `next typegen` first: the route-handler signatures live in generated types that a fresh checkout does not have, so a bare `tsc --noEmit` passes vacuously.

**A local trap, found 2026-07-25.** An agent worktree left behind in `.claude/worktrees/<name>/` is a _complete second checkout of this repo_. It is git-ignored, so `git status` stays clean and nothing hints at it — but ESLint and Vitest walk the filesystem, not the index. The effect is that `pnpm lint` reported 2213 errors from a copy nobody was editing and exited non-zero, while `pnpm test` ran every suite twice (117 tests read as 228) and coverage read 30% instead of 18.7%. Both configs now ignore `.claude/**`; the numbers in the table above are the deduplicated ones. CI never saw any of this — it checks out clean — which is exactly what made the local figures look like progress. (The figures in this paragraph are the 2026-07-25 measurements, when the suite was 117 tests; the ignores have held since.)

**There is one on disk right now:** `.claude/worktrees/vigilant-engelbart-e0d007/`, a detached-HEAD checkout at `f9620c4` carrying its own older copy of every file in `docs/`. Harmless to the runners, but `grep` across the repo returns each hit twice, and the stale `TECH_DEBT.md` inside it is 849 lines against this one's 1400+. Remove it with `git worktree remove` when the session that made it is finished.

---

## 7. Dead code inventory

**Cleared by TD-06 on 2026-07-22.** Deleted: `app/ui/components/Header.tsx`, `app/ui/components/NotificationBar.tsx`, `app/ui/forms/PngForm.tsx`, `app/ui/forms/SpellForm.tsx`, `app/lib/connections/sql.ts`, `app/lib/utils.ts` and `app/lib/data.ts`. The two survivors of those last two files moved to their conventional homes (`app/lib/utils/data/generatePagination.ts`, `app/lib/data/fetchCardData.ts`). The `postgres` and `@wordpress/html-entities` packages were uninstalled, and the stray `SpellMetaField;` statement in `createSpell.ts` is gone. `auth.ts` and `fetchCardData` now read through Prisma, so `DATABASE_URL` is the only connection string the app needs.

**Nothing is outstanding here.** Both items this section used to list are closed:

- ✅ `copy-webpack-plugin` and the `webpack` hook are gone from `next.config.ts` — which is now four lines, `reactStrictMode` only — and the plugin is not in `package.json`. `pnpm build` passes on Turbopack (TD-18). This section claimed the hook made the build "fail outright" for three days after §6 above recorded the build as passing; the two statements sat in the same document.
- ✅ `sendNotification.ts` is deleted, along with the whole `app/lib/actions/notifications/` directory. TD-10 split it by audience, which was the actual bug: `app/lib/notifications/notify.ts` raises a sonner toast for the user, `logServerIssue.ts` writes to the server console and does not pretend to be a notification. No `alert()` remains anywhere in `app/`.

Two things are deliberately kept despite having no importers, and must survive a cleanup pass — see CLAUDE.md, _Decisions and rejected approaches_:

- `app/lib/definitions/enums/deities/Circolo.ts` — 23 thematic magic circles from the setting's original design, which the DM intends to revisit.
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
