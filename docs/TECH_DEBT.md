# Technical Debt Register

**Last updated:** 2026-07-22
**Scope:** everything found in the 2026-07-22 audit. Each item is independently actionable and sized to be completable in one focused session.

## Legend

| Severity | Meaning |
|---|---|
| 🔴 Critical | Security hole, data loss risk, or the project does not build/run correctly |
| 🟠 High | Blocks the "portfolio-ready" goal — a reviewer would notice within five minutes |
| 🟡 Medium | Real quality problem, not immediately visible |
| 🟢 Low | Polish |

Effort: **S** ≈ under 1h · **M** ≈ 1–3h · **L** ≈ half a day or more.

---

## Summary

| ID | Title | Severity | Effort | Phase |
|---|---|---|---|---|
| TD-01 | Unauthenticated delete endpoints and Server Actions | 🔴 Critical | M | 1 |
| TD-02 | No input validation on any create/update path | 🔴 Critical | M | 1 |
| TD-03 | Test suite does not run | 🔴 Critical | M | 1 |
| TD-04 | 19 TypeScript errors on `tsc --noEmit` | 🔴 Critical | M | 1 |
| TD-05 | No ESLint config, no Prettier, no CI | 🟠 High | S | 1 |
| TD-06 | Dead code and tutorial leftovers | 🟠 High | S | 1 |
| TD-07 | `next` and `react` pinned to `latest`; two lockfiles | 🟠 High | S | 1 |
| TD-08 | `PageMeta` is loosely typed; `any` in the query layer | 🟠 High | M | 2 |
| TD-09 | Four near-identical Card/List/Library/Form quartets | 🟠 High | L | 2 |
| TD-10 | Notification system is a `console.log` stub | 🟠 High | M | 2 |
| TD-11 | Schema has no timestamps, indexes, or relations | 🟡 Medium | M | 2 |
| TD-12 | Pagination count and rows use separate queries | 🟡 Medium | S | 2 |
| TD-13 | Errors surfaced as `throw new Error("Failed to fetch X")` | 🟡 Medium | M | 2 |
| TD-14 | Map POIs persisted only to `localStorage` | 🟡 Medium | M | 3 |
| TD-15 | No accessibility pass | 🟡 Medium | M | 2 |
| TD-16 | Inconsistent formatting; `.DS_Store` committed | 🟢 Low | S | 1 |
| TD-17 | README does not match reality | 🟢 Low | S | 1 |
| TD-18 | `copy-webpack-plugin` forces webpack over Turbopack | 🟢 Low | S | 3 |

---

## Phase 1 — Correctness and safety

### TD-01 🔴 Unauthenticated delete endpoints and Server Actions

**Where:** `app/api/{spells,deities,magicitems,png}/[id]/route.ts`, `proxy.ts`, all `create*.ts` / `update*.ts` in `app/lib/data/`

`proxy.ts` matches `["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"]` — the `api` exclusion means route handlers are never authenticated by the proxy, and none of the four DELETE handlers call `auth()` themselves. An unauthenticated `DELETE /api/spells/1` deletes record 1.

Server Actions have the same problem for a different reason: they are POST endpoints with stable action IDs that the proxy matcher does not meaningfully protect, and no mutation function calls `auth()`.

Compounding this, `authConfig.callbacks.authorized` computes `isOnDashboard` and `isApiRoute` and then ignores both, returning `isLoggedIn` for everything. The dead variables show the intent was never finished.

**Fix**

1. Add `const session = await auth(); if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });` to every route handler.
2. Add the same guard at the top of every `"use server"` mutation. A small `requireSession()` helper in `app/lib/auth/requireSession.ts` keeps this one line per call site.
3. Remove the unused variables in `authorized`, or implement the route-based branching they imply.
4. Add an integration test per endpoint asserting 401 when unauthenticated.

**Done when:** every write path returns 401 without a session, and a test proves it.

---

### TD-02 🔴 No input validation on any create/update path

**Where:** `app/lib/data/*/create*.ts`, `app/lib/data/*/update*.ts`, `app/lib/config/pageMetaFields.ts`

Every `PageMeta` entry declares a Zod `validator`. Grep confirms **it is never read**. Mutations destructure the incoming object and hand it to Prisma:

