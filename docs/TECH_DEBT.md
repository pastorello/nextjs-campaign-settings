# Technical Debt Register

**Last updated:** 2026-07-22
**Scope:** everything found in the 2026-07-22 audit. Each item is independently actionable and sized to be completable in one focused session.

## Legend

| Severity    | Meaning                                                                         |
| ----------- | ------------------------------------------------------------------------------- |
| 🔴 Critical | Security hole, data loss risk, or the project does not build/run correctly      |
| 🟠 High     | Blocks the "portfolio-ready" goal — a reviewer would notice within five minutes |
| 🟡 Medium   | Real quality problem, not immediately visible                                   |
| 🟢 Low      | Polish                                                                          |

Effort: **S** ≈ under 1h · **M** ≈ 1–3h · **L** ≈ half a day or more.

---

## Summary

| ID    | Title                                                       | Severity             | Effort | Phase |
| ----- | ----------------------------------------------------------- | -------------------- | ------ | ----- |
| TD-01 | Unauthenticated delete endpoints and Server Actions         | 🔴 Critical          | M      | 1     |
| TD-02 | No input validation at any trust boundary                   | 🔴 Critical          | M      | 1–2   |
| TD-03 | ✅ Test suite does not run                                  | ~~🔴 Critical~~ done | M      | 1     |
| TD-04 | ✅ TypeScript errors on `tsc --noEmit`                      | ~~🔴 Critical~~ done | S      | 1     |
| TD-05 | ✅ No ESLint config, no Prettier, no CI                     | ~~🟠 High~~ done     | S      | 1     |
| TD-06 | ✅ Dead code and tutorial leftovers                         | ~~🟠 High~~ done     | S      | 1     |
| TD-07 | `next` and `react` pinned to `latest`; two lockfiles        | 🟠 High              | S      | 1     |
| TD-08 | `PageMeta` is loosely typed; `any` in the query layer       | 🟠 High              | M      | 2     |
| TD-09 | Four near-identical Card/List/Library/Form quartets         | 🟠 High              | L      | 2     |
| TD-10 | Notification system is a `console.log` stub                 | 🟠 High              | M      | 2     |
| TD-11 | Schema has no timestamps, indexes, or relations             | 🟡 Medium            | M      | 2     |
| TD-12 | Pagination count and rows use separate queries              | 🟡 Medium            | S      | 2     |
| TD-13 | Errors surfaced as `throw new Error("Failed to fetch X")`   | 🟡 Medium            | M      | 2     |
| TD-14 | Map POIs persisted only to `localStorage`                   | 🟡 Medium            | M      | 3     |
| TD-15 | No accessibility pass                                       | 🟡 Medium            | M      | 2     |
| TD-16 | ✅ Inconsistent formatting                                  | ~~🟢 Low~~ done      | S      | 1     |
| TD-17 | README does not match reality                               | 🟢 Low               | S      | 1     |
| TD-18 | ✅ `copy-webpack-plugin` forces webpack over Turbopack      | ~~🟢 Low~~ done      | S      | 3     |
| TD-19 | Mixed Italian/English identifiers                           | 🟠 High              | L      | 2     |
| TD-20 | TypeScript strictness stops at `strict`; `target` is ES2017 | 🟡 Medium            | M      | 2     |
| TD-21 | UI strings hardcoded; app must ship in it + en              | 🟠 High              | L      | 2     |
| TD-22 | 282 lint warnings surfaced by TD-05                         | 🟠 High              | L      | 2     |

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

### TD-02 🔴 No input validation at any trust boundary

**Where:** `app/lib/data/*/create*.ts`, `app/lib/data/*/update*.ts`, `app/lib/config/pageMetaFields.ts`, plus the boundaries listed below

Every `PageMeta` entry declares a Zod `validator`. Grep confirms **it is never read**. Mutations destructure the incoming object and hand it to Prisma:

```ts
export default async function createSpell(formData: Spell) {
  const { nome, descrizione, livello /* … */ } = formData;
  await prisma.spells.create({ data: { nome, descrizione, livello /* … */ } });
}
```

Nothing checks that `livello` is an integer in range, that `nome` is non-empty, or that `classi` contains valid class IDs. Prisma provides type safety at compile time only — the runtime payload comes from a client and is untrusted.

Also note the stray no-op statement `SpellMetaField;` on its own line in `createSpell.ts`.

#### Every trust boundary, audited

Mutations are the urgent case, but they are not the only place untrusted data enters the system. The full inventory:

