# Project State — Campaign Settings

**Last updated:** 2026-07-22
**Status:** Working prototype, not production-ready
**Goal of the current phase:** make the project portfolio-grade — no bugs, no dead code, tested, documented, CI-verified. Feature expansion comes after.

---

## 1. What this project is

A self-hosted web app for a Dungeon Master to manage a D&D 5e campaign setting: the reference material of a homebrew world. It is a CRUD dashboard over five domains:

| Domain      | Italian name in code            | Description                                                                                    |
| ----------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Spells      | `spells` / incantesimi          | Spell compendium with level, school (`circolo`), classes, casting time, range, duration        |
| Magic items | `magicitems`                    | Items with rarity, type, attunement flag                                                       |
| NPCs        | `png` (personaggi non giocanti) | Name, title, role, alignment, faction, location, appearance, personality, motivations, secrets |
| Deities     | `deities` / patroni             | Patrons with rank, tarot card, celestial body, element, tradition, alignment, divine residence |
| Geography   | `geography`                     | Interactive world map (Leaflet) with POIs, measurement, tile switching                         |

The domain vocabulary is **intentionally Italian** (`incantesimi`, `patroni`, `fazioni`, `allineamento`). Documentation and commits are in English; domain terms stay Italian. This is a deliberate choice, not an inconsistency to fix.

---

## 2. Stack

| Layer         | Technology                                                            | Version                                                  |
| ------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| Framework     | Next.js (App Router, RSC, Server Actions)                             | `latest` ⚠️ unpinned                                     |
| Runtime       | React                                                                 | `latest` ⚠️ unpinned                                     |
| Language      | TypeScript (`strict: true`)                                           | 5.9.3                                                    |
| Database      | PostgreSQL via Docker Compose                                         | 5432                                                     |
| ORM           | Prisma with `@prisma/adapter-pg` driver adapter                       | 7.1.0                                                    |
| Auth          | NextAuth v5 (beta) — Credentials provider + bcrypt                    | 5.0.0-beta.30                                            |
| Styling       | Tailwind CSS v4 + `@tailwindcss/forms`                                | 4.1.18                                                   |
| UI primitives | Radix UI, Headless UI, Heroicons, Lucide, Framer Motion, Vaul, Sonner | —                                                        |
| Maps          | Leaflet + custom hook layer                                           | 1.9.4                                                    |
| Validation    | Zod                                                                   | 4.2.0                                                    |
| Tests         | Vitest + Testing Library                                              | 27 tests, ~1.5s, 14% line coverage enforced as a ratchet |

Two lockfiles are present (`package-lock.json` and `pnpm-lock.yaml`) and the README mixes `npm` and `pnpm` commands. Package manager must be settled on one.

---

## 3. Repository layout

