# Technical Debt Register

**Last updated:** 2026-07-25
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

| ID    | Title                                                                | Severity             | Effort | Phase |
| ----- | -------------------------------------------------------------------- | -------------------- | ------ | ----- |
| TD-01 | ✅ Unauthenticated delete endpoints and Server Actions               | ~~🔴 Critical~~ done | M      | 1     |
| TD-02 | ✅ No input validation (Phase 1); TD-02b remains                     | ~~🔴 Critical~~ done | M      | 1–2   |
| TD-03 | ✅ Test suite does not run                                           | ~~🔴 Critical~~ done | M      | 1     |
| TD-04 | ✅ TypeScript errors on `tsc --noEmit`                               | ~~🔴 Critical~~ done | S      | 1     |
| TD-05 | ✅ No ESLint config, no Prettier, no CI                              | ~~🟠 High~~ done     | S      | 1     |
| TD-06 | ✅ Dead code and tutorial leftovers                                  | ~~🟠 High~~ done     | S      | 1     |
| TD-07 | ✅ `next`/`react` pinned; single lockfile                            | ~~🟠 High~~ done     | S      | 1     |
| TD-08 | ◑ metadata typed (steps 1–2); query layer still `any`                | 🟠 High              | M      | 2     |
| TD-09 | Four near-identical Card/List/Library/Form quartets                  | 🟠 High              | L      | 2     |
| TD-10 | Notification system is a `console.log` stub                          | 🟠 High              | M      | 2     |
| TD-11 | ✅ Timestamps + `@@index([nome])`; relations still deferred          | ~~🟡 Medium~~ part   | M      | 2     |
| TD-12 | Pagination count and rows use separate queries                       | 🟡 Medium            | S      | 2     |
| TD-13 | Errors surfaced as `throw new Error("Failed to fetch X")`            | 🟡 Medium            | M      | 2     |
| TD-14 | Map POIs persisted only to `localStorage`                            | 🟡 Medium            | M      | 3     |
| TD-15 | No accessibility pass                                                | 🟡 Medium            | M      | 2     |
| TD-16 | ✅ Inconsistent formatting                                           | ~~🟢 Low~~ done      | S      | 1     |
| TD-17 | ✅ README does not match reality                                     | ~~🟢 Low~~ done      | S      | 1     |
| TD-18 | ✅ `copy-webpack-plugin` forces webpack over Turbopack               | ~~🟢 Low~~ done      | S      | 3     |
| TD-19 | Mixed Italian/English identifiers                                    | 🟠 High              | L      | 2     |
| TD-20 | ◑ strict flags: batch 1 partly done; noUnusedLocals + verbatim split | 🟡 Medium            | M      | 2     |
| TD-21 | UI strings hardcoded; app must ship in it + en                       | 🟠 High              | L      | 2     |
| TD-22 | ◑ lint warnings: 282 → 165; `no-unused-vars` back to `error`         | 🟠 High              | M      | 2     |
| TD-23 | ✅ Migration drift patched forward; migrations match the schema      | ~~🟠 High~~ done     | S      | 1     |
| TD-24 | ✅ Playwright + 26 specs; `e2e` job blocking in CI                   | ~~🟠 High~~ done     | M      | 1     |
| TD-25 | An unreachable database surfaces as an opaque UI error               | 🟡 Medium            | S      | 2     |
| TD-26 | ✅ `sottoclassi` / `circolo` duplication resolved                    | ~~🟡 Medium~~ done   | S      | 2     |
| TD-27 | ✅ Hidden `classi=0` filter on the spells list removed               | ~~🟠 High~~ done     | S      | 2     |
| TD-28 | ✅ Seed ids removed; the database assigns them, as the UI does       | ~~🟠 High~~ done     | S      | 2     |
| TD-29 | ✅ Loading skeleton was the tutorial's invoices table                | ~~🟡 Medium~~ done   | S      | 2     |
| TD-30 | Four list pages wrap a `<Suspense>` that can never trigger           | 🟡 Medium            | S      | 2     |

---

## Phase 1 — Correctness and safety

### TD-01 ✅ Unauthenticated delete endpoints and Server Actions — **DONE (2026-07-22)**

**Outcome:** every write path now verifies a session. Two guards, one per boundary shape:

- `app/lib/auth/requireApiSession.ts` — returns a 401 `NextResponse` (or `null`), used by the four DELETE route handlers: `const unauthorized = await requireApiSession(); if (unauthorized) return unauthorized;`.
- `app/lib/auth/requireSession.ts` — throws `UnauthorizedError`, called at the top of all eight `create*` / `update*` Server Actions.

The `delete*ById` functions are not guarded directly: they are internal helpers reachable only through the already-guarded route handlers, so the trust boundary is the handler, not the helper. The GeoJSON `GET` endpoints under `app/api/countries/**` are read-only reference data and out of scope.

**Tests (48 total, +21):** `__test__/api/deleteEndpoints.test.ts` asserts 401-and-no-DB-call for each of the four endpoints (and that a session lets the delete through); `__test__/data/mutationGuards.test.ts` asserts each of the eight mutations throws `UnauthorizedError` and never reaches Prisma without a session; `__test__/auth/session-guards.test.ts` covers the two helpers directly. All were written red-first against the unguarded code.

**Not done, deliberately:** fix step 3 (per-route branching in `authorized`). It is unnecessary — the proxy gates the dashboard on login, and the API boundary is now guarded per-handler, so there is no route class left that needs different treatment. Left as `!!auth?.user`.

The original description follows.

---

### TD-01 (original) 🔴 Unauthenticated delete endpoints and Server Actions

**Where:** `app/api/{spells,deities,magicitems,png}/[id]/route.ts`, `proxy.ts`, all `create*.ts` / `update*.ts` in `app/lib/data/`

`proxy.ts` matches `["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"]` — the `api` exclusion means route handlers are never authenticated by the proxy, and none of the four DELETE handlers call `auth()` themselves. An unauthenticated `DELETE /api/spells/1` deletes record 1.

Server Actions have the same problem for a different reason: they are POST endpoints with stable action IDs that the proxy matcher does not meaningfully protect, and no mutation function calls `auth()`.

Compounding this, `authConfig.callbacks.authorized` gates every matched path identically — it now returns `!!auth?.user` and nothing more, so it cannot distinguish a dashboard route from an API route even if the matcher covered the latter. (TD-04 already deleted the dead `isOnDashboard` / `isApiRoute` locals that used to sit unused here, so this is now a genuine "the branching was never written" gap, not a "written and ignored" one.)

**Fix**