| #   | Boundary                  | Where                                                     | Today                                                                                                                                                                                                                                                 | Priority |
| --- | ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | Create / update payloads  | `app/lib/data/*/create*.ts`, `update*.ts`                 | Nothing. Straight into Prisma.                                                                                                                                                                                                                        | 🔴       |
| 2   | Route handler path params | `app/api/*/[id]/route.ts`                                 | `parseInt(params.id)` — `NaN` on garbage input, passed to Prisma unchecked                                                                                                                                                                            | 🔴       |
| 3   | Environment variables     | `app/lib/connections/prisma.ts`, `app/seed/prismaSeed.ts` | `process.env.DATABASE_URL!` — non-null assertion. A missing var fails at an unrelated call site with an opaque error. TD-06 removed the `POSTGRES_URL` call sites along with the raw driver, so `DATABASE_URL` is the only variable left to validate. | 🟠       |
| 4   | Search params             | `app/lib/data/validateParams.ts`                          | ✅ Zod, but `.parse()` throws rather than returning a result, and the return type is cast                                                                                                                                                             | 🟠       |
| 5   | `localStorage` POIs       | `app/modules/maps/hooks/usePOIManager.ts:40`              | `JSON.parse(stored) as POI[]` — a cast, not a check. Hand-edited or stale storage crashes the map.                                                                                                                                                    | 🟠       |
| 6   | GeoJSON files             | `app/api/countries/**`, `WorldMap.tsx`, `MapMain.tsx`     | `JSON.parse(fileContents) as GeoJSONData`                                                                                                                                                                                                             | 🟡       |
| 7   | Prisma results            | `fetchFilteredSpells.ts:29`, `fetchFilteredPng.ts:27`     | `result as Spell[]` — masks any schema/interface drift                                                                                                                                                                                                | 🟡       |

Items 5 and 7 are the instructive ones: `as` is not validation. It silences the compiler and changes nothing at runtime. Every `as` in the table is a place where the code asserts a shape it has not checked.

**Fix**

1. Build a schema per `PageType` by composing the `validator` fields already declared in `pagesConfig`: `buildSchema(PageType.Spell) → z.object({...})`.
2. Call `safeParse` at the top of each mutation; return a typed `{ ok: false, errors }` result on failure.
3. Surface field-level errors in `PageForm` via `useActionState`.
4. Validate route params: `z.coerce.number().int().positive().safeParse(params.id)` → 400 on failure, not a `NaN` query.
5. Add `app/lib/config/env.ts` — one Zod schema for the environment, parsed once at startup. Replaces every `process.env.X!`. A missing variable then fails immediately with a message naming it.
6. Replace the `as` casts at boundaries 5, 6 and 7 with `safeParse`. For POIs, discard invalid entries and warn rather than throwing — corrupt storage should not break the map.
7. Remove the `SpellMetaField;` no-op in `createSpell.ts`.

Steps 1–4 belong to Phase 1. Steps 5–6 can follow in Phase 2 without blocking anything.

**Done when:** submitting an invalid payload returns structured field errors instead of writing to the database, a malformed `:id` returns 400, a missing env var fails at startup with a named message, and each is covered by a test.

---

### TD-03 ✅ Test suite does not run — **DONE (2026-07-22)**

**Outcome:** migrated to Vitest. `pnpm test` runs **27 tests in ~1.5s** — comfortably inside the 10s exit criterion — and CI enforces it with a coverage ratchet.

The suite grew from 4 real tests to 27. The 18 new ones cover `getQuery`, which `TESTING.md` §3 calls the highest-value unit tests available here: it is a pure function from `(searchParams, enabledMeta)` to a Prisma query, and the single place where a wrong field type silently produces a filter that stops filtering.

**They were mutation-tested rather than trusted.** All 18 passed on first run, which proves nothing on its own, so `getQuery` was deliberately broken three ways and the suite re-run:

| Mutation                              | Tests failed |
| ------------------------------------- | ------------ |
| `hasSome` → equality for array fields | 1            |
| `skip` off-by-one                     | 5            |
| `mode: "insensitive"` dropped         | 2            |

`generatePwdHash.test.ts` was rewritten, not ported: the old version asserted a hardcoded bcrypt digest, comparing an unawaited Promise to a string, and could not have passed even awaited, because bcrypt salts randomly. It now asserts the properties the function must hold.

**What this did not do:** no integration tests against Postgres, no Playwright. Both are scoped in `TESTING.md` and neither is started. The integration layer arrives with TD-01 and TD-02 — which is exactly why this item came first. See `TESTING.md` §4 for the four deliberate deviations from the written migration plan.