```ts
export default async function createSpell(formData: Spell) {
  const { nome, descrizione, livello, /* … */ } = formData;
  await prisma.spells.create({ data: { nome, descrizione, livello, /* … */ } });
}
```

Nothing checks that `livello` is an integer in range, that `nome` is non-empty, or that `classi` contains valid class IDs. Prisma provides type safety at compile time only — the runtime payload comes from a client and is untrusted.

Also note the stray no-op statement `SpellMetaField;` on its own line in `createSpell.ts`.

**Fix**

1. Build a schema per `PageType` by composing the `validator` fields already declared in `pagesConfig`: `buildSchema(PageType.Spell) → z.object({...})`.
2. Call `safeParse` at the top of each mutation; return a typed `{ ok: false, errors }` result on failure.
3. Surface field-level errors in `PageForm` via `useActionState`.
4. Remove the `SpellMetaField;` no-op.

**Done when:** submitting an invalid payload returns structured field errors instead of writing to the database, covered by tests.

---

### TD-03 🔴 Test suite does not run

**Where:** `jest.config.ts`, `jest.setup.ts`, `__test__/`

`npx jest` fails immediately: `Module <rootDir>/jest.setup.ts in the setupFilesAfterEnv option was not found`, despite the file existing. Beyond that:

- `testEnvironment: "jest-environment-node"` — but the suite uses Testing Library and renders React components, which needs `jsdom`.
- `collectCoverage: true` is on for every run, slowing the default loop.
- The config file is the unedited Jest scaffold: ~150 lines of commented-out defaults around ~10 real settings.
- `__test__/utils/createEmptyArraytest..ts` has a malformed filename (double dot, `test` not separated) so it is never collected.
- Real coverage is 3 trivial util tests plus one dashboard snapshot.

**Decision:** migrate to Vitest rather than repair Jest — see [ADR-0002](./adr/0002-testing-stack.md). Vitest removes the Babel config entirely, runs natively on ESM/TS, and is materially faster.

**Fix:** follow [`TESTING.md`](./TESTING.md) §Migration.

**Done when:** `npm test` runs green in under 10 seconds and CI enforces it.

---

### TD-04 🔴 19 TypeScript errors

**Where:** see breakdown

`tsc --noEmit` currently fails. `strict: true` is set, which is good, but the errors mean type checking provides no safety net today.

| Count | Location | Error |
|---|---|---|
| 4 | `app/api/*/[id]/route.ts` | `{ params }: { params: { id: string } }` — in Next 15+, `params` is a `Promise`. The code already `await`s it but types it wrong. Fix: `context: { params: Promise<{ id: string }> }` |
| 6 | `Header.tsx`, `ItemMeta.tsx`, `NotificationBar.tsx` | Imports of `react-router-dom`, `@wordpress/components`, `@wordpress/notices`, `@wordpress/data`, `../functions/isValidDataArray`, `../types/PrimitiveValue` — none exist here. Pasted from other projects. |
| 2 | `auth.config.ts` | `import type NextAuthConfig from "next-auth"` imports the default export as a type. Should be `import type { NextAuthConfig } from "next-auth"` with `satisfies NextAuthConfig`. This also causes the implicit-`any` errors on the `authorized` callback params. |
| 2 | `PngForm.tsx`, `SpellForm.tsx` (in `app/ui/forms/`) | `pageId` not in `PageManagerProps` — these are the dead duplicate forms (see TD-06). |
| 1 | `app/lib/utils.ts` | `Revenue` not exported from `./definitions` — tutorial leftover. |
| 2 | `validateParams.ts`, `admin/spells/page.tsx` | `Record<string, unknown>` vs `SearchParams`; `Promise<…>` passed where `SearchParams` expected. Async `searchParams` in Next 15+. |

**Fix:** work top to bottom. About half the errors disappear by deleting dead files (TD-06). Then add `typecheck: "tsc --noEmit"` to `package.json` scripts and wire it into CI so this cannot regress.

**Done when:** `npm run typecheck` exits 0 and CI enforces it.

---

### TD-05 🟠 No lint config, no formatter, no CI