1. Add `const session = await auth(); if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });` to every route handler.
2. Add the same guard at the top of every `"use server"` mutation. A small `requireSession()` helper in `app/lib/auth/requireSession.ts` keeps this one line per call site.
3. If per-route branching is actually wanted in `authorized`, implement it now — the unused variables that hinted at it are already gone, so this is net-new logic, not a cleanup.
4. Add an integration test per endpoint asserting 401 when unauthenticated.

**Done when:** every write path returns 401 without a session, and a test proves it.

---

### TD-02 ✅ No input validation at any trust boundary — **Phase 1 steps DONE (2026-07-22)**

**Outcome:** the `validator` every `PageMeta` has always declared is finally executed. Steps 1, 2 and 4 are done; steps 5–6 remain as **TD-02b** (env vars, `localStorage`, GeoJSON, Prisma-result casts), which the item below always scheduled for Phase 2.

- `app/lib/data/validation/buildEntitySchema.ts` composes each entity's declared validators into `buildCreateSchema` (full payload) and `buildUpdateSchema` (partial, `id` required — updates only carry edited fields).
- All eight `create*` / `update*` mutations `safeParse` first and return `MutationResult` (`app/lib/definitions/types/MutationResult.ts`): `{ ok: true }` or `{ ok: false, errors }` with Zod's field-keyed map. Nothing reaches Prisma on failure.
- `app/lib/data/validation/parseIdParam.ts` validates route `:id` segments → **400** instead of `parseInt("abc")` becoming `NaN` in a Prisma `where`. `"1.5"`, `"-1"`, `"0"` and `""` are rejected too.
- The four domain forms show the returned errors via `app/ui/components/FormErrorSummary.tsx` and stay open on failure, instead of closing as though the save succeeded.

**Two findings worth carrying forward:**

- **`pagesConfig` is dead _and_ broken.** TD-02's written fix said to compose the schema from it. It has no importers at all, and its references do not resolve: it accesses `pageMetaFields.tempoDiLancio` / `.tiroSalvezza` / `.titoloPatrono` where the actual keys are lowercase (`tempodilancio`, …), so nine entries are `undefined` at runtime. Worse, a `PageMeta`'s `metaField` string is camelCase (`"sottoClassi"`) while its registry key, the payload key and the DB column are all lowercase (`sottoclassi`) — so keying anything by `metaField` silently mismatches. Validation therefore keys off the real field name and carries its own `entityFieldKeys` list, guarded by a test that every key resolves to a declared validator. **Rebuilding `pagesConfig` belongs to TD-08.**
- **The validators are now enforced exactly as declared, and some are lax.** `nome` is `z.string()` with no `.min(1)`, so an empty name still passes. Tightening them is a product decision, not a wiring one — left alone deliberately.

**Tests (111 total, +63):** `buildEntitySchema.test.ts` proves a payload of every field's declared `defaultValue` passes each of the four domains — the check that catches a validator that never matched the data it guards; `mutationValidation.test.ts` covers valid-writes / invalid-rejected / field-keyed-errors / partial-update per domain; `deleteEndpoints.test.ts` gained 24 malformed-`:id` cases.

The original description follows.

---

### TD-02 (original) 🔴 No input validation at any trust boundary

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

### TD-07 ✅ Unpinned framework versions and two lockfiles — **DONE (2026-07-22)**

**Outcome:** builds are reproducible and there is exactly one package manager.

- `next`, `react` and `react-dom` are pinned to the exact versions that were already resolved — **16.2.11 / 19.2.8 / 19.2.8**. A fresh clone can no longer pull a new major and fail in front of a reviewer.
- `package-lock.json` is deleted; pnpm is the only manager. `packageManager: "pnpm@10.23.0"` and `engines: { node: ">=22" }` are declared.
- **CI's pnpm version is no longer hardcoded.** It was pinned to `9` while local development ran `10.23.0` — the two could drift silently. `pnpm/action-setup` now reads the `packageManager` field, so CI and a developer machine install with provably the same tool. (No breakage had occurred: pnpm 10 writes `lockfileVersion: '9.0'`, which pnpm 9 still reads.)
- The README is pnpm-only and gains a Requirements section. Its `AUTH_SECRET=your-sercret-key` typo is fixed while in those lines; the full portfolio rewrite stays TD-17.

**Verified:** `node_modules` deleted, `pnpm install --frozen-lockfile` from scratch, then typecheck / lint / format / 111 tests / build all green.

The original description follows.

---

### TD-07 (original) 🟠 Unpinned framework versions and two lockfiles

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

Also: the migration folder is named `20251126152855_resetio` — rename future migrations descriptively (`add_timestamps`, `add_name_indexes`). That same migration has also drifted from the schema — see **TD-23**.

---

### TD-17 ✅ README does not match reality — **DONE (2026-07-22)**

**Outcome:** rewritten as a portfolio README — pitch, feature list, the metadata layer explained with real code, a stack table that gives a _reason_ per choice, a working quickstart, an architecture map linking into `docs/`, a testing section and a status table.

Every factual claim was verified against the repo rather than asserted: the 41 metadata fields, six ADRs, 25 debt items, four DELETE endpoints, and that every command it lists exists in `package.json`. Internal links are checked. The quickstart's `db push` path was run — Prisma reports the schema already in sync — and the seed was confirmed idempotent (its records carry explicit ids, so re-running skips rather than duplicates).

**Deliberately honest rather than flattering:** it states 18% coverage as low, says the E2E suite is specified but not written, and points at `TECH_DEBT.md` as the list of what is known to be wrong. A portfolio README that hides those is worse than one that owns them.

**No screenshots, deliberately.** The UI has not been touched yet — correctness work comes first — so screenshots would advertise a raw interface and date immediately. Rather than leave placeholders that read as an oversight, the README states the sequencing outright: the visual layer is scheduled after the foundations. Add them when the UI work happens (ROADMAP Phase 2, item 14). Also removed `public/hero-{desktop,mobile}.png` — 600 KB of unreferenced Next.js-tutorial images that TD-06 missed.

The original description follows.

---

### TD-17 (original) 🟢 README does not match reality

The README mixes `npm` and `pnpm`, does not mention the Vitest/Playwright commands, has a typo in the env template (`AUTH_SECRET=your-sercret-key`), and — most importantly for a portfolio — contains no screenshots, no feature list, no live demo link, and no explanation of the metadata architecture that makes the project interesting.

**Fix:** rewrite as a portfolio README: one-paragraph pitch, screenshot or GIF of the map and a list page, feature list, tech stack with rationale, quickstart, architecture summary linking to `docs/`, testing section, roadmap.

---

## Phase 2 — Quality and maintainability

### TD-08 ◑ Loose typing in the metadata and query layer — **step 1 DONE (2026-07-22)**