---

### TD-03 (original description) 🔴 Test suite does not run

**Where:** `jest.config.ts`, `jest.setup.ts`, `__test__/`

> **Correction (2026-07-22, during TD-06):** the claim below that `npx jest` fails to start is **no longer accurate**. It runs, collecting 5 suites: 4 pass, 1 fails. The failure is `__test__/utils/generatePwdHash.test.ts`, which asserts `hashPassword("123456")` equals a hardcoded bcrypt hash — it compares an unawaited `Promise` against a string, and even awaited it could not pass, because bcrypt salts are random. Verified pre-existing on `main`. The rest of this item still stands; re-measure before starting it.

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

### TD-04 ✅ TypeScript errors — **DONE (2026-07-22)**

**Outcome:** `pnpm typecheck` exits **0**, down from 19 errors. `strict: true` now does real work.

**One trap worth knowing, found while closing this.** Four of the nine errors surfaced only through Next's generated `.next/types/validator.ts`. That directory does not exist in a fresh checkout — so a bare `tsc --noEmit` in CI would have passed _vacuously_, silently skipping every route-handler signature, including the four broken ones this item existed to fix. The `typecheck` script is therefore `next typegen && tsc --noEmit`, not `tsc --noEmit`. Do not "simplify" it.

How each group was fixed:

- **Route handlers (4).** `context: { params: Promise<{ id: string }> }`, reading `await context.params`. Runtime behaviour unchanged — the code already awaited.
- **`auth.config.ts` (3).** `import type { NextAuthConfig }` (named, not default) with `satisfies NextAuthConfig`, which also resolved the two implicit-`any` callback params. The never-read `isOnDashboard` / `isApiRoute` locals went with them, and the callback body reduced to `!!auth?.user` — the same value it already returned. **The security hole is untouched:** route-based branching and the missing API guards remain TD-01's.
- **`admin/spells/page.tsx` (1).** The page awaited `props.searchParams` for itself but passed the unresolved Promise to `<SpellList>`. It now passes the awaited object. No runtime change: every `fetchFilteredX` awaits its argument defensively, which is why the three sibling pages doing the same thing never failed — they type the prop as `Promise<ListItem>`. That inconsistency is real but cosmetic, and belongs to TD-09.
- **`validateParams.ts` (1).** Left as a single documented `as SearchParams`. The schema shape is assembled from runtime keys, so Zod can only infer `Record<string, unknown>`; proving the real value type needs TD-08's typed metadata keys. The assertion carries an inline comment naming TD-08 as the place to delete it.

The original breakdown, for reference:

| Count | Location                                     | Error                                                                                                                                                                                                                                                                                                 |
| ----- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4     | `app/api/*/[id]/route.ts`                    | `{ params }: { params: { id: string } }` — in Next 15+, `params` is a `Promise`. The code already `await`s it but types it wrong. Fix: `context: { params: Promise<{ id: string }> }`. Surfaces via the generated `.next/types/validator.ts`, so regenerate with `npx next typegen` before measuring. |
| 3     | `auth.config.ts`                             | `import type NextAuthConfig from "next-auth"` imports the default export as a type. Should be `import type { NextAuthConfig } from "next-auth"` with `satisfies NextAuthConfig`. This also causes the two implicit-`any` errors on the `authorized` callback params.                                  |
| 2     | `validateParams.ts`, `admin/spells/page.tsx` | `Record<string, unknown>` vs `SearchParams`; `Promise<…>` passed where `SearchParams` expected. Async `searchParams` in Next 15+.                                                                                                                                                                     |

Cleared by TD-06: 6 errors from `Header.tsx` / `ItemMeta.tsx` / `NotificationBar.tsx` (imports of modules that do not exist here), 2 from the dead `app/ui/forms/{PngForm,SpellForm}.tsx`, 1 from `app/lib/utils.ts`'s `Revenue` import, and 1 revealed-then-fixed `ItemMeta` prop mismatch.

**Fix:** work top to bottom. The `typecheck` script now exists; wiring it into CI is TD-05.

**Note:** `next build` currently fails for an unrelated reason — the `webpack` hook in `next.config.ts` conflicts with Turbopack being default in Next 16. That is TD-18, and it blocks the `build` step of CI.

**Done when:** `npm run typecheck` exits 0 and CI enforces it.

---

### TD-05 ✅ No lint config, no formatter, no CI — **DONE (2026-07-22)**