There is no `eslint.config.mjs` or `.eslintrc`, so `next lint` has nothing to run — and `next lint` is deprecated in Next 16 in favour of the ESLint CLI. There is no Prettier config, and indentation is mixed 2-space and 4-space across files (`app/api/countries/**` is 4-space, everything else 2-space).

There is no `.github/` directory: nothing verifies a commit.

**Fix**

1. `eslint.config.mjs` with flat config: `eslint-config-next`, `@typescript-eslint` recommended-type-checked, `eslint-plugin-jsx-a11y`.
2. `.prettierrc` + `.prettierignore`; run `prettier --write .` once as a single formatting-only commit so it does not pollute future diffs.
3. `.github/workflows/ci.yml` running lint → typecheck → unit tests → build → E2E. Already scaffolded in this repo.
4. Optionally `lint-staged` + `husky` for a pre-commit pass.

---

### TD-06 🟠 Dead code and tutorial leftovers

The project was scaffolded from the Next.js Learn dashboard tutorial and the scaffolding was never removed. A reviewer opening `app/lib/utils.ts` finds `formatCurrency`, `generateYAxis` and an import of a `Revenue` type in a D&D app — this reads as unfinished work.

**Delete:**

| File | Reason |
|---|---|
| `app/ui/components/Header.tsx` | Imports `react-router-dom` (not a dependency). Nothing imports it. |
| `app/ui/components/NotificationBar.tsx` | Imports three `@wordpress/*` packages that are not dependencies. Nothing imports it. |
| `app/ui/forms/PngForm.tsx` | Superseded by `app/ui/png/PngForm.tsx`, which is the one actually imported. |
| `app/ui/forms/SpellForm.tsx` | Superseded by `app/ui/spells/SpellForm.tsx`. |

**Clean up:**

- `app/lib/utils.ts` — remove `formatCurrency`, `formatDateToLocal`, `generateYAxis`, the `Revenue` import; keep only what is actually used.
- `app/ui/components/ItemMeta.tsx` — fix the `../types/PrimitiveValue` import to point at `app/lib/definitions/types/PrimitiveValue`. **Do not delete**: it is imported by `DeityCard`, `SpellCard`, `MagicItemCard`, `MagicItemLibrary` and `MagicItemForm`.
- `app/lib/connections/sql.ts` and the inline `postgres()` client in `auth.ts` — route user lookup through Prisma and drop the second driver.
- `createSpell.ts` — remove the stray `SpellMetaField;` statement.
- Check whether `@wordpress/html-entities` is used; if not, uninstall.

**Done when:** `tsc --noEmit` error count drops by roughly half and no file references a non-existent module.

---

### TD-07 🟠 Unpinned framework versions and two lockfiles

`package.json` has `"next": "latest"`, `"react": "latest"`, `"react-dom": "latest"`. Builds are not reproducible: a fresh `npm install` in six months may pull a major version and break the app. For a portfolio project this is the kind of thing that makes a clone-and-run fail in front of a reviewer.

Both `package-lock.json` and `pnpm-lock.yaml` are committed, and the README mixes `npm install` / `npm run db:seed` with `pnpm prisma generate`.

**Fix**

1. Pin `next`, `react`, `react-dom` to the exact resolved versions currently in the lockfile.
2. Pick one package manager. Given `pnpm.onlyBuiltDependencies` is already configured in `package.json`, pnpm is the better fit. Delete `package-lock.json`, add `"packageManager"` to `package.json`, and make the README consistent.
3. Add an `engines` field for the Node version.

---

### TD-16 🟢 Formatting and repo hygiene

Mixed indentation (`app/api/countries/**` is 4-space, the rest 2-space) and no formatter. Folded into TD-05 in practice; listed separately so it is not forgotten.

A `.DS_Store` exists on disk at the repo root but is **not** tracked — `.gitignore` is doing its job. Nothing to fix.

Also: the migration folder is named `20251126152855_resetio` — rename future migrations descriptively (`add_timestamps`, `add_name_indexes`).

---

### TD-17 🟢 README does not match reality