**Done: `PageMeta` is a discriminated union on `fieldType`** (`app/lib/definitions/interfaces/meta/PageMeta.ts`). `defaultValue` and `validator` are now correlated with it, so `fieldType: FieldType.array` with `validator: z.string()` no longer compiles. Both `any`s in the interface are gone.

Turning it on surfaced four genuine defects, none of which any test would have caught:

1. **Eight deity fields declared `fieldType: integer` with `defaultValue: ""`.** An untouched select therefore submitted an empty string where a number was declared; with TD-02's validation live, `z.coerce.number()` turns that into `0`. They now default to their own first option, the pattern `colore` already used in the same file. **This changes what a new deity form starts with** — the intended behaviour, but a behaviour change.

   **Audited, and the stored data is clean.** `0` is a _declared option value_ in all eight fields, so a zero is a legal choice rather than a corrupted write, and a check of every `deities` row found no value outside its field's options. No repair or migration is needed. The defect was that the form silently landed on whichever option happens to be `0` instead of a deliberate first choice — a semantics problem, not a data-integrity one. An earlier note here claimed it "silently stored 0" as though that were corruption; that overstated it.

2. **Two call sites passed the wrong type to `getDatum`'s second parameter.** Both implementations take a boolean flag; the callers passed `"colorClass"` and `{ useShortLabel: true }`. They worked only because both are truthy — `{ useShortLabel: false }` would have been truthy too and silently done the opposite.
3. **`pageMetaFields.value` was dead tutorial scaffolding** — `fieldType: string` with a numeric coercion validator and a _"Please enter an amount greater than $0"_ message. Unreferenced; deleted.
4. **`SelectOption.value` was always `string | number`**, so an integer field could not derive its default from its own options without widening. It is now generic (`SelectOption<number>`), with the old annotation still valid by default.

**Steps 2 and 3 done (2026-07-22).** `MetaConfigKey` was `keyof typeof pageMetaFields` over a `Record<string, PageMeta>` — which is just `string`. Every registry annotation is now `satisfies` instead, so the keys survive inference, and `MetaConfigKey` is the union of the real field names.

One subtlety made it work. Domain metas key their entries by enum member (`[SpellMetaField.livello]`), so a bare `keyof` yields _enum member_ types, and string enums are nominal: `PatronoMetaField.allineamento` and `PngMetaField.allineamento` are different types despite both being `"allineamento"`. `MetaConfigKey` therefore collapses them with a template literal, `` `${keyof typeof pageMetaFields}` ``, which accepts either enum member and a plain string alike.

What that bought:

- **`pagesConfig` is fixed and compiler-verified.** It now holds _keys_, not values, so the nine camelCase references that silently resolved to `undefined` are gone — the compiler rejected each one by name.
- **The TD-02 workaround is deleted.** `buildEntitySchema` no longer carries its own duplicate field list; it reads `pagesConfig`.
- **More untruthful declarations surfaced.** `tempodilancio`, `gittata`, `durata` and `tirosalvezza` are string fields whose `getDatum` was declared `(datum: number)`; `circolo`, `classi` and `sottoclassi` receive the whole array, not one element. All corrected to what they actually take.
- **`usePageManager` demanded all 39 fields.** Each domain supplies only its own, so its record is `Partial` now — which in turn surfaced [[TD-26]].

Warnings fell 274 → **256**.

**Step 3 (query layer typed):** `getQuery` is generic over the Prisma where type (`getQuery<Prisma.spellsWhereInput>(…)`), with `whereClause` / `orderBy` typed via `app/lib/definitions/types/QueryClauses.ts`; `validateParams` takes `RawSearchParams` and its `zodConfig` is `Record<FieldType, ZodTypeAny>`; `getItemsCount` takes a typed `Countable` count delegate instead of `ListItem` (`{[k]: any}`). The `fetchFiltered*` / `getXCount` wrappers pass the Prisma where type through and drop a no-op `await`. Warnings **256 → 211** (−45). Verified the queries still run against a real database (name filter and counts unchanged).

**Two things fixed on the way here.** `SearchParams` (`app/lib/definitions/interfaces/pages/SearchParams.ts`) had no `export`, so it was an ambient global six files used without importing — the finding filed in TD-22. It now exports and is imported explicitly, and gained the index signature it always needed (filter controls add a param per field). And the `sottoclassi` removal's sibling: nothing new, just noted the Promise-vs-object inconsistency in the page layer is real and stays TD-09's — the wrappers now type their input as `RawSearchParams | Promise<RawSearchParams>` and await once, which is honest rather than a fix.

**Still to do (step 4):** flip `no-explicit-any` to an error once the remaining 211 warnings are gone — most are TD-09's four duplicated forms and the maps module's floating promises, not the metadata/query layer.

**Also worth folding into step 2, both found here:**

- **`getDatum`'s second parameter is one boolean meaning different things per field** — `useShortLabel` on `livello`, `useColorCode` on `colore`. A flag whose meaning depends on which field you are calling is what let two call sites pass a string and an object without complaint. A named option object, or a per-variant signature, would make it say what it does.
- **Only six of the nineteen numeric option lists were retyped** to `SelectOption<number>[]` — the ones whose fields needed it. The remaining thirteen still widen to `string | number` for no reason. Cosmetic, but it is the kind of half-applied change that reads as an oversight later.

**Correcting an estimate I gave earlier:** I predicted the union would dissolve roughly 170 of the 282 lint warnings. It removed **8** (282 → 274). The `no-unsafe-*` family does not live in the metadata declarations — it is in `getQuery`, `validateParams`, `getItemsCount` and, most of all, 48 warnings across the four domain forms, which come from the loosely-typed page-manager hooks and are as much **TD-09**'s to fix as this item's. The big reduction is real but it belongs to steps 2–3 plus the hook collapse, not to step 1.

The original description follows.

---

### TD-08 (original) 🟠 Loose typing in the metadata and query layer

**Where:** `app/lib/definitions/interfaces/meta/PageMeta.ts`, `app/lib/data/getQuery.ts`, `validateParams.ts`

**28 occurrences of `any` across 17 files** (the linter's count via `no-explicit-any`; the original audit's "16 across 6" looked only at the metadata/query core and missed the per-domain `fetchFiltered*` / `getXCount` functions, `ListItem`, `FormField` and `controlComponents`). They are concentrated in exactly the layer that most needs type safety:

```ts
const paramValidator: Record<FieldType, (aValue: any) => boolean> = { … };
export default function getQuery(searchParams: Record<string, any>, …) {
  const whereClause: any = {};
  const orderBy: any[] = [];
```

`whereClause: any` means a typo in a field name produces a runtime Prisma error rather than a compile error. `PageMeta` is similarly loose: `fieldType`, `validator` and `getDatum` are not correlated, so `fieldType: FieldType.array` with `validator: z.string()` type-checks.