**Outcome:** `pnpm lint`, `pnpm format:check` and `pnpm typecheck` all exit 0, and the CI workflow executes for the first time since it was committed. It had never passed a single run: the `static` job died on `prisma generate` for a missing `DATABASE_URL`, and `test:coverage` / `format:check` / a lint config did not exist.

Two things this turned up immediately, which is the argument for doing it at all:

- **A real bug.** `app/lib/utils/data/setSearchParams.ts` was the codebase's only `rules-of-hooks` violation and could never have executed — a hook called at module top level, two more hooks inside its callback, and `useRouter` imported from `next/router`, the Pages Router API. Nothing imported it. Deleted.
- **A latent hazard.** `app/lib/definitions/interfaces/pages/SearchParams.ts` declares its interface without exporting it. A `.ts` file with no import or export is a _global script_, not a module — so `SearchParams` is an ambient global visible everywhere, which is why `SpellList.tsx` uses it without importing it. Filed under TD-22.

**Severity policy, and why it is not a climbdown.** Type-aware linting reports 293 findings on the existing code. Rules the codebase currently violates are set to `warn`; every other rule stays `error`. `pnpm lint` therefore exits 0, so the CI gate can be green — while errors still block any _new_ instance of a class of problem. The alternative, shipping a gate that is red on arrival, trains everyone to scroll past it. Each downgraded rule carries a comment naming its owning item, and the backlog is TD-22.

---

### TD-05 (original description)

There is no `eslint.config.mjs` or `.eslintrc`, so `next lint` has nothing to run — and `next lint` is deprecated in Next 16 in favour of the ESLint CLI. There is no Prettier config, and indentation is mixed 2-space and 4-space across files (`app/api/countries/**` is 4-space, everything else 2-space).

There is no `.github/` directory: nothing verifies a commit.

**Fix**

1. `eslint.config.mjs` with flat config: `eslint-config-next`, `@typescript-eslint` recommended-type-checked, `eslint-plugin-jsx-a11y`.
2. `.prettierrc` + `.prettierignore`; run `prettier --write .` once as a single formatting-only commit so it does not pollute future diffs.
3. `.github/workflows/ci.yml` running lint → typecheck → unit tests → build → E2E. Already scaffolded in this repo.
4. Optionally `lint-staged` + `husky` for a pre-commit pass.

---

### TD-06 ✅ Dead code and tutorial leftovers — **DONE (2026-07-22)**

**Outcome:** `tsc --noEmit` went from **19 errors to 9**, and no file references a non-existent module. The 9 remaining are exactly TD-04's residue (4× route-handler `params`, 2× `SearchParams`, 3× `auth.config.ts`).

Two findings worth carrying forward:

- **The `ItemMeta` instruction below was wrong.** Pointing the import at `PrimitiveValue` surfaced 9 previously-masked errors in `SpellCard` and `DeityCard`: `ItemMeta` renders `{value}` into JSX and is always fed the output of a `PageMeta.getDatum`, which is declared `string | ReactNode` (see `renderRichText.tsx`, which returns a `<div>`). `PrimitiveValue` is simply the wrong type for that prop; it was typed as `ReactNode` instead. The broken import had been hiding the mismatch by degrading the prop to `any`.
- **TD-03's premise is stale.** `npx jest` does _not_ fail to start — it runs 5 suites, of which 1 fails (`generatePwdHash.test.ts` compares an unawaited Promise against a fixed bcrypt hash, which cannot pass; bcrypt salts are random). Verified pre-existing on `main`. Re-scope TD-03 before starting it.

**The Prisma swap was verified by hand before merge.** Commit `3efca76` states that the move of `getUser` and `fetchCardData` off the raw `postgres` driver was _not_ checked against a live database, because none was reachable at the time. It has since been: login succeeds and the dashboard counters render against a real Postgres. That gap is closed — the commit message is left as written, since it was accurate when authored.

The project was scaffolded from the Next.js Learn dashboard tutorial and the scaffolding was never removed. A reviewer opening `app/lib/utils.ts` finds `formatCurrency`, `generateYAxis` and an import of a `Revenue` type in a D&D app — this reads as unfinished work.

**Delete:**

| File                                    | Reason                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `app/ui/components/Header.tsx`          | Imports `react-router-dom` (not a dependency). Nothing imports it.                   |
| `app/ui/components/NotificationBar.tsx` | Imports three `@wordpress/*` packages that are not dependencies. Nothing imports it. |
| `app/ui/forms/PngForm.tsx`              | Superseded by `app/ui/png/PngForm.tsx`, which is the one actually imported.          |
| `app/ui/forms/SpellForm.tsx`            | Superseded by `app/ui/spells/SpellForm.tsx`.                                         |