```
.
├── app/
│   ├── api/                 # Route handlers: DELETE endpoints + countries GeoJSON search
│   ├── dashboard/           # Authenticated area
│   │   ├── (overview)/      # Landing cards
│   │   ├── admin/           # Create pages for each domain
│   │   ├── spells|magicitems|png|deities|geography/
│   ├── lib/
│   │   ├── config/          # Per-domain field metadata (the "meta" system)
│   │   ├── connections/     # prisma.ts (singleton) — the only DB connection
│   │   ├── data/            # Data access: create/update/delete/fetch per domain
│   │   ├── definitions/     # enums / interfaces / types, one per file
│   │   ├── hooks/           # usePageManager + per-domain page managers
│   │   ├── utils/           # validators, data helpers
│   │   └── actions.ts       # authenticate() server action
│   ├── modules/maps/        # Self-contained Leaflet module (components/hooks/contexts/types)
│   ├── seed/                # Prisma seed + initial data
│   └── ui/                  # All presentational components
├── prisma/                  # schema.prisma + one migration
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

This is a genuinely good pattern. It is currently under-documented and partially typed with `any`, which hides its value. Making it type-safe and documented is the single highest-leverage improvement for portfolio impact.

**Page manager hooks** (`usePageManager` + `useSpellPageManager` etc.) centralise list state: search params, filters, sorting, pagination.

**The maps module** (`app/modules/maps/`) is cleanly separated with its own components, hooks, contexts, constants and types — including an error boundary and a `useSafeMapOperations` hook. It is the best-structured part of the codebase and should be the template for how other domains get refactored.

---

## 4. Data model

Five Prisma models: `deities`, `magicitems`, `png`, `spells`, `users`.

Observations:

- No `createdAt` / `updatedAt` on any model.
- No relations between models. Everything that is conceptually a foreign key (`fazione`, `luogo`, `allineamento`, `classe`) is stored as a bare `Int` that indexes into a hardcoded TypeScript array. Renumbering an enum silently corrupts existing rows.
- No `@@index` anywhere, including on the `nome` columns that every list query filters and sorts by.
- No ownership: records are not tied to a user or a campaign. Multi-campaign support (which you have in mind for later) requires a schema change.
- Only one migration exists, named `resetio`, and it has drifted from the schema (missing `spells.nome`, plus three orphan tutorial tables) — see TD-23.

---

## 5. Auth and access control

- NextAuth v5 Credentials provider, bcrypt-hashed passwords in the `users` table.
- `proxy.ts` (Next.js 16's renamed middleware) matches everything except `api`, `_next/static`, `_next/image`, `favicon.ico` and `.png` files.
- The `authorized` callback returns `true` if logged in, `false` otherwise, for **every** matched route.

Two problems follow from this, both covered in `TECH_DEBT.md`:

1. The matcher excludes `/api`, and the API route handlers perform no auth check of their own. The DELETE endpoints are therefore **unauthenticated**.
2. Server Actions that mutate data (`createSpell`, `updateSpell`, …) never call `auth()`. Server Actions are POST endpoints reachable by any client; the proxy does not protect them.

---

## 6. Current health

| Check               | Result                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`    | ✅ **0 errors** (19 before TD-06; `next typegen && tsc --noEmit`)                                |
| `pnpm build`        | ✅ **Passes** on Turbopack — same bundler as `dev` (TD-18)                                       |
| `pnpm test`         | ✅ **27 passed** in ~1.5s (Vitest)                                                               |
| `pnpm lint`         | ✅ **0 errors**, 282 warnings — backlog tracked as TD-22                                         |
| `pnpm format:check` | ✅ Clean — Prettier applied repo-wide (TD-05/TD-16)                                              |
| E2E tests           | ❌ None — Playwright not installed; scheduled as TD-24, after TD-01/TD-02                        |
| CI                  | ⚠️ `static` / `test` / `build` green; `e2e` non-blocking (`continue-on-error`) until TD-24 lands |
| Test coverage       | 14% lines / 9% branches — thresholds set there and ratcheted upward                              |
| Git history         | Active — Phase 1 landed across PRs #1–#12 on `main`                                              |
| `.env`              | ✅ Correctly gitignored                                                                          |
| `.DS_Store`         | ✅ Present on disk but untracked — `.gitignore` is working                                       |

TD-04 closed the remaining nine on 2026-07-22. Note that `typecheck` must run `next typegen` first: the route-handler signatures live in generated types that a fresh checkout does not have, so a bare `tsc --noEmit` passes vacuously.

---

## 7. Dead code inventory

**Cleared by TD-06 on 2026-07-22.** Deleted: `app/ui/components/Header.tsx`, `app/ui/components/NotificationBar.tsx`, `app/ui/forms/PngForm.tsx`, `app/ui/forms/SpellForm.tsx`, `app/lib/connections/sql.ts`, `app/lib/utils.ts` and `app/lib/data.ts`. The two survivors of those last two files moved to their conventional homes (`app/lib/utils/data/generatePagination.ts`, `app/lib/data/fetchCardData.ts`). The `postgres` and `@wordpress/html-entities` packages were uninstalled, and the stray `SpellMetaField;` statement in `createSpell.ts` is gone. `auth.ts` and `fetchCardData` now read through Prisma, so `DATABASE_URL` is the only connection string the app needs.

Still outstanding:

- `copy-webpack-plugin` in `next.config.ts` copies Leaflet images into `public/` at build time. The `webpack` hook now makes `next build` **fail outright** under Next 16, where Turbopack is the default — this blocks CI's build step. The images are already committed, so deleting the hook is close to free. See TD-18.

`app/lib/actions/notifications/sendNotification.ts` is not dead but is a stub: it only ever `console.log`s, and its `snackbar` channel is unimplemented. It is called from server-side code (`auth.ts`, `getQuery.ts`) where a console log is invisible to the user, so error feedback silently disappears.

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