**Also in scope: `pagesConfig` is dead and broken.** Nothing imports it, and nine of its entries are `undefined` at runtime because it accesses camelCase properties (`pageMetaFields.tempoDiLancio`) where the keys are lowercase (`tempodilancio`). Compounding it, each `PageMeta.metaField` is camelCase while the registry key, payload key and DB column are lowercase — so the one string meant to name a field cannot be used to look it up. TD-02 worked around this with its own key list; this item should make `pagesConfig` correct and make `metaField` agree with its key, then delete the workaround.

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

### TD-11 ◑ Schema gaps — **timestamps and indexes DONE (2026-07-26)**

**Done:** `prisma/migrations/20260726100000_add_timestamps_and_name_indexes/`.

- `createdAt @default(now())` and `updatedAt @updatedAt` on all five models. `updatedAt` is added with a database default so existing rows backfill, then the default is dropped — `@updatedAt` carries none, and leaving one behind is drift that `prisma migrate diff` reports as `default changed from Some(Now) to None`. Found exactly that way.
- `@@index([nome])` on `deities`, `magicitems`, `png`, `spells`. `users` is excluded: it is queried by `email`, already unique and therefore already indexed.
- **`spells.sottoclassi` dropped** — the orphan TD-26 left behind. Verified empty twice before writing the statement: zero populated rows in the development database, and zero in all 361 rows of the DM's real spell library.

**Written by hand, not generated.** `prisma migrate dev` would have detected the `db push`-built development database as drift and offered to reset it. Verified the way TD-23 was: replay all three migrations onto a throwaway database, seed, and confirm `prisma migrate diff` reports no difference. Applying it to the development database needed the same care — `prisma db push` refused (it cannot add a required `updatedAt` to tables with rows and suggested `--force-reset`, which destroys everything), so the migration SQL was applied directly. Data intact, `migrate diff` clean.

**Still open in this item:** relations, ownership/`campaignId`, and promoting lookup arrays to tables. Those are Phase 3 and unchanged by this.

---

### TD-11 (original) 🟡 Schema gaps

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

**Confirmed in practice, 2026-07-22.** With Postgres stopped, `/dashboard` failed with nothing but `Error: Failed to fetch card data.` in a console otherwise full of React internals. The actual cause — a refused connection — went to `console.error` on the server and was discarded one line later:

```ts
} catch (error) {
  console.error("Database Error:", error);
  throw new Error("Failed to fetch card data."); // the cause dies here
}
```

A single `{ cause: error }` would have turned a manual `docker ps` hunt into reading the message. This is the strongest argument for the item and worth doing before the rest of Phase 2's polish. The proactive half — noticing the database is unreachable _before_ a page tries to render — is **TD-25**.

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

### TD-20 ◑ TypeScript strictness stops at `strict` — **batch 1 partly done (2026-07-22)**

**Where:** `tsconfig.json`