**Clean up:**

- ✅ `app/lib/utils.ts` — deleted. Only `generatePagination` was still used (by `app/ui/components/pagination.tsx`); it moved to `app/lib/utils/data/generatePagination.ts`, matching the one-concept-per-file convention and removing the `utils.ts` / `utils/` ambiguity.
- ✅ `app/ui/components/ItemMeta.tsx` — `value` is now typed `ReactNode`, not `PrimitiveValue` (see the note above). **Not deleted**: it is imported by `DeityCard` and `SpellCard`.
- ✅ `app/lib/connections/sql.ts` (unreferenced) deleted; `auth.ts` `getUser` and `fetchCardData` now go through Prisma. `app/lib/data.ts` — another raw-driver tutorial leftover sitting beside `app/lib/data/` — became `app/lib/data/fetchCardData.ts`. The `postgres` package is uninstalled, which also retires the duplicate `POSTGRES_URL` env var (`DATABASE_URL` is now the only connection string; README updated). `pg` stays — `@prisma/adapter-pg` needs it.
- ✅ `createSpell.ts` — stray `SpellMetaField;` statement and its now-unused import removed.
- ✅ `@wordpress/html-entities` was unused — uninstalled.

**Done when:** `tsc --noEmit` error count drops by roughly half and no file references a non-existent module. ✅ Both met.

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

**Sequencing:** do this _after_ TD-08. Refactoring against `any` types means the compiler cannot help you; refactoring against a discriminated union means it catches nearly every mistake.

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

### TD-19 🟠 Mixed Italian/English identifiers

**Where:** ~1,000 occurrences across 54 of 288 TypeScript files, plus `prisma/schema.prisma` and `app/seed/initial-data/`
**Decision:** [ADR-0005](./adr/0005-english-identifiers.md)
**Blocked by:** TD-03 (working test suite), TD-08 (typed metadata) — see _Sequencing_ below

The codebase mixes languages without a rule. Models are English (`spells`, `magicitems`, `deities`) except one Italian abbreviation (`png`); columns are Italian (`nome`, `descrizione`, `rarita`, `tempodilancio`); functions are English (`fetchFilteredSpells`); enums are Italian (`Allineamento`, `Fazione`, `Circolo`). The pattern is chronological, not semantic.

`png` is the worst offender: it collides with the image format, and the repo simultaneously contains a `/dashboard/png` route, a `.*\.png$` pattern in `proxy.ts`'s matcher, and real `.png` files in `public/`. No bug today — the regex requires a literal dot — but the ambiguity is standing.

**Target:** all identifiers English, all UI copy Italian, `png` → `npc`. Postgres columns keep their Italian names via Prisma `@map`, so there is no migration and no data risk.

**Sequencing — this is the important part.** The metadata layer is **string-keyed**: field names appear as literals (`metaField: "descrizione"`) and as dynamic index keys (`whereClause[item]`, `pageMetaFields[item].fieldType`). TypeScript cannot verify these. A rename that misses one string does not fail to compile — it produces a filter that silently stops filtering. Run this only after TD-03 gives you tests and TD-08 makes the metadata keys typed; at that point the refactor is largely compiler-verified.

**Fix**

1. Add `@map` to every Prisma field, renaming the TS-facing name only. Regenerate the client.
2. Rename data-layer functions and their arguments.
3. Rename enums, enum members, interfaces and types.
4. Rename metadata keys and the `metaField` string literals — the step tests must cover.
5. Rename `app/seed/initial-data/` in the same commit; it references field names directly.
6. `png` → `npc` throughout, including the route segment and `PageType`.
7. Where an Italian D&D term has no clean English equivalent (`circolo`, `grado patrono`), use the English concept as the identifier and keep the Italian term as the metadata `label`.

**Land it as one pure-rename commit** with no behaviour change, then add the SHA to `.git-blame-ignore-revs` so it does not dominate `git blame`.

**Done when:** no Italian identifier remains outside UI copy and `@map` arguments; `pnpm typecheck && pnpm test && pnpm test:e2e` all green.

---

### TD-20 🟡 TypeScript strictness stops at `strict`

**Where:** `tsconfig.json`
**Blocked by:** TD-04 (the 19 current errors), TD-08 (the 16 `any`s)

`strict: true` **is already enabled.** The problem is not that it is missing — it is that it currently has no effect, because the build has 19 outstanding errors and 16 `any` escape hatches. A strict compiler nobody listens to is decoration.