The README mixes `npm` and `pnpm`, does not mention the Vitest/Playwright commands, has a typo in the env template (`AUTH_SECRET=your-sercret-key`), and — most importantly for a portfolio — contains no screenshots, no feature list, no live demo link, and no explanation of the metadata architecture that makes the project interesting.

**Fix:** rewrite as a portfolio README: one-paragraph pitch, screenshot or GIF of the map and a list page, feature list, tech stack with rationale, quickstart, architecture summary linking to `docs/`, testing section, roadmap.

---

## Phase 2 — Quality and maintainability

### TD-08 🟠 Loose typing in the metadata and query layer

**Where:** `app/lib/definitions/interfaces/meta/PageMeta.ts`, `app/lib/data/getQuery.ts`, `validateParams.ts`

16 occurrences of `any` across 6 files, concentrated in exactly the layer that most needs type safety:

```ts
const paramValidator: Record<FieldType, (aValue: any) => boolean> = { … };
export default function getQuery(searchParams: Record<string, any>, …) {
  const whereClause: any = {};
  const orderBy: any[] = [];
```

`whereClause: any` means a typo in a field name produces a runtime Prisma error rather than a compile error. `PageMeta` is similarly loose: `fieldType`, `validator` and `getDatum` are not correlated, so `fieldType: FieldType.array` with `validator: z.string()` type-checks.

**Fix**

1. Make `PageMeta` a discriminated union on `fieldType`, correlating `defaultValue`, `validator`, `options` and `getDatum`.
2. Type `whereClause` as `Prisma.spellsWhereInput | Prisma.pngWhereInput | …` via a generic parameter on `getQuery`.
3. Replace `Record<string, any>` search params with the `SearchParams` type that already exists.
4. Add `@typescript-eslint/no-explicit-any` as an error once the count reaches zero.

This is the highest-signal item for a technical reviewer: it turns a clever-but-untyped abstraction into a clever-and-type-safe one.

---

### TD-09 🟠 Duplicated per-domain components

`app/ui/{spells,png,deities,magicitems}/` each contain a `XxxCard`, `XxxList`, `XxxLibrary` and `XxxForm` that are roughly 80% identical — same structure, same sorting header, same pagination, differing only in which fields they read. The same duplication exists in `app/lib/hooks/{spells,png,deities,magicitems}/useXxxPageManager.ts`.

Since the metadata layer already knows every field of every domain, this duplication is unnecessary by construction.

**Fix**

1. Extract `<EntityList meta={pagesConfig[pageType]} items={…} />` and `<EntityCard>`.
2. Collapse the four page-manager hooks into `usePageManager(pageType)`.
3. Keep a per-domain component only where the domain genuinely differs.

**Sequencing:** do this *after* TD-08. Refactoring against `any` types means the compiler cannot help you; refactoring against a discriminated union means it catches nearly every mistake.

---

### TD-10 🟠 Notification system is a stub

`app/lib/actions/notifications/sendNotification.ts` accepts a `channel` of `"console" | "snackbar"` but only implements `console` — the `snackbar` branch does not exist. Worse, it is called from server-side code (`auth.ts` on invalid credentials, `getQuery.ts` on a missing meta field) where `console.log` goes to the server terminal and the user sees nothing.

`sonner` is already a dependency and is wired up in `app/modules/maps/components/ui/sonner.tsx` — the toast infrastructure exists but is only used inside the maps module.

**Fix:** promote the Sonner `<Toaster />` to the root layout, implement the `snackbar` channel, and separate server-side logging from client-facing notifications. They are different concerns currently conflated in one function.

---

### TD-11 🟡 Schema gaps

- No `createdAt` / `updatedAt` on any model. No audit trail, and "recently added" views are impossible.
- No `@@index`. Every list query filters and sorts on `nome` with a sequential scan.
- No relations. `fazione`, `luogo`, `allineamento`, `classe` are bare `Int`s indexing into hardcoded TypeScript arrays — reorder an array and every existing row silently changes meaning.
- No ownership. Records belong to no user and no campaign, which blocks the multi-campaign feature.
- `magicitems` has no `nome` uniqueness constraint; `getQuery` sorts by `nome` on all domains.

**Fix (incremental, in this order)**