**Enabled (TD-20a):** `target: ES2022`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noUnusedParameters`. `typecheck` stays green. Fixes were small: `_`-prefixed the required-but-unused `request` params in the four DELETE handlers and `prevState` in `authenticate`, two `override` keywords in `MapErrorBoundary`, three explicit returns in effects, and two dead destructured props (`buttonState`, `searchParams`) dropped from `BaseButton` / `ListPage` — both still declared in their interfaces and passed by callers, just no longer read.

**Split out on purpose — measured, not as the doc assumed:**

- **`noUnusedLocals` (41 errors) — likely rejected for this repo, not just split.** Some are genuine dead imports, but **13 are in `app/ui/geography/WorldMap.tsx`**, and the DM has confirmed those are _unwired scaffolding, not dead code_: the maps module (`app/modules/maps/`) is a vendored library and `WorldMap` is a thin MVP that will wire more of it up over time. `noUnusedLocals` would force deleting exactly that optionality. So this flag conflicts with a deliberate practice here (keep unused-but-intended imports/handlers) and should probably **not** be enabled — or only with those files excluded. Decide with the DM before touching it; do not delete the scaffolding to satisfy the flag.
- **`verbatimModuleSyntax` — 211 errors, not "low, mechanical" as the row below claims.** Auto-fixable but a 211-line diff across the repo; it deserves its own reviewable commit.

One dead prop remains (`ListPage.searchParams`): declared in its interface, never read. Clean it with the `noUnusedLocals` pass. (`BaseButton.buttonState` was the other one — it is no longer dead: the planned loading/active/disabled/default feature was implemented 2026-07-25, so the prop is now read and drives the rendered button. Its ad-hoc predecessors — `SelectButtonery`'s hand-rolled `bg-violet-700` active styling and `PageForm`'s manual save spinner — were folded into it.)

**Follow-up left by that change:** `app/ui/components/Spinner.tsx` (the full-page framer-motion loader) is now unreferenced — `PageForm` was its only caller, and the loading state uses a small inline `animate-spin` SVG instead, which suits a 40px button far better than a `min-h-100` page loader did. Per the _unused is not dead_ rule, it was left in place: it reads as an intended full-page loader (e.g. for a future `loading.tsx`), not a tutorial leftover. Wire it into a real page loader or retire it deliberately — do not delete it in a drive-by cleanup.

**Blocked by:** TD-08 (the `any`s). TD-04 is done — the 19 errors are gone and `typecheck` exits 0.

`strict: true` **is already enabled**, and since TD-04 it does real work — `pnpm typecheck` is a genuine gate now, not decoration. What still blunts it are the `any` escape hatches: **28 across 17 files** by the linter's count (the original audit's "16 across 6" undercounted — it only looked at the metadata/query core and missed the per-domain fetch/count functions). TD-08 removes them.

Once TD-08 lands, the next tier of flags becomes worth enabling. None of these are on today:

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

### TD-22 ◑ Lint warnings surfaced by TD-05 — **293 → 282 → 165**

**Where:** repo-wide; concentrated in the metadata/query layer and `app/modules/maps/`
**Blocked by:** nothing — but most of it dissolves when TD-08 lands
**Config:** `eslint.config.mjs`, the block headed _Severity policy_

Switching the linter on reported 293 findings; TD-18 removed 11 of them with `next.config.ts`, leaving **282**. They are warnings so that `pnpm lint` can exit 0 and the CI gate can be meaningful; every rule not violated today is still an error, so new code cannot add to this list.

**Re-measured 2026-07-25: 165 warnings, 0 errors.** TD-08 steps 2–3 (typed metadata keys and query layer) took out most of the `no-unsafe-*` mass, and PR #25/#26 cleared `no-unused-vars` entirely — that rule is an `error` again, the first one returned from the severity block. Current distribution:

| Rule                                         | Count | Owner     |
| -------------------------------------------- | ----- | --------- |
| `@typescript-eslint/no-unsafe-assignment`    | 32    | TD-09     |
| `@typescript-eslint/no-unsafe-member-access` | 25    | TD-09     |
| `@typescript-eslint/no-unsafe-call`          | 24    | TD-09     |
| `@typescript-eslint/no-unsafe-argument`      | 21    | TD-09     |
| `@typescript-eslint/no-floating-promises`    | 14    | **TD-22** |
| `@typescript-eslint/no-unsafe-function-type` | 10    | TD-09     |
| `@typescript-eslint/no-unsafe-return`        | 8     | TD-09     |
| `@typescript-eslint/no-misused-promises`     | 7     | **TD-22** |
| `@typescript-eslint/no-explicit-any`         | 6     | TD-08     |
| `react-hooks/immutability`                   | 4     | TD-09     |
| everything else (9 rules, ≤3 each)           | 14    | **TD-22** |

**Where they now live matters more than the total.** 48 of the 165 — 12 apiece — are in the four domain forms (`DeityForm`, `MagicItemForm`, `PngForm`, `SpellForm`), fed by the loosely-typed page-manager hooks. Another ~30 are in `app/modules/maps/`, almost all floating promises. So the remaining `no-unsafe-*` backlog is **TD-09's to clear, not TD-08's** — the metadata and query layers are typed now. TD-08 step 4 (flip `no-explicit-any` to error) is gated on the component collapse, not on more metadata work.

The original 282-warning distribution, for reference:

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

### TD-23 ✅ The single migration has drifted from the schema — **DONE (2026-07-26)**

**Outcome:** `prisma/migrations/20260726093000_add_spells_nome_drop_tutorial_tables/` patches the drift forward. On a clean database `prisma migrate deploy && pnpm db:seed` now runs green, and `prisma migrate diff --from-config-datasource --to-schema ./prisma/schema.prisma` reports **"No difference detected."** — the migration history reproduces the schema, which is what this item asked for.

**A corrective migration, not a regenerated one.** This item said the clean fix was to regenerate from the schema, and deferred it to TD-11 because that means dropping and recreating the database. With the drift measured, a third option was better than either: patch forward. No reset, no data risk, no waiting for TD-11 — which now adds its timestamps and indexes as an ordinary migration on top.

**The drift was twice what this item recorded.** Comparing column _names_ finds two problems; `prisma migrate diff` finds four:

| #   | Drift                                                                     | Recorded before? | Fails the seed?            |
| --- | ------------------------------------------------------------------------- | ---------------- | -------------------------- |
| 1   | `spells.nome` missing                                                     | ✅               | ✅ — this is what broke CI |
| 2   | `customers`, `invoices`, `revenue` — tutorial tables the schema never had | ✅               | ✗                          |
| 3   | Eight `deities` columns `VARCHAR(255)` where the schema says `Int`        | ✗                | ✗                          |
| 4   | `png.descrizione` `NOT NULL` where the schema says `String?`              | ✗                | ✗                          |

Rows 3 and 4 are the interesting ones: they never fail anything, so nothing surfaces them until something depends on the migration reproducing the schema. Row 3 is the same set of fields TD-08 step 1 found declared as integers carrying `defaultValue: ""` — they were strings once, the schema moved on, the migration did not. **Lesson worth keeping: `diff <(column names) <(column names)` is not a drift check. `prisma migrate diff` is.**

**Verified** on a throwaway database in the same Postgres container, so the development data was never touched: create → `migrate deploy` → `db:seed` → 4 spells → `migrate diff` clean → drop.

**Consequence:** the `e2e` job's `continue-on-error` is gone. Phase 1 has its fifth gate.

**Note for a machine set up with `db push`** (which is what the README describes, and what every developer here has): `_prisma_migrations` is empty there, so `migrate deploy` would try to re-apply everything onto tables that already exist. If you ever switch a local database to the migration path, baseline it first with `prisma migrate resolve --applied`. Unchanged by this item — it was already true with one migration.

The original description follows.

---

### TD-23 (original) 🟠 The single migration has drifted from the schema

**Where:** `prisma/migrations/20251126152855_resetio/migration.sql` vs `prisma/schema.prisma`
**Found:** 2026-07-22, when TD-03 turned the `test` job green and CI's pipeline reached the `e2e` job for the first time.

`prisma migrate deploy` applies the one committed migration, then `pnpm db:seed` fails:

```
column "nome" of relation "spells" does not exist
```

The migration does not reproduce the schema. Two drifts, enumerated by diffing every table:

1. **`spells` is missing its `nome` column.** The migration's `CREATE TABLE "spells"` has all 15 columns except `nome`, which the schema declares (`nome String`). It is the only column drift — `deities`, `magicitems`, `png` and `users` match the schema exactly. The seed inserts `nome`, so it dies on the first spell.
2. **Three tutorial tables the schema never had.** The migration still creates `customers`, `invoices` and `revenue` — Next.js Learn leftovers, the same tutorial origin TD-06 cleaned out of the code. They are harmless (nothing references them) but they are noise in the one artefact that is supposed to _be_ the schema.

**Why it stayed hidden.** The README sets the database up with `prisma db push`, which syncs the schema directly and never reads the migration. Every developer machine and the earlier manual login/build checks used that path, so the migration has never actually run. CI's `e2e` job is the only place that uses `prisma migrate deploy`, and it only started reaching that step once `test` went green.

This is the migration-side twin of the naming note already in TD-16 (`20251126152855_resetio` is not a descriptive name). The clean fix is to regenerate the migration from the current schema — but that is a destructive database operation (drop + recreate), so it needs explicit confirmation per CLAUDE.md rule 6, and it belongs with **TD-11**, which changes the schema anyway (timestamps, indexes). Doing it before TD-11 means doing it twice.

**Interim:** the `e2e` job cannot pass regardless — Playwright is not installed and there are no specs (see TD-03). Marking it `continue-on-error` until it is real keeps `main`'s CI honestly green instead of red on a job nobody can satisfy yet.

**Done when:** `prisma migrate reset && prisma migrate deploy` on a clean database produces a schema the seed runs against without error, and the migration contains no table absent from `schema.prisma`.

---

### TD-24 ✅ Playwright E2E harness — **DONE (specs 2026-07-25, CI gate 2026-07-26)**

**Outcome:** Playwright is installed, `pnpm test:e2e` runs **26 passing specs in ~15s** against a real database, and the eight flows from TESTING.md §E2E exist. Step 5 is done too: **`continue-on-error` is gone and the `e2e` job blocks**, which took closing TD-23 first — the job used to die at `pnpm db:seed`, before Playwright was ever invoked.

**Structure.** `auth.setup.ts` logs in once and saves `storageState`; every spec but `auth.spec.ts` starts authenticated. `auth.spec.ts` runs in its own signed-out project. One worker, no parallelism — the specs share one database and the CRUD ones write to it.

**It found a real bug on its first green run — see [[TD-27]].** That is the argument for the whole item: `getQuery` has 18 unit tests and none of them could see it, because the defect is a mount effect in a component, not a query.

**Four things the written plan got wrong, all found by running it:**

1. **`request.newContext()` inherits the project's `storageState`.** `validation.spec.ts` created an "anonymous" context to assert a 401 and got a 200 — it was signed in. Read as a missing auth guard; the guard was fine (`curl -X DELETE` with no cookies returns 401). **That test also deleted the record it aimed at.** A spec that exercises a destructive endpoint must only ever target a record it created itself. The 401 assertion now lives in `auth.spec.ts`, in the signed-out project, against an id that cannot exist.
2. **`validation.spec.ts` cannot assert "empty required field → error".** Every string validator is a bare `z.string()`, so an empty `nome` is valid and saving it is correct behaviour — see TD-02, which leaves tightening them open as a product decision. The spec covers the boundary that does reject: malformed `:id` → 400.
3. **`pagination.spec.ts` cannot navigate pages.** Page size is 30, the seed inserts 4–5 rows per domain, so every list is one page. It asserts the half that carries the risk instead — header count equals rendered rows, which is TD-12's regression test at the UI level.
4. **`a11y.spec.ts` asserts no _new kind_ of violation, not zero.** Measured today: `link-name` ×4 on every page (the icon-only pencil links in the sidebar have no accessible name), plus `color-contrast` on the lists and `aria-toggle-field-name` on the spell form. A zero-violation gate would be red on arrival — the failure mode TD-05's severity policy exists to avoid.

**Two selector traps worth knowing before touching these specs:**

- The element carrying `role="dialog"` is Headless UI's `<Dialog>` root, `position: relative` with `fixed` children — **no bounding box, so Playwright reports it hidden.** Assert on something inside it. Scoping (`dialog.getByLabel(…)`) is fine, that is DOM containment.
- The dialog title renders **twice**: `Modal` emits a `<DialogTitle>` h2 and each domain form emits its own h1 with the same text. A heading query inside the dialog is a strict-mode violation. Worth cleaning up with TD-09.

**Local runs mutate the development database.** The CRUD specs create, edit and delete real rows; they use timestamped names and clean up after themselves, but a run interrupted mid-test leaves an `E2E …` record behind. A dedicated E2E database (or the `docker-compose.test.yaml` service TESTING.md §Integration already calls for) is the right fix and is not in this item.

**Still to do, none of it blocking:** add Firefox and WebKit once the suite has proven stable; give the suite its own database rather than pointing it at development data. (The `fixme` is gone — TD-27 is fixed.)

The original description follows.

---

### TD-24 (original) 🟠 Playwright E2E harness and the eight critical-flow specs

**Where:** the `e2e` job in `.github/workflows/ci.yml`; a new `e2e/` directory; `playwright.config.ts`
**Decision:** [ADR-0002](./adr/0002-testing-stack.md) · **Plan:** [TESTING.md §E2E](./TESTING.md)
**Blocked by:** TD-01 (auth guards) and TD-02 (validation)

This item exists because the E2E layer was previously scheduled only in `ROADMAP.md` (Phase 1, step 8) with a `—` in the debt column, and was absent from the execution order below — scheduled in one document and invisible in the other. It also reconciles a contradiction: the Phase 1 exit criteria name `typecheck && lint && test && build`, which do not include E2E, yet the `e2e` job sits in the workflow. Both are now consistent: **the four gates block; `e2e` is `continue-on-error` until this item lands.**

**Why it is blocked, not just late.** Four of the eight specs in TESTING.md — `auth.spec.ts`, `validation.spec.ts`, and the `-crud` specs' delete steps — assert behaviour that TD-01 and TD-02 create and change. Writing them first means writing them against flows that are about to move: an `auth.spec` that logs in and reaches a page proves nothing while every mutation is still unauthenticated, and a `validation.spec` needs the field errors TD-02 introduces. So this is the **last task of Phase 1**, after TD-01 and TD-02, not a thing to rush before them.

**Scope**

1. `pnpm create playwright` (it is interactive — do it locally, commit the result). Config per TESTING.md §Migration step 6: `testDir: "./e2e"`, `webServer` on `pnpm dev`, `baseURL`, `trace: "on-first-retry"`.
2. Re-add `test:e2e` / `test:e2e:ui` scripts (removed in TD-03 when they had nothing to run).
3. The eight specs in TESTING.md §E2E, `getByRole`/`getByLabel` throughout so they double as accessibility assertions.
4. Cache Playwright browsers in CI (the job already has the cache step scaffolded).
5. **Delete `continue-on-error: true` from the `e2e` job** — the job blocks again, and the Phase 1 exit criteria gain their fifth gate.

**Note:** the `e2e` job also currently fails at the seed step because of TD-23. That must be fixed for the job to go green, but it is a separate cause with its own item — do not conflate the two.

**Done when:** the eight specs pass in CI against a real Postgres, `continue-on-error` is gone, and `ROADMAP.md` step 8 references this ID instead of `—`.

---

### TD-25 🟡 An unreachable database surfaces as an opaque UI error

**Where:** `app/lib/connections/prisma.ts`, `app/ui/dashboard/cards.tsx`, every `fetch*` in `app/lib/data/`
**Related but not the same:** TD-13 (make the message carry its cause) · TD-02b step 5 (validate env vars)

**Observed 2026-07-22.** With Postgres stopped, opening `/dashboard` produced a React error boundary and a console full of `react-dom-client` frames, whose only project-specific line was:

```
Error: Failed to fetch card data.
    at fetchCardData (fetchCardData.ts:21:11)