Once TD-04 and TD-08 land, `strict` starts doing real work and the next tier becomes worth enabling. None of these are on today:

| Flag                                    | What it catches                                                                                                                  | Expected cost                                                                                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `noUncheckedIndexedAccess`              | `arr[i]` and `record[key]` typed as `T` when they may be `undefined`                                                             | **High.** The metadata layer is full of dynamic lookups (`pageMetaFields[item]`) — this is exactly where the bugs are, and exactly why it will be noisy. Enable last, expect real work. |
| `noUnusedLocals` / `noUnusedParameters` | Dead variables — would have caught the unused `isOnDashboard` / `isApiRoute` in `auth.config.ts` and the `SpellMetaField;` no-op | Low. Mostly deletions.                                                                                                                                                                  |
| `noImplicitReturns`                     | Functions returning `undefined` on some paths                                                                                    | Low.                                                                                                                                                                                    |
| `noFallthroughCasesInSwitch`            | Missing `break`                                                                                                                  | Low.                                                                                                                                                                                    |
| `noImplicitOverride`                    | Accidental method shadowing                                                                                                      | Low; few classes here.                                                                                                                                                                  |
| `exactOptionalPropertyTypes`            | `{ x?: string }` accepting an explicit `undefined`                                                                               | Medium. Relevant to `PageMeta`'s optional fields.                                                                                                                                       |
| `verbatimModuleSyntax`                  | Type-only imports not marked `import type` — would have caught the `auth.config.ts` import bug                                   | Low, mechanical.                                                                                                                                                                        |

Also: **`target` is `ES2017`**, which is dated for a Next 16 app and forces needless downlevelling of async/await and object spread. `ES2022` is the sensible floor.

**Fix:** enable in two batches, one commit each, so failures are attributable. Batch one is the cheap flags (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `verbatimModuleSyntax`) plus the `target` bump. Batch two is `exactOptionalPropertyTypes` then `noUncheckedIndexedAccess`, each on its own.

Do **not** enable everything at once and then fix 200 errors in a single commit — the diff becomes unreviewable and genuine bugs hide among the noise.

**Done when:** each flag is on and `pnpm typecheck` is green, or the flag is explicitly recorded here as rejected with a reason.

---

### TD-21 🟠 UI strings are hardcoded; the app must ship in Italian and English

**Where:** `app/ui/**`, `app/dashboard/**`, `app/lib/config/**` (the `label` / `placeholder` fields and every options array)
**Decision:** [ADR-0006](./adr/0006-bilingual-ui.md)
**Blocked by:** TD-08 (`PageMeta` changes shape) · **Do together with:** TD-19 (same 54 files)

Italian copy is written inline in components and in the metadata `label` and `placeholder` fields. The product ships bilingual (it + en), so this is a feature, not groundwork.

**Scope — the boundary is the important part.** Three categories of text, only two of which get translated:

| Category              | Example                                   | Translated?         |
| --------------------- | ----------------------------------------- | ------------------- |
| UI chrome             | "Salva", "Nessun risultato"               | ✅ catalogue        |
| SRD domain labels     | `rarita: "Raro"`, `circolo: "Evocazione"` | ✅ catalogue        |
| Campaign content (DB) | Spell descriptions, NPC biographies       | ❌ stays as written |

Campaign content is user data, not copy. Making it bilingual would mean translation columns and dual inputs on every form — rejected in ADR-0006 on data-entry cost. No schema change is implied by this item.

The SRD label set is roughly 150 terms (rarities, alignments, schools, casting times, patron ranks) with canonical translations in the official rulebooks. It is the half that decides whether the app _feels_ bilingual: an English UI with a dropdown still reading _Caotico Neutrale_ has not achieved anything.

**Why it is blocked by TD-08.** `label: "Livello"` becomes `labelKey: "spells.level.label"`, which changes `PageMeta`'s shape and touches every consumer that reads `label` — forms, list headers, filters, `getDataLabel`. Doing this while `PageMeta` is still loosely typed means no compiler help across ~45 field declarations.

**Why it goes with TD-19.** That rename already opens all 54 domain files. Extracting strings in the same pass costs a fraction of a separate one.

**Fix**

1. Install `next-intl`; configure `localePrefix: "as-needed"` (Italian unprefixed, English under `/en`).
2. Create `messages/it.json` and `messages/en.json`.
3. Convert `PageMeta.label` / `placeholder` to message keys; update every consumer.
4. Convert the options arrays in `app/lib/config/**` to key-based labels; update `getDataLabel`.
5. Extract inline component copy, file by file, as TD-19 touches each one.
6. Translate: SRD terms from the official rulebooks (do not invent translations for game terms), UI chrome freely.
7. Add a locale switcher and persist the choice via cookie.
8. CI check that both catalogues have identical key sets.