1. Add `createdAt @default(now())` and `updatedAt @updatedAt` to all five models.
2. Add `@@index([nome])` to `deities`, `magicitems`, `png`, `spells`.
3. Later, when multi-campaign lands: introduce a `Campaign` model and a `campaignId` foreign key.
4. Consider promoting the most stable lookup arrays (`fazioni`, `luoghi`) to real tables with foreign keys.

---

### TD-12 🟡 Pagination reads the table twice with divergent queries

`fetchFilteredX` and `getXCount` each build their own filter from the same search params. If one drifts from the other, the pagination control shows a page count that does not match the rows returned — a classic silent bug.

**Fix:** build the `where` clause once and pass it to both, or use a single `prisma.$transaction([findMany, count])`.

---

### TD-13 🟡 Opaque error handling

The prevailing pattern is:

```ts
} catch (error) {
  console.error("Database Error:", error);
  throw new Error("Failed to fetch spells.");
}
```

The original error is discarded, so the stack trace is lost. `deleteSpellById` returns a bare `boolean`, so "not found" and "database exploded" are indistinguishable — and the route handler maps both to HTTP 500, when "not found" should be 404. 34 `console.*` calls remain across the app.

**Fix:** a small typed error hierarchy (`NotFoundError`, `ValidationError`, `DatabaseError`), preserve `{ cause: error }`, map error types to correct HTTP status codes, and route user-facing messages through the notification system from TD-10.

---

### TD-15 🟡 No accessibility pass

Never audited. Likely issues given the component inventory: custom `Select` and `Modal` implementations (keyboard trap and ARIA correctness unverified), icon-only buttons in `MapControls` and `SortButton` (need accessible names), form inputs (label association unverified), and no visible focus-state audit.

**Fix:** add `eslint-plugin-jsx-a11y` (catches the static issues for free), add `@axe-core/playwright` assertions to the E2E suite, then do a manual keyboard-only pass over each list page and form. Accessibility is disproportionately noticed in portfolio review.

---

## Phase 3 — Deferred

### TD-14 🟡 Map POIs live only in `localStorage`

`app/modules/maps/hooks/usePOIManager.ts` reads and writes POIs to `localStorage`. They are lost on browser change, cannot be shared, and — most importantly — cannot reference the NPCs and deities stored in Postgres. The map is currently an island.

**Fix:** a `poi` Prisma model with optional relations to `png` and `deities`, plus Server Actions for CRUD. This is as much a feature as a debt item; it appears in [`ROADMAP.md`](./ROADMAP.md) Phase 3.

### TD-18 🟢 `copy-webpack-plugin` forces webpack

`next.config.ts` uses a `webpack` hook to copy Leaflet marker images into `public/`. Because `dev` runs with `--turbopack` but `build` does not, dev and production use different bundlers — a real source of "works in dev, breaks in prod" bugs.

**Fix:** the images are *already present* in `public/leaflet/images/` (the plugin has run and its output was committed), so this is close to a free win: delete the `webpack` hook from `next.config.ts`, uninstall `copy-webpack-plugin`, and add `--turbopack` to the build script. Verify the markers still render, then commit.

---

## Recommended execution order

```
1. TD-06  delete dead code            → removes ~half of TD-04's errors first
2. TD-04  fix remaining type errors
3. TD-03  migrate to Vitest, get a green suite
4. TD-05  ESLint + Prettier + CI      → locks in 1–3 permanently
5. TD-01  auth guards (+ tests)       → now testable, because 3 is done
6. TD-02  Zod validation (+ tests)
7. TD-07  pin versions, one lockfile
8. TD-17  portfolio README
--- Phase 1 complete: the project is correct, safe and verified ---
9.  TD-08  type the metadata layer
10. TD-11  schema timestamps + indexes
11. TD-12  single where-clause
12. TD-13  typed errors
13. TD-10  real notifications
14. TD-09  collapse duplicated components  → safest after TD-08
15. TD-15  accessibility pass
--- Phase 2 complete: the project is well-built ---
16. TD-14, TD-18, then feature work
```

The ordering is not arbitrary: each step makes the next one cheaper or safer. In particular, do not attempt TD-09 before TD-08, and do not attempt TD-01/TD-02 before TD-03 — you want a working test suite before you touch security-critical code.