```

Nothing in the browser said _connection refused_, or _nothing is listening on 5432_, or _start docker-compose_. The real cause reached `console.error` on the server terminal and was then thrown away. Diagnosing it meant checking `docker ps` by hand.

**Why this is not already covered.** TD-13 fixes the _message_ — preserve `{ cause }` so the error says `ECONNREFUSED` instead of a generic string, and that alone would have made this a ten-second diagnosis. But TD-13 is reactive: you still find out mid-render, once a page happens to query. And TD-02b step 5 validates that `DATABASE_URL` is _present and well-formed_ — which it was. A correct connection string pointing at a stopped server passes every check we have planned.

The gap is that nothing verifies the database is actually **reachable**, at the one moment where saying so is cheap and useful: startup.

**Fix**

1. Do TD-13 first — it is the larger share of the value, and this item is thin on top of it.
2. Add a dev-time connectivity check: on server start (or first Prisma use), attempt `SELECT 1` and, on failure, log one actionable line naming the host, the port and the command that starts it — instead of letting the first page render be the messenger.
3. Keep it out of the request path in production: a per-request health check is a cost, not a feature. Dev-only, or a one-shot check at boot.
4. Consider surfacing it in the UI through TD-10's notification channel rather than only an error boundary, so a stopped database reads as "database non raggiungibile", not "Application error".

**Explicitly not in scope:** retries, connection pooling or a readiness endpoint. This is about _saying what is wrong_, not about surviving it.

**Done when:** starting the app with Postgres stopped produces one clear log line naming the unreachable host and how to start it, and the dashboard shows a message that distinguishes "database down" from "query failed".

---

### TD-26 ✅ `sottoclassi` / `circolo` duplication — **DONE (2026-07-22)**

**It was not a copy-paste bug, it was a concept that converged.** Spells were first meant to be grouped into homebrew _circoli_; the design later followed D&D 5e and used subclasses for that job. The `circolo` column kept its name and quietly changed meaning, and `sottoclassi` was left behind as an unused twin — same options, same `getDatum`, its own state never created.

The data settles it: `circolo` is populated on every spell with real multi-value arrays; `sottoclassi` is empty apart from one test row.

**Resolved by:** relabelling the live field to **"Sottoclassi"** (it holds subclass ids, so the UI now says so) and deleting the duplicate from the metadata, `pagesConfig`, the `Spell` interface, the page manager, `createSpell`, the seed data and `SpellMetaField`. The `circolo` column and its data are untouched; renaming the identifier is TD-19's, and dropping the orphaned `sottoclassi` column goes with TD-11's migration work.

**`Circolo.ts` is deliberately kept** although nothing imports it — 23 thematic circles the DM intends to revisit. Annotated in the file and recorded in CLAUDE.md so no cleanup pass removes it.

The original description follows.

---

### TD-26 (original) 🟡 `sottoclassi` and `circolo` share one state in the spell page manager

**Where:** `app/lib/hooks/spells/useSpellPageManager.ts`

```ts
[SpellMetaField.sottoClassi]: { setter: setCircolo, value: circolo },
[SpellMetaField.circolo]:     { setter: setCircolo, value: circolo },
```

There is no `sottoclassi` state at all — both fields read and write `circolo`. Editing one would change the other, and a spell's subclasses would be saved as its school.

**Not currently reachable:** `SpellForm` does not render the `sottoclassi` control, so nothing exercises the broken wiring today. It is a loaded gun rather than a live bug, which is why it is filed rather than hot-fixed.

**Decide before fixing:** whether `sottoclassi` should have its own state and control at all. The field exists in the schema, the interface and the metadata, but no form ever sets it — so the honest options are to wire it properly _or_ to drop the field. That is a product call, not a typing one. Found while typing the metadata keys (TD-08).

---

### TD-27 ✅ The spells list applies a hidden "Bardo" filter on mount — **DONE (2026-07-26)**

**Fix:** deleted the mount effect in `app/ui/spells/SpellLibrary.tsx`, along with the now-unused `useFilterController` import. Nothing replaced it — the effect had no purpose that survived inspection, and the list is correct without it: loading `/dashboard/spells` leaves the URL alone, and a level filter now produces `?livello=N` and nothing else.

`e2e/filtering.spec.ts` lost its `fixme` and gained the assertion that catches a regression: after clicking a level filter, `classi` must be absent from the URL.

The original description follows.

---

### TD-27 (original) 🟠 The spells list applies a hidden "Bardo" filter on mount

**Where:** `app/ui/spells/SpellLibrary.tsx:18`
**Found:** 2026-07-25, by the first green run of TD-24's `filtering.spec.ts`

```ts
const { onFilter } = useFilterController(SpellMetaField.classi);