**Done when:** no user-facing string literal remains in a component or config file; both catalogues are complete with matching keys; `/en/dashboard/spells` renders fully in English including every dropdown.

---

## Phase 3 — Deferred

### TD-14 🟡 Map POIs live only in `localStorage`

`app/modules/maps/hooks/usePOIManager.ts` reads and writes POIs to `localStorage`. They are lost on browser change, cannot be shared, and — most importantly — cannot reference the NPCs and deities stored in Postgres. The map is currently an island.

**Fix:** a `poi` Prisma model with optional relations to `png` and `deities`, plus Server Actions for CRUD. This is as much a feature as a debt item; it appears in [`ROADMAP.md`](./ROADMAP.md) Phase 3.

### TD-18 ✅ `copy-webpack-plugin` forces webpack — **DONE (2026-07-22)**

**Outcome:** `pnpm build` succeeds for the first time, on Turbopack, and dev and production now use the same bundler.

It was _not_ the free win this item predicted. Removing the `webpack` hook exposed a second, unrelated failure underneath it: the build had never got far enough to reveal it, because the webpack/Turbopack conflict aborted first.

**The second failure — worth knowing, because it will bite someone locally.** Turbopack could not resolve `@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs`. That file does not exist; the installed runtime ships `query_compiler_bg.postgresql.mjs`, without the `_fast` infix. The cause was a **stale `generated/prisma`** left over from an earlier Prisma version. `pnpm prisma generate` fixed it in one command. CI never hits this — every job regenerates the client — so it is purely a local trap, and the error message points at Turbopack rather than at the real cause.

**Correction (same day).** The claim that `pnpm build` passes was verified against a local database that happened to be running, and that verification was too weak. In CI, with no Postgres and a placeholder `DATABASE_URL`, the build compiled and then failed prerendering `/dashboard`: the overview page had no dynamic input, so Next was baking it at build time and `fetchCardData`'s Prisma calls hit `ECONNREFUSED`. Fixed by marking the page `force-dynamic` — which it should have been regardless, since the cards are live record counts that would otherwise freeze at build time. Reproduced locally with the database stopped, both before and after.

**Verified:** all nine files in `public/leaflet/images/` are still served by the production server (HTTP 200, byte sizes matching disk). Five are the Leaflet originals the plugin used to copy and are byte-identical to `node_modules/leaflet/dist/images`; the other four (`map-basic`, `map-dark`, `map-satellite`, `poi-bg`) are project assets that were never the plugin's output and share the directory by accident. All nine are tracked in git, which is why deleting the copy step changes nothing.

Removing `next.config.ts`'s `require()` calls also took 11 warnings off TD-22.

---

### TD-18 (original description) 🟢 `copy-webpack-plugin` forces webpack

`next.config.ts` uses a `webpack` hook to copy Leaflet marker images into `public/`. Because `dev` runs with `--turbopack` but `build` does not, dev and production use different bundlers — a real source of "works in dev, breaks in prod" bugs.

**Fix:** the images are _already present_ in `public/leaflet/images/` (the plugin has run and its output was committed), so this is close to a free win: delete the `webpack` hook from `next.config.ts`, uninstall `copy-webpack-plugin`, and add `--turbopack` to the build script. Verify the markers still render, then commit.

---

### TD-22 🟠 293 lint warnings surfaced by TD-05

**Where:** repo-wide; concentrated in the metadata/query layer and `app/modules/maps/`
**Blocked by:** nothing — but most of it dissolves when TD-08 lands
**Config:** `eslint.config.mjs`, the block headed _Severity policy_

Switching the linter on reported 293 findings; TD-18 removed 11 of them with `next.config.ts`, leaving **282**. They are warnings so that `pnpm lint` can exit 0 and the CI gate can be meaningful; every rule not violated today is still an error, so new code cannot add to this list.