useEffect(() => {
  onFilter(0); // classi = 0 → "Bardo"
}, []);
```

The component mounts and immediately filters the list by the **first class in the options array**, rewriting the URL to `?classi=0&page=1`. Nothing asked it to. The user sees the full list render and then collapse to Bardo spells, and every subsequent filter click composes with a class filter they never chose — click "2° Livello" and the page asks for `livello=2 AND classi=0`, which matches nothing in the seeded data and renders an empty list under two highlighted filter buttons.

**Reproduce:** load `/dashboard/spells`, click any level button, watch the URL. Expected `?livello=2`; actual `?livello=2&classi=0` (or `?classi=0` alone if the effect wins the race). Confirmed by hand in the browser, independently of Playwright.

**Why no existing test caught it.** `getQuery` has 18 unit tests and they all pass: the query layer is doing exactly what it is asked. The wrong _request_ is composed in a component effect, which only an end-to-end assertion can see. This is the clearest evidence in the repo for why TD-24 was worth doing.

**Related:** the same file carries the `react-hooks/exhaustive-deps` warning counted in TD-22 (`onFilter` missing from the dependency array) — the lint warning and this bug are the same line.

**Fix:** work out what the effect was for and almost certainly delete it. If some default filter really is wanted, it belongs in the page's initial search params, not in a mount effect that fights the URL. Then delete the `test.fixme` in `e2e/filtering.spec.ts`, which documents this and skips because of it.

**Done when:** loading the spells list leaves the URL alone, a level filter produces `?livello=N` and nothing else, and `filtering.spec.ts` runs without the fixme.

---

### TD-28 ✅ The seed inserted explicit ids without advancing the id sequence — **DONE (2026-07-26)**

**Fix, and it is the DM's, not the one filed below.** The original entry proposed calling `setval` after seeding. The better question was why the ids were there at all: seed records are records _to be created_, so their id should come from the database exactly as it does for a record created through the UI. The `id` field is gone from all five files in `app/seed/initial-data/`, and nothing calls `setval` anywhere — the sequences are correct because Postgres generated every value itself.

**What that cost, and how it was paid.** The seed's idempotency came from `skipDuplicates` colliding on the primary key, which worked _only_ because the ids were fixed. Without them, `skipDuplicates` has nothing to collide on (`nome` is not unique) and a second run would duplicate every record. `prismaSeed.ts` now checks for an existing record by `nome` before creating — the same matching rule `db:import` uses — and `users` by `email`, which is unique in the schema.

**Verified on a throwaway database:** migrate → seed → 16 records; seed again → 0 created, counts unchanged; every sequence equal to its table's `max(id)`; and an insert that lets the database choose the id succeeds, which is the case that used to fail.

The workaround this bug caused in `app/seed/importLibrary.ts` — a `resyncIdSequence` call before each import — has been deleted along with it. A database seeded by an older checkout still carries the broken sequences and needs a one-off repair per table:

```sql
SELECT setval(pg_get_serial_sequence('"deities"', 'id'),
              GREATEST(COALESCE((SELECT MAX(id) FROM "deities"), 0), 1));
```

The original description follows.

---

### TD-28 (original) 🟠 The seed inserts explicit ids without advancing the id sequence

**Where:** `app/seed/prismaSeed.ts` and every file in `app/seed/initial-data/`
**Found:** 2026-07-26, while importing the DM's real library

Every seed record carries an explicit `id` (spells get 45, 47, 54, 90; deities 1, 15, 16, 18, 19, 21). Postgres only advances a `SERIAL` sequence when it generates the value itself, so after seeding the sequence still sits at 1 while ids far above it are already taken. The next insert that lets the database choose asks for id 1, then 2, and fails:

```
Unique constraint failed on the fields: (`id`)
```

**This is user-facing, not just a script problem.** It was measured on the development database: `deities` held ids up to 21 with its sequence at 1, so the first "Nuova divinità" submitted from the UI would have failed. `spells` had the same shape until enough inserts walked the sequence past the seeded ids — which is the worst version of the bug, because it fixes itself after a handful of failures and so reads as "it broke once, then it was fine".

**Fix:** after seeding, set each sequence past the highest id — the statement `app/seed/importLibrary.ts` already carries as `resyncIdSequence`:

```sql
SELECT setval(pg_get_serial_sequence('"spells"', 'id'),
              GREATEST(COALESCE((SELECT MAX(id) FROM "spells"), 0), 1));
```

Alternatively drop the explicit ids from the seed data and let the database assign them; that changes what `skipDuplicates` means for re-runs, so it is the larger change of the two.

**Done when:** a freshly seeded database accepts a record created through the UI in every domain, with a test covering it.

---

### TD-29 ✅ The loading skeleton was the tutorial's invoices table — **DONE (2026-07-27)**

**Where:** `app/ui/skeletons.tsx`, and the four admin pages that use it

`TableSkeleton` was still the Next.js Learn placeholder, headed **Customer · Email · Amount · Date · Status · Edit**. Those are literal strings in the markup, so a screen reader announced an invoices table on a page of spells every time one streamed in. TD-06 cleaned the tutorial out of the code and missed this, because visually it is just grey blocks — the words are only in the header row and in the accessibility tree.

**Found by it interfering with a test.** A `getByRole("columnheader")` probe during streaming returned the tutorial's six headers instead of the real ones. A decorative placeholder that outranks real content in a role query is a good sign it should not be in the tree at all.

**Fixed three ways:**

- `aria-hidden="true"` on the wrapper. A loading placeholder has nothing to tell assistive technology — the real table announces itself when it arrives.
- No text at all: header cells are shimmer blocks now, like the body always was.
- It takes a `pageType` and reads its column count from `listConfig`, so the placeholder has the same shape as the table replacing it. It used to render six columns for every domain, against the spells table's four, and the layout jumped when the data landed.

7 tests cover it, including one per domain asserting the count matches `listConfig` and one asserting the tutorial words are gone.

---

### TD-30 🟡 Four list pages wrap a `<Suspense>` that can never trigger

**Where:** `app/dashboard/{spells,png,deities,magicitems}/page.tsx`
**Found:** 2026-07-27, while fixing TD-29

Each of the four public list pages does this:

```tsx
const fetchedItems = await fetchFilteredSpells(searchParams);
…
<Suspense fallback={<TableSkeleton />}>
  <SpellLibrary itemCount={itemCount} items={fetchedItems || []} />
</Suspense>
```

The page awaits the query itself, then passes the result down. Nothing inside the boundary suspends, so **the fallback never renders** — the page simply blocks until the data is ready, and the boundary is decoration. The admin pages get this right: `EntityList` awaits its own fetch, so it genuinely streams.

Compounding it, the fallback is a _table_ skeleton for a page that renders _cards_.

**Fix:** move the fetch into the library component, as `EntityList` does, so the boundary earns its place — or delete the boundary and be honest that the page blocks. The first is better: these pages now query a 361-spell library.

**Done when:** either the fallback is reachable and shaped like the content it replaces, or the `<Suspense>` is gone.

---

## Recommended execution order

```
1. ✅ TD-06  delete dead code            → removed ~half of TD-04's errors first
2. ✅ TD-04  fix remaining type errors
3. ✅ TD-03  migrate to Vitest, get a green suite
4. ✅ TD-05  ESLint + Prettier + CI      → locks in 1–3 permanently
5. ✅ TD-01  auth guards (+ tests)       → done; requireApiSession + requireSession
6. ✅ TD-02  Zod validation (+ tests)   → buildEntitySchema + parseIdParam
7. ✅ TD-07  pin versions, one lockfile
8. ✅ TD-24  Playwright + 26 E2E specs    → needed TD-23 to make the CI job blocking
9. ✅ TD-17  portfolio README
--- Phase 1 complete: the project is correct, safe and verified ---
10. TD-08  type the metadata layer
11. TD-20a strict flags, cheap batch + ES2022 target
12. TD-19  rename identifiers to English  → needs TD-03's tests and TD-08's typed keys
13. TD-21  extract UI strings           → same files as TD-19, do them together
14. ✅ TD-11 schema timestamps + indexes (relations remain, Phase 3)
14b. ✅ TD-27 SpellLibrary's mount effect deleted
14c. ✅ TD-28 seed ids removed; the database assigns them
15. TD-12  single where-clause
16. TD-02b remaining trust boundaries (env, localStorage, GeoJSON)
17. TD-13  typed errors                    → preserve { cause }; biggest diagnosability win
18. TD-25  startup DB-reachability check   → thin once TD-13 lands; do them together
19. TD-10  real notifications
20. TD-09  collapse duplicated components  → safest after TD-08 and TD-19
21. TD-22  lint backlog to zero            → mostly dissolves once TD-08 lands
22. TD-20b noUncheckedIndexedAccess        → last; noisiest, most valuable
23. TD-15  accessibility pass              → axe assertions ride on TD-24's Playwright setup
--- Phase 2 complete: the project is well-built ---
24. ✅ TD-18 done early (unblocked the build); then TD-14, then feature work
```

The ordering is not arbitrary: each step makes the next one cheaper or safer. In particular, do not attempt TD-09 before TD-08, do not attempt TD-01/TD-02 before TD-03 (you want a working test suite before you touch security-critical code), and do not attempt TD-24 before TD-01/TD-02 — the E2E specs assert auth and validation flows those two items create.