| Rule                                               | Count | Files | Owner             |
| -------------------------------------------------- | ----- | ----- | ----------------- |
| `@typescript-eslint/no-unsafe-assignment`          | 50    | 17    | TD-08             |
| `@typescript-eslint/no-unused-vars`                | 44    | 19    | **TD-22**         |
| `@typescript-eslint/no-unsafe-call`                | 29    | 14    | TD-08             |
| `@typescript-eslint/no-explicit-any`               | 28    | 17    | TD-08             |
| `@typescript-eslint/no-unsafe-member-access`       | 28    | 12    | TD-08             |
| `@typescript-eslint/no-unsafe-argument`            | 21    | 11    | TD-08             |
| `@typescript-eslint/no-floating-promises`          | 14    | 12    | **TD-22**         |
| `@typescript-eslint/no-base-to-string`             | 12    | 2     | TD-08             |
| `@typescript-eslint/restrict-template-expressions` | 11    | 1     | TD-08             |
| `@typescript-eslint/no-unsafe-function-type`       | 10    | 9     | TD-08             |
| `@typescript-eslint/await-thenable`                | 9     | 5     | **TD-22**         |
| `@typescript-eslint/no-unsafe-return`              | 9     | 8     | TD-08             |
| `@typescript-eslint/no-misused-promises`           | 7     | 5     | **TD-22**         |
| `react-hooks/immutability`                         | 4     | 4     | **TD-22** / TD-09 |
| `@typescript-eslint/no-require-imports`            | 4     | 3     | TD-18             |
| `import/no-anonymous-default-export`               | 3     | 3     | **TD-22**         |
| `@typescript-eslint/unbound-method`                | 3     | 3     | **TD-22**         |
| `@typescript-eslint/require-await`                 | 2     | 2     | **TD-22**         |
| `@typescript-eslint/no-unsafe-enum-comparison`     | 2     | 2     | TD-08             |
| `react-hooks/exhaustive-deps`                      | 2     | 2     | **TD-22**         |
| `@typescript-eslint/no-unused-expressions`         | 1     | 1     | **TD-22**         |

**Roughly 170 of the 293 are the `no-unsafe-*` family plus `no-explicit-any`** — all one problem wearing six hats, and all downstream of the loose typing TD-08 exists to fix. Do not grind through them by hand; do TD-08 and re-measure.

What genuinely belongs to this item, in priority order:

1. **`react-hooks/immutability` (4).** Each page-manager hook does `page.id = pageItem.id`, mutating a value returned from `usePageManager`. Direct state mutation — React is not guaranteed to see it, and it is the kind of bug that shows up as "the form sometimes saves against the wrong record". Fix needs a test. TD-09 collapses these four hooks into one, so coordinate.
2. **`no-floating-promises` (14) and `no-misused-promises` (7).** Almost entirely `app/modules/maps/`. A rejected promise here fails silently — no toast, no console, nothing. Note the irony: the maps module is the codebase's quality bar in structure, and its async handling is the weakest part of the app.
3. **`no-unused-vars` (44).** Mostly dead imports (`lusitana` in three admin pages, `redirect` in `createMagicItem`, `render`/`screen` in a test) and two unexported interface declarations. Cheap deletions, in the spirit of _prefer deleting to adding_.
4. **`await-thenable` (9).** `await` applied to non-promises — the defensive `await searchParams` in every `fetchFilteredX`. Harmless today and load-bearing for the Promise-passing pattern in the admin pages, so decide the pattern first (TD-09), then clean up.
5. **`SearchParams.ts` declares an interface with no export.** Not a lint rule, found alongside these: a `.ts` file with no import or export is a global script, so the type leaks into every file as an ambient global. That is why `SpellList.tsx` references it without importing it, and why a second, different `SearchParams` type can live in `validateParams.ts` without a name collision being obvious. Give it an `export`, then fix what breaks.

**Done when:** every rule in `eslint.config.mjs`'s severity block is back to `error` and `pnpm lint` still exits 0. Delete the block, not the rules.

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
10. TD-20a strict flags, cheap batch + ES2022 target
11. TD-19  rename identifiers to English  → needs TD-03's tests and TD-08's typed keys
12. TD-21  extract UI strings           → same files as TD-19, do them together
13. TD-11  schema timestamps + indexes
14. TD-12  single where-clause
15. TD-02b remaining trust boundaries (env, localStorage, GeoJSON)
16. TD-13  typed errors
17. TD-10  real notifications
18. TD-09  collapse duplicated components  → safest after TD-08 and TD-19
19. TD-20b noUncheckedIndexedAccess        → last; noisiest, most valuable
20. TD-15  accessibility pass
--- Phase 2 complete: the project is well-built ---
16. TD-14, TD-18, then feature work
```

The ordering is not arbitrary: each step makes the next one cheaper or safer. In particular, do not attempt TD-09 before TD-08, and do not attempt TD-01/TD-02 before TD-03 — you want a working test suite before you touch security-critical code.
