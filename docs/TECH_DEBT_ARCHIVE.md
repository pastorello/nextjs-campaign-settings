# Technical Debt Archive — closed items

**What this is:** the full write-up for every closed item, TD-01 through TD-36 — what was found, why, the fix, and what it replaced. Moved out of [`TECH_DEBT.md`](./TECH_DEBT.md) on 2026-08-01 so that file stays a working register (summary table + what's actually open) rather than a 1,700-line document nobody opening it for "what should I work on" needs to scroll past.

**Nothing here is stale by design** — this is exactly [`docs/README.md`](./README.md)'s stated policy: _"Keeping the finished item's write-up is deliberate and good — the register is the only record of what was tried and rejected."_ That policy didn't change; only where the record lives did. If you're deciding what to work on next, you want [`TECH_DEBT.md`](./TECH_DEBT.md), not this file. If you want to know why a past decision was made a certain way, or whether something was already tried and rejected, this is where that lives.

Sections below are grouped exactly as they were in the original register — Phase 1, Phase 2, Phase 3 — with each item's own "(original)" problem framing kept alongside its resolution, unedited.

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

### TD-02b ✅ Remaining trust boundaries — **DONE (2026-07-31)**

**Outcome:** the four boundaries steps 5–6 deferred to Phase 2 are now validated, closing Phase 2.

- **Env vars.** `app/lib/config/env.ts` — one Zod schema (`DATABASE_URL: z.string().url()`), parsed once at import time. Replaces `process.env.DATABASE_URL!` in `prisma.ts` and `prismaSeed.ts`; a missing or malformed value now throws immediately, naming the variable, instead of failing three files away in `PrismaPg`'s constructor.
- **`localStorage` POIs.** `app/modules/maps/types/poiSchema.ts` (`poiSchema`) replaces `JSON.parse(stored) as POI[]` in `usePOIManager.loadPOIs`. Entries are validated one at a time; invalid ones are discarded with a `console.warn` and the rest still load — hand-edited or stale storage no longer crashes the map. The category enum is derived from `POI_CATEGORIES` rather than repeating the `POICategory` union, so the two cannot drift apart.
- **GeoJSON.** `app/api/countries/worldGeoJson.ts` (`worldGeoJSONSchema`) replaces the `as GeoJSONData` casts in both `app/api/countries/search/route.ts` and `app/api/countries/[id]/route.ts` — a corrupt `world.geojson` now logs and degrades (empty list / 500) instead of an unchecked cast failing later at whichever field happened to be read. Separately, `MapMain.tsx`'s POI _import_ dialog — genuinely untrusted, user-supplied input, unlike the app's own bundled `world.geojson` — gained `poiGeoJSONSchema`, replacing `JSON.parse(text) as POIGeoJSON`.
- **Prisma result casts.** `buildEntitySchema.ts` gained `buildResultSchema`, reused by all four `fetchFiltered*.ts` in place of `result as Spell[]` (and `magicitems`' hand-rolled `attuned === true` coercion). It validates the same field shape as a create payload plus `id`, but nullable DB columns (`spells.concentration` is `NULL` on 357 of 361 live rows, despite the interface declaring it required) fall back to the field's declared `defaultValue` instead of failing — verified against the real database, not just seed data. A genuine type mismatch still throws a `DatabaseError` naming the operation, with the Zod error as `cause`.

**Tests (+13):** `env.test.ts`, `poiSchema.test.ts`, `usePOIManager.test.ts` (discards an invalid category, tolerates non-array storage), `worldGeoJson.test.ts`, `search/route.test.ts` and `[id]/route.test.ts` (malformed file → empty list / 500, not a crash), and `buildResultSchema` cases added to `buildEntitySchema.test.ts` (null → default, drifted type rejected, missing id rejected) plus a `fetchFilteredSpells.test.ts` proving the wiring end to end.

**Not done:** the response.json() cast in `MapMain.tsx`'s `handleCountrySelect` (`as GeoJSON.Feature`) — that response comes from `/api/countries/[id]`, which this item already validates server-side, so a second client-side check would be redundant. Left as-is.

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
- `package-lock.json` is deleted; pnpm is the only manager. `packageManager: "pnpm@10.23.0"` and `engines: { node: ">=22" }` are declared. (Raised to `>=24` by [[TD-34]] on 2026-07-31 — this line records what TD-07 set, not the current value.)
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

**No screenshots, deliberately, at the time.** The UI had not been touched yet — correctness work came first — so screenshots would have advertised a raw interface and dated immediately. Rather than leave placeholders that read as an oversight, the README stated the sequencing outright. Also removed `public/hero-{desktop,mobile}.png` — 600 KB of unreferenced Next.js-tutorial images that TD-06 missed.

**Screenshots added 2026-08-01** (ROADMAP Phase 2, item 14), once the bilingual UI (TD-21) and accessibility pass (TD-15) had actually landed: a filtered spell list and the interactive map, captured with Playwright against the seeded dataset. Taking the map screenshot surfaced a real bug — see TD-34.

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

**Step 4 done (2026-07-27): `no-explicit-any` is an `error`.** The count reached zero, so CLAUDE.md rule 3 is enforced by the linter now instead of by good intentions.

The last six lived in five foundational files, and none was a local shortcut — each was a type that switched checking off for everything downstream:

| File                | Was                                | Now                           |
| ------------------- | ---------------------------------- | ----------------------------- |
| `ListItem`          | `[key: string]: any`               | `unknown`                     |
| `FormField`         | `value: any`, `onChange: (v: any)` | `MetaValue`                   |
| `isValidDataArray`  | narrows to `any[]`                 | `unknown[]`                   |
| `controlComponents` | `ComponentType<any>`               | `ComponentType<ControlProps>` |
| `sortByField`       | `sortedValues: any[]`              | `PrimitiveValue[]`            |

**`ListItem` was the interesting one.** Switching it to `unknown` produced 17 errors in 8 files, and the root cause is worth knowing: a TypeScript **interface** gets no implicit index signature, so `Spell` does not satisfy `Record<string, unknown>` — while `{[k: string]: any}` accepted anything. The generic constraints became `T extends object`, with one documented narrowing (`readField`) where the hook genuinely reads a field by a runtime key.

**`controlComponents` needed the four controls to agree.** They wanted `string`, `boolean` and `SelectValueType` respectively, which is why the registry was `any`. They all take `MetaValue` and narrow it themselves now — which they were already doing at runtime: `CheckboxInput` compared `value === true` defensively, `Select` already handled being handed an array.

**Warnings fell 119 → 89** as a side effect: typing the control layer also removed `no-unsafe-function-type` and much of the `no-unsafe-*` family around it. The remaining 89 are TD-22's, concentrated in the maps module.

**One piece of unwired scaffolding got a type rather than a deletion.** `SelectButtonery.itemStats` is optional, no caller has ever passed it, and its shape (`partial[value]`, `filtered[value]`) matched nothing. Per "unused is not dead" it stays, now as `FilterOptionStats` — so whoever wires it has the shape the component expects instead of reverse-engineering it from index expressions.

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

### TD-09 ✅ Duplicated per-domain components — **DONE (2026-07-27)**

Delivered in three parts, one PR each, because together they were ~1.300 lines and unreviewable:

| Part          | Removed                                                           | Replaced by                           |
| ------------- | ----------------------------------------------------------------- | ------------------------------------- |
| Lists         | `SpellList`, `PngList`, `DeityList`, `MagicItemsList` — 444 lines | `EntityList` + `listConfig`           |
| Page managers | four hooks, 421 lines                                             | `usePageManager` + `formFields`       |
| Forms         | four ~60-line shells                                              | `EntityForm`; layouts stay per-domain |

**The layout deliberately stays per-domain.** This item says to keep a per-domain component only where the domain genuinely differs, and the field arrangement is exactly that. Encoding it as configuration would move CSS into data. What was removed is the boilerplate around it: state, submit, error handling, title, buttons.

**The duplication had already cost real defects**, all found while collapsing it: three in the deities list alone (a column reading the wrong field through the wrong metadata, a missing header, an empty message naming the wrong domain), a mount effect silently filtering the spell list ([[TD-27]]), a page manager mutating a value returned by a hook, and two prop names for the same thing.

**Sequencing note:** this ran before TD-19 rather than after, which the execution order suggested. The real constraint was TD-08 (done), and going first shrank the surface TD-19 has to rename.

The original description follows.

---

### TD-09 (original) 🟠 Duplicated per-domain components

`app/ui/{spells,png,deities,magicitems}/` each contain a `XxxCard`, `XxxList`, `XxxLibrary` and `XxxForm` that are roughly 80% identical — same structure, same sorting header, same pagination, differing only in which fields they read. The same duplication exists in `app/lib/hooks/{spells,png,deities,magicitems}/useXxxPageManager.ts`.

Since the metadata layer already knows every field of every domain, this duplication is unnecessary by construction.

**Fix**

1. Extract `<EntityList meta={pagesConfig[pageType]} items={…} />` and `<EntityCard>`.
2. Collapse the four page-manager hooks into `usePageManager(pageType)`.
3. Keep a per-domain component only where the domain genuinely differs.

**Sequencing:** do this _after_ TD-08. Refactoring against `any` types means the compiler cannot help you; refactoring against a discriminated union means it catches nearly every mistake.

---

### TD-10 ✅ Notification system is a stub — **DONE (2026-07-27)**

**The bug was the conflation, not the missing branch.** `sendNotification` took a `channel` of `"console" | "snackbar"`, implemented only `console`, and was called from both server and client code. On the server a "notification" reached a terminal while the user saw nothing — a function named after a UI affordance it never had.

Two audiences, two functions:

- **`notify.ts`** (client) raises a sonner toast. `<Toaster />` is mounted once in the root layout — **sonner has been a dependency all along with nothing rendering it.**
- **`logServerIssue`** (server) writes to the console and does not pretend otherwise. `auth.ts` and `actions.ts` use it for a rejected sign-in, where the user already learns the outcome from what `authenticate()` returns to the form; `getQuery` uses it for a metadata key that does not resolve, which is a programming error nobody can act on from the UI.

**The vendored Toaster was deliberately not reused.** `app/modules/maps/components/ui/sonner.tsx` styles itself from CSS variables — `--popover`, `--popover-foreground`, `--border`, `--radius` — referenced there and **defined nowhere in this project**. It came with the maps module and expects a shadcn theme that was never installed, so at app level it would render toasts with empty colours. It also calls `useTheme()` with no ThemeProvider mounted. The project-level one is fifteen lines and uses `richColors`.

**This closes TD-13's last step.** `DeleteButton`'s two `alert()` calls are toasts, and a successful delete now says so rather than only refreshing the list. No `alert()` remains in the codebase.

**Verified through the UI**, not just by unit test: a throwaway record deleted from the admin list produced a green toast reading "ZZZ Toast Test eliminato", bottom right, with the list refreshing behind it.

**Also fixed while in the root layout:** the page title was still the tutorial's. Every tab in the app read _"… | Acme Dashboard"_, with a description advertising "The official Next.js Learn Dashboard" and a `metadataBase` pointing at `next-learn-dashboard.vercel.sh`. Separate commit.

The original description follows.

---

### TD-10 (original) 🟠 Notification system is a stub

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

### TD-12 ✅ Pagination reads the table twice with divergent queries — **DONE (2026-07-27)**

**The drift this item predicted had already happened, and it was reachable.** `fetchFilteredX` and `getXCount` each carried their own copy of the filterable-field list, and two of the four had diverged: the spell count was missing `nome`, and the NPC count listed **four** of the twelve fields the NPC fetch used.

Measured in the browser before the fix:

| URL                                       | Header said                    | Table rendered |
| ----------------------------------------- | ------------------------------ | -------------- |
| `/dashboard/admin/png?titolo=Arcivescovo` | 119 di 119 PNG trovati         | **0 rows**     |
| `/dashboard/admin/spells?nome=Dardo`      | 361 di 361 incantesimi trovati | **0 rows**     |

The rows were filtered, the count was not, and the pagination control offered thirteen pages of nothing. Not hypothetical, and not waiting on a future filter control — an edited URL was enough.

**Fixed by declaring the list once**, in `app/lib/config/queryFields.ts`, read by both functions. The alternative the item suggested — `prisma.$transaction([findMany, count])` — does not fit the architecture any more: TD-30 moved the rows behind a `<Suspense>` boundary so they stream, while the count is awaited in the page for the header and the pagination control. One shared declaration keeps both honest without giving that up.

`magicitems` keeps its narrower list (no `nome`, no `descrizione`). Its two functions already agreed with each other, so this preserves their behaviour rather than quietly widening it.

**Regression test** in `pagination.spec.ts`, written first and confirmed red — _expected 30, received 0_. After: `?nome=Dardo Incantato` reports **1 and renders 1**, which is the check that matters; two zeroes would also have "agreed".

The original description follows.

---

### TD-12 (original) 🟡 Pagination reads the table twice with divergent queries

`fetchFilteredX` and `getXCount` each build their own filter from the same search params. If one drifts from the other, the pagination control shows a page count that does not match the rows returned — a classic silent bug.

**Fix:** build the `where` clause once and pass it to both, or use a single `prisma.$transaction([findMany, count])`.

---

### TD-13 ✅ Opaque error handling — **DONE (2026-07-27, closed by TD-10)**

**Outcome:** `app/lib/errors/` holds a three-class hierarchy — `AppError` (abstract, carries its own `httpStatus`), `NotFoundError` (404) and `DatabaseError` (500, always constructed with the original error as `cause`). `toErrorResponse` maps a thrown error to a response, so the status lives with the error rather than being re-decided per handler.

**Two distinct bugs, both closed:**

1. **The cause was discarded.** Five `fetch*` functions did `console.error(error)` and then threw a fresh `Error("Failed to fetch …")`. With Postgres stopped, `/dashboard` said only _Failed to fetch card data._ — diagnosing it meant `docker ps`. They now throw `DatabaseError`, and `ECONNREFUSED` travels with the message. **Zero `console.error` remain in `app/lib/data/`.**
2. **A missing record was a 500.** The four `delete*ById` functions returned a bare `boolean`, so "no such row" and "the database is unreachable" were the same value and every handler answered 500 to both. They return `void` and throw now; a missing record is a 404.

**Tests (158, +17):** `errors.test.ts` covers the classes, including that `cause` survives and that subclasses report their own `name`; `errorPropagation.test.ts` covers the _call sites_, which is the regression that matters — nobody can quietly restore `console.error(error); throw new Error(…)` without a test going red. The endpoint suite gained 404 and 500 cases per domain, and `validation.spec.ts` now asserts 404 rather than merely "not 400".

**A small vindication while writing those tests:** the first run failed with `spells.count is not a function` — an incomplete Prisma mock of mine, reported precisely because `DatabaseError` had preserved the cause. Under the old code it would have read _Failed to fetch card data._

**Closed by TD-10, same day.** `DeleteButton`'s two `alert()` calls became `notifySuccess` / `notifyError` toasts when TD-10 landed, so the 404-vs-500 distinction this item wanted now actually reaches the user instead of stopping at the handler's return value. This entry stayed open in the register past that date — TD-10's own outcome note said as much at the time — nothing but the paperwork was missing.

**Verified 2026-07-30:** no `alert()` remains anywhere in `app/`, and `sendNotification` / `sendErrorNotification` no longer exist as functions — replaced by `app/lib/notifications/notify.ts` (client) and `logServerIssue.ts` (server).

The original description follows.

---

### TD-13 (original) 🟡 Opaque error handling

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

### TD-15 ✅ No accessibility pass — **DONE (2026-07-27)**

**Outcome:** `e2e/a11y.spec.ts` asserts **zero** axe violations across eleven pages — every list, every admin list, two forms and the dashboard — instead of the per-page allowlist TD-24 had to ship. Plus a keyboard test axe cannot express.

What the allowlist contained, and where each went:

| Violation                | Nodes        | Fix                                                                                                                                                                                                                                         |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color-contrast`         | 18–19        | White on `violet-500` measured **4.4:1** against the 4.5:1 that 14px text needs — it missed by a tenth, on every primary button in the app. White on `rose-500` measured 3.75:1. Both variants moved one step darker; violet-600 is ~5.9:1. |
| `link-name`              | 4–5 per page | The sidebar's icon-only "manage" links, and the pagination arrows. Both carry an `aria-label` now, and their icons are `aria-hidden`.                                                                                                       |
| `button-name`            | 3            | The icon-only sort controls in every table header. They name the column they order by.                                                                                                                                                      |
| `aria-toggle-field-name` | 0            | Already gone before this pass started — a stale entry, which is exactly the failure mode an allowlist has.                                                                                                                                  |

**Also fixed:** `app/ui/search.tsx` declared `<label htmlFor="search">` against an id no input carried, so the search field had no accessible name at all. That is why `filtering.spec.ts` had to reach it by placeholder; the workaround comment there is now obsolete but the selector still works.

**The focus ring, and a correction worth recording.** I first measured a focused button as `outline-style: none` and wrote that keyboard users had no indicator at all. That was wrong, and the method was the reason: **a programmatic `.focus()` does not match `:focus-visible`**, so the computed style reports `none` on a perfectly fine button. Tabbing there with a real keypress showed the browser's own `outline: auto 1px`. So this is not a fixed WCAG failure — it is a thin, browser-dependent default replaced with an explicit 2px ring at an offset, which reads on both the white sidebar and the dark content area. The test uses real `Tab` presses for the same reason.

**Not done:** `jsx-a11y` was already satisfied — it ships inside `eslint-config-next`, so TD-05 met that half on arrival. A screen-reader pass with an actual screen reader has not been attempted; axe covers the machine-checkable part only.

The original description follows.

---

### TD-15 (original) 🟡 No accessibility pass

Never audited. Likely issues given the component inventory: custom `Select` and `Modal` implementations (keyboard trap and ARIA correctness unverified), icon-only buttons in `MapControls` and `SortButton` (need accessible names), form inputs (label association unverified), and no visible focus-state audit.

**Fix:** add `eslint-plugin-jsx-a11y` (catches the static issues for free), add `@axe-core/playwright` assertions to the E2E suite, then do a manual keyboard-only pass over each list page and form. Accessibility is disproportionately noticed in portfolio review.

---

### TD-19 ✅ Mixed Italian/English identifiers — **DONE (2026-07-30)**

> **Correction (2026-07-30, docs audit).** The outcome below claims "every
> TypeScript/Prisma identifier is English". **It is not**, and the claim was never
> true as written: 16 Italian identifiers across 14 files and one directory
> survived this item, including two — `Circolo`→`Circle` and `Tarocco`→`TarotCard`
> — that the enum list further down explicitly names as renamed. Filed as
> **[[TD-33]]**. This entry is left as written, per the register's convention of
> keeping dated records intact; read it as "the metadata-layer rename is done",
> not as "no Italian identifier remains". The verification described below was
> real but scoped to what the compiler and the test suite could reach — which is
> exactly why it missed a set of identifiers that nothing type-checks against.

**Outcome:** every TypeScript/Prisma identifier is English. Postgres columns keep their Italian names via `@map` (per ADR-0005) — except the `png` table itself, which had no `@map` fallback available and so was actually renamed to `npc` (see below). No behaviour changed; `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check` are green (173/173 unit tests), and the touched E2E specs (npc-crud, pagination, filtering, spells-crud, deities-list, validation, a11y — 48 tests) were re-run and pass.

**The database surprise this item's own sequencing note didn't anticipate.** Step 6 says "`png` → `npc` throughout, including the route segment and `PageType`" as if it were purely a TS-side rename like the others. Renaming the Prisma **model** `png` to `npc` renames the table too — `@map` only retargets a _field_, and there is no `@@map` equivalent left pointing at the old table name unless you add one deliberately. `prisma db push` reported it would drop the `png` table (119 rows) to recreate it as `npc`. Fixed with a hand-written migration, `ALTER TABLE "png" RENAME TO "npc"` — zero rows lost, verified by row count before and after — applied directly against the `db push`-managed development database and resolved via `prisma migrate resolve --applied`, the same pattern TD-11 established. Anyone repeating this move (a future model rename) should expect the same and budget for a real migration, not just `@map`.

**The `metaField` string literals were exactly the trap ADR-0005 predicted, and it caught two real misses.** `getQuery.ts` hardcodes the free-text-search and default-sort field as a literal (`whereClause.nome`, `orderBy.push({ nome: ... })`) — invisible to any enum-based search, and not covered by the "rename the enums" steps at all; found via the test suite going red, exactly the safety net the sequencing note was written to require. `NpcMetaField.alignmentDomain`'s value was first written as `"alignmentdomain"` (lowercase, matching the _old_ raw db column) instead of `"alignmentDomain"` (the new Prisma-facing field name) — caught by `pnpm typecheck`, not by inspection. Both are the "misses one string, doesn't fail to compile, silently stops filtering" failure this item's blocking note describes; the second one very nearly did exactly that.

**The reserved word.** `deities.classe` had no clean English single-word identifier once `class` was taken by the language — `class` is valid as a Prisma field name (property position) but not as a bare enum member. Resolved as `DeityMetaField.deityClass = "class"`: the member name is unambiguous TypeScript, its value is the exact Prisma field name `filterByMeta.ts` looks up at runtime.

**E2E specs needed the same fix as production code, for the same reason.** `pagination.spec.ts` had `?nome=Dardo` and `filtering.spec.ts` waited on `/livello=2/` — both are query-string literals `validateParams.ts` matches against `pageMetaFields` keys, so post-rename they would have matched nothing, silently returned the unfiltered set, and the test would have passed anyway (self-consistent count-vs-rows assertions don't care that the filter never actually applied). Not a hypothetical: caught by actually running the specs, not by reading them. This is the transitional-state warning in CLAUDE.md generalized to test code — a `.spec.ts` file is exactly as string-keyed as `getQuery.ts` is.

**What stayed Italian, deliberately:** game-data enum _values_ (`Subclass.BardoSapienza`, `Rarity.Comune`), campaign content, UI `label`/`placeholder` copy, and the `PNG` abbreviation in on-screen text (legitimate D&D-Italian shorthand for _Personaggio Non Giocante_ — not the collision with the image format the item's own description was worried about, which was a code-identifier problem, not a copy one). Nine other renamed enum files (`Rarita`→`Rarity`, `Allineamento`→`Alignment`, `DominioAllineamento`→`AlignmentDomain`, `Fazione`→`Faction`, `Circolo`→`Circle`, `SottoClasse`→`Subclass`, `ColoreMagia`→`MagicColor`, `Elemento`→`Element`, `Festivita`→`Holidays`, `GradoPatrono`→`DeityRank`, `NomePatrono`→`DeityName`, `TipoPatrono`→`DeityType`, `TitoloPatrono`→`DeityTitle`, `TipoTradizione`→`TraditionType`, `Tarocco`→`TarotCard`) kept their enum member names as the D&D terms where translating them would have produced worse identifiers than the Italian originals (`Subclass.WarlockFatato`, not `Subclass.FeyPatronWarlock`).

**Verified against the running app, not just the type checker.** All four domain admin lists, their sort/filter controls, and edit-form pre-population (including the `class` field) were exercised in a browser against the real 119-NPC / 361-spell / 62-item / 6-deity dev database — same counts before and after, no console errors, edit forms correctly pre-filled from existing records.

The original description follows.

---

### TD-19 (original) 🟠 Mixed Italian/English identifiers

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

### TD-20 ✅ TypeScript strictness stops at `strict` — **DONE (2026-07-31)**

**TD-20b outcome (2026-07-31).** `noUncheckedIndexedAccess` is now on. The "exclude the maps module via its own tsconfig" option this item left open turned out not to exist as stated: TypeScript compiler options apply per-Program, not per-directory — a file reachable by import (as every file in `app/modules/maps/` is, via `WorldMap.tsx`) is checked under the root program's options regardless of `exclude`. The only real mechanism for a different option set on a subtree is Project References (`composite: true`, declaration emission, separate `tsc --build` step), which was judged too large and too risky against `next typegen`'s pipeline for what this item needs. Went with the other documented option instead: a non-null assertion at each of the 20 sites, one line each, with a comment naming why the index is safe there (loop bound, prior length check, a fixed-length literal array, or a regex with a known capture-group count) — the same pattern this item's own `firstOptionValue.ts` helper already established for the identical problem. No behaviour change; nothing here was a guess, each assertion states the invariant that makes it true.

Six more errors than the 20 this item recorded showed up on enabling the flag — none in the maps module. `firstOptionValue.ts` itself needed one (its own doc comment already argued for exactly this fix but the assertion was never added), and TD-02b's test additions (`fetchFilteredSpells.test.ts`, `buildEntitySchema.test.ts`) had three untyped array-index reads each apparently safe by test construction. Fixed the same way. `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check` all green (213/213 unit tests).

**`noUnusedLocals` stays rejected**, per the reasoning already recorded below — the 13 "unused" imports in `WorldMap.tsx` are deliberate unwired scaffolding, not dead code, and forcing their deletion would fight that practice rather than serve it. Nothing else in this item remains open.

The original TD-20b framing follows for context.

### TD-20 (original framing) ◑ TypeScript strictness stops at `strict` — **batch 1 partly done (2026-07-22)**

**Where:** `tsconfig.json`

**Enabled (TD-20a):** `target: ES2022`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noUnusedParameters`. `typecheck` stays green. Fixes were small: `_`-prefixed the required-but-unused `request` params in the four DELETE handlers and `prevState` in `authenticate`, two `override` keywords in `MapErrorBoundary`, three explicit returns in effects, and two dead destructured props (`buttonState`, `searchParams`) dropped from `BaseButton` / `ListPage` — both still declared in their interfaces and passed by callers, just no longer read.

**Batch two, part one — `exactOptionalPropertyTypes` enabled (2026-07-27).** 28 errors, every one the same shape: an optional property declared `x?: T` receiving `T | undefined`. Under this flag those differ — `?` means "absent or T", not "T or undefined" — which is the distinction it exists to draw. Each declaration was made to say what it accepts (`x?: T | undefined`) rather than anything being silenced. Two vendored shadcn components needed real fixes rather than widening (`sonner`'s theme cast is `NonNullable` now; `dropdown-menu` spreads `checked` conditionally instead of forwarding a destructured optional). No `@ts-expect-error` anywhere.

**Batch two, part two — `noUncheckedIndexedAccess` is NOT enabled, and this is the reason.** It reports 54 errors. All 34 outside `app/modules/maps/` are fixed, so the flag is one directory away; the remaining **20 are all in the vendored maps module**, and they are index reads in geometry code: `points[i]` in `useMeasurement`, bounds destructuring in `maps.ts`, regex capture groups in `coordinates.ts`, `selectedLayer` in the tile switcher.

They are worth fixing — a wrong index there produces `NaN` silently rather than throwing. But a `?? 0` in a distance calculation changes an answer instead of preventing a crash, and the E2E map coverage is mount, world-switch and context-menu; it does not exercise measurement at all. Rewriting twenty sites of vendored geometry that no test covers is how a refactor quietly changes what the map reports.

**Done when** either the maps module gains coverage for measurement and coordinates and then the twenty are fixed, or the module is excluded from the flag through its own tsconfig. Not "when someone adds twenty `?.`".

What the app-side work bought, even with the flag off: `availableMaps[selectedMap]` now falls back instead of assuming the index is valid, `fieldMeta[key]` is read once and guarded in four places, and `defaultValue: list[0].value` goes through `firstOptionValue`.

**A rejected approach, recorded so it is not retried.** The nineteen `defaultValue: list[0].value` declarations were first fixed by annotating every option list as a non-empty tuple. That silently _widened_ several of them — a numeric list declared `SelectOption` rather than `SelectOption<number>` turns `defaultValue` into `string | number` and breaks the `PageMeta` discriminated union TD-08 built. One helper with one documented assertion replaced nineteen annotations.

**Split out on purpose — measured, not as the doc assumed:**

- **`noUnusedLocals` (41 errors) — likely rejected for this repo, not just split.** Some are genuine dead imports, but **13 are in `app/ui/geography/WorldMap.tsx`**, and the DM has confirmed those are _unwired scaffolding, not dead code_: the maps module (`app/modules/maps/`) is a vendored library and `WorldMap` is a thin MVP that will wire more of it up over time. `noUnusedLocals` would force deleting exactly that optionality. So this flag conflicts with a deliberate practice here (keep unused-but-intended imports/handlers) and should probably **not** be enabled — or only with those files excluded. Decide with the DM before touching it; do not delete the scaffolding to satisfy the flag.
- **`verbatimModuleSyntax` — 211 errors, not "low, mechanical" as the row below claims.** Auto-fixable but a 211-line diff across the repo; it deserves its own reviewable commit.

One dead prop remains (`ListPage.searchParams`): declared in its interface, never read. Clean it with the `noUnusedLocals` pass. (`BaseButton.buttonState` was the other one — it is no longer dead: the planned loading/active/disabled/default feature was implemented 2026-07-25, so the prop is now read and drives the rendered button. Its ad-hoc predecessors — `SelectButtonery`'s hand-rolled `bg-violet-700` active styling and `PageForm`'s manual save spinner — were folded into it.)

**Follow-up left by that change:** `app/ui/components/Spinner.tsx` (the full-page framer-motion loader) is now unreferenced — `PageForm` was its only caller, and the loading state uses a small inline `animate-spin` SVG instead, which suits a 40px button far better than a `min-h-100` page loader did. Per the _unused is not dead_ rule, it was left in place: it reads as an intended full-page loader (e.g. for a future `loading.tsx`), not a tutorial leftover. Wire it into a real page loader or retire it deliberately — do not delete it in a drive-by cleanup.

**No longer blocked.** TD-08 is done: the `any` count is zero and `no-explicit-any` is an error, so the next tier of strict flags can be attempted whenever someone picks this up.

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

### TD-21 ✅ UI strings are hardcoded; the app must ship in Italian and English

**Where:** `app/ui/**`, `app/dashboard/**`, `app/lib/config/**` (the `label` / `placeholder` fields and every options array)
**Decision:** [ADR-0006](./adr/0006-bilingual-ui.md)
**Blocked by:** nothing — TD-08 and TD-19 are both done

> **The "do them together" plan is void (noted 2026-07-30).** This item used to
> read _"Do together with: TD-19 (same 54 files)"_, and ROADMAP.md still framed
> the two as deliberately adjacent to halve the cost of opening those files once.
> **TD-19 shipped alone on 2026-07-30**, so that saving is already spent: this
> item now pays the full cost of reopening the domain files by itself. Nothing
> blocks it, and the sequencing argument for pairing them no longer applies —
> do not go looking for a way to combine them.
>
> One consolation: TD-19 renamed the field identifiers first, so the string
> extraction below happens against English keys (`labelKey: "spells.level.label"`,
> not `"spells.livello.label"`), which is the better order of the two.

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

**Progress (2026-07-30) — step 1 done, uncommitted on `td-33-italian-identifiers`, not yet its own branch.**
Steps 3–8 not started. What's in the working tree:

- `next-intl` installed; `i18n/routing.ts` (`localePrefix: "as-needed"`, `it`/`en`), `i18n/navigation.ts`, `i18n/request.ts`.
- Routes moved: `app/dashboard`, `app/login`, `app/page.tsx` → `app/[locale]/`. Root `app/layout.tsx` deleted; `app/[locale]/layout.tsx` now holds `<html>`/`<body>` plus `NextIntlClientProvider` and `generateStaticParams`.
- `proxy.ts` rewritten to compose next-intl's middleware with the TD-01 auth gate. **Do not simplify this back to `NextAuth(authConfig).auth((req) => intlMiddleware(req))`** — two real bugs were found and fixed there:
  - Passing a callback into `auth()` makes NextAuth **skip its own redirect-to-login branch entirely** (confirmed by reading `next-auth/lib/index.js`: the `authorized`/redirect branch is only reached when `auth()` is called with no wrapped handler). That composition silently disabled TD-01's gate — caught by `e2e/auth.spec.ts`'s "unauthenticated visit redirects to login" test going green→red.
  - NextAuth's internal signIn-page check is a literal `pathname !== authConfig.pages.signIn` (`"/login"`, unprefixed) — it never matches a locale-prefixed path like `/en/login`, which loops the auth redirect against next-intl's own locale redirect forever for any non-Italian `Accept-Language`. Fixed by replicating the gate manually in `proxy.ts` with `getToken` (session read, no redirect side effect) and a locale-stripping compare instead of relying on NextAuth's built-in redirect.
  - Verify any future change to `proxy.ts` against `pnpm test:e2e e2e/auth.spec.ts --project=unauthenticated` (all 4 cases) — that spec is what caught both bugs.
- `admin/*/new/page.tsx`'s `redirect()` calls and the root `page.tsx` switched from `next/navigation` to `i18n/navigation.ts`'s locale-aware equivalents.
- `messages/it.json` / `messages/en.json` created empty (`{}`) — no keys yet.
- Verified: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` (173/173), `pnpm test:e2e e2e/auth.spec.ts --project=unauthenticated` (4/4), `pnpm test:e2e e2e/filtering.spec.ts --project=chromium` (4/4, exercises the authenticated flow through the restructured routes).

**Where step 3 stalls, and why it wasn't started.** `PageMeta.label`/`.placeholder` and `SelectOption.label` are structurally-typed and used by every domain config file — renaming them to `labelKey`/`placeholderKey` is not containable to spells-as-a-template the way step 5's file-by-file extraction is. TypeScript forces the rename across all ~19 config files (4 `*Meta.ts` + ~15 options arrays) in the same pass, even though only one domain would get real translation keys wired up immediately. That's a mechanical, low-judgment rename once the shape is decided — a good candidate to run on a cheaper model, one domain at a time, verifying `pnpm typecheck` after each.

**The design call this step needed is now made: [ADR-0007](./adr/0007-message-key-resolution-boundary.md).** Read it before touching any file — it changes the shape of the work described above.

> **Correction (2026-07-30).** An earlier version of this note recommended "a small resolver component" returning `ReactNode` from `getDatum`. **That approach is wrong and is rejected in ADR-0007.** It fails on three counts, all visible in the existing consumers: `sortSelectOptions` sorts by label text _before_ render so a key cannot be ordered; `placeholder` and `<option>` text are string attributes a `ReactNode` cannot fill; and Server Components would each need a client boundary. The note is corrected rather than deleted because the idea looks reasonable until you check what the consumers do with the value.

ADR-0007's shape, in brief: split `SelectOption` (authored, `labelKey`) from `ResolvedOption` (render-ready, `label`), bridged by one pure `resolveOptions(options, t)` that works under both `useTranslations` and `getTranslations`. `sortSelectOptions`/`getDataLabel` keep their logic but accept only `ResolvedOption[]`, so a missed resolution is a type error. `getDataLabel`'s string-keyed `customLabel?: string` becomes a typed `useShort?: boolean` — that parameter is a live instance of the string-keyed hazard `CLAUDE.md` warns about, and the rename silently breaks it.

**Measured before deciding (2026-07-30):** 39 `getDatum` declarations, of which **22 are `(datum) => getDataLabel(sameOptions, datum)`** restating what the field's own `options` already says — ADR-0007 deletes those rather than threading a translator into them. 7 sites read `SelectOption.label`; 4 read `PageMeta.label`.

**The content question is settled (2026-07-30): `tarotCards`, `factions` and `locationList` ARE translated**, like every other option list — their names are descriptive, not invented proper nouns, so they are not a category-3 exception under ADR-0006. There is no second shape and no untranslated list. `celestialBodies` was not covered by that decision; confirm it the same way when extraction reaches it. Do not reopen this as "should the DM's world be translated" — campaign content in Postgres is untouched and stays untouched; only the _config_ lists were ever in question.

**Suggested execution order** — mechanical now that ADR-0007 is accepted, so a cheaper model suits it (Haiku 4.5, low/medium effort), verifying `pnpm typecheck` after each step:

1. `SelectOption` → `labelKey`/`shortLabelKey`; add `ResolvedOption`; add `resolveOptions`.
2. `sortSelectOptions` + `getDataLabel` to `ResolvedOption[]`; `customLabel` → `useShort`.
3. The 7 `SelectOption.label` consumers, then the 4 `PageMeta.label` ones.
4. Config files **one domain at a time, spells first as the template** — each domain means: keys into the config file, and the matching entries into _both_ `messages/it.json` and `messages/en.json` in the same commit. Never leave a key without both catalogue entries. SRD terms take their published translations; do not invent English for a game term.
5. Delete the 22 redundant `getDatum` closures (separate commit — it is a behaviour-preserving deletion and must be reviewable on its own).

Steps 6–8 of the original fix list above (inline component copy, the locale switcher, the CI key-set check) come after all of this and are untouched by ADR-0007.

**Progress (2026-07-30) — steps 1–3 done, step 4 done for spells (the template domain), on branch `td-21-message-key-resolution`.**

- **Step 1.** `SelectOption` (`app/lib/definitions/types/SelectOption.ts`) now has `labelKey`/`shortLabelKey`; `ResolvedOption` (`label`/`shortLabel`) and `resolveOptions(options, t)` added alongside it.
- **Step 2.** `sortSelectOptions` and `getDataLabel` accept `ResolvedOption[]`; `getDataLabel`'s `customLabel?: string` is now `useShort?: boolean`. **One case the ADR didn't cover surfaced here:** `deityMeta.ts`'s `color` field used the same string-keyed parameter to pull a CSS class (`colorClass`) rather than a label — not a translation concern at all. Split into a dedicated `getOptionColorClass(options, value)` (`app/lib/utils/data/getOptionColorClass.ts`), called directly from `DeityCard.tsx` instead of through `getDatum`.
- **Step 3.** The 7 `SelectOption.label` consumers (`Select/index.tsx`, `SelectButtonery.tsx`, `SortableHeader.tsx`, `FormField.ts`) now resolve via `resolveOptions(options, t)` with `useTranslations` (client components). **`PageMeta.label` itself was left untouched** — ADR-0007 only decides the `SelectOption`/`ResolvedOption` split, not field-label keying, and the 4 sites reading `PageMeta.label` (`EntityList.tsx` ×2, `FormErrorSummary.tsx`, `InputComponent.tsx`) weren't broken by the option-type change, so there was nothing there to migrate under this ADR.
- **Step 4 (spells only).** All six spells option lists (`levels`, `subclasses`, `classes`, `tempiDiLancio`, `gittate`, `durate`, `tiriSalvezza`) converted to `labelKey`; `messages/it.json` and `messages/en.json` both carry the full `spells.*` key set (levels, classes, subclasses, casting times, ranges, durations, saving throws). SRD terms (classes, Wizard schools, Cleric domains, Druid circles, Warlock patrons) got their official English names; the setting's own homebrew subclass flavor (`Cavaliere Nero` → "Black Knight", the elemental Sorcerer reskins) got literal descriptive translations, same treatment as `tarotCards`/`factions`.
- **Step 5 done for spells, ahead of schedule** (the user chose to do steps 4+5 together per domain rather than as one pass at the end across all domains — the redundant `getDatum` closures would not otherwise have compiled once their options lost `.label`). `PageMeta.getDatum` is now **optional**: an option-backed field displays through its `options`, not through a hand-written lookup closure. New `resolveFieldValue(meta, value, t, useShort?)` (`app/lib/utils/data/resolveFieldValue.ts`) is the one place that decides "resolve via options" vs. "call `getDatum`" — `renderFieldValue.ts` (used by `EntityList.tsx`, every domain's admin list) and `SpellCard.tsx` both call it now instead of indexing `getDatum` directly. Deleted the 5 redundant spells closures (`level`, `circle`, `classes`, `castingTime`, `range`, `duration`, `savingThrow` — 7, not 5); kept `components`, `ritual`, `concentration`, `upcast` (genuine formatters).
- **A second, unrelated hazard found and fixed while touching `subclasses.ts`:** its module-level sort ordered by `label` text — resolved too late to know at that point, exactly ADR-0007's constraint #1 ("sorting happens before render"). Changed the fallback comparator from `label.localeCompare` to `value` order (the enum happens to already group entries by class); documented in the file. This changes the raw declaration order `SelectButtonery` renders in when it doesn't go through `sortSelectOptions` — worth knowing if a filter button row's order looks different from before.
- **A Server/Client Component trap hit and fixed:** `SpellCard.tsx` has no `"use client"` of its own but is pulled into the client bundle transitively (`SpellLibrary.tsx` is `"use client"`) — `await getTranslations()` (server-only) threw at runtime despite compiling cleanly. Fixed by switching to `useTranslations()` (sync, client) and dropping `async` from the component. **Watch for this same trap in the other three domains' Card components** — check whether each is actually reached from a `"use client"` ancestor before choosing `getTranslations` vs. `useTranslations`.
- **Verified in the browser**, both locales: `/dashboard/spells` (Italian, default) renders "Bardo, Chierico, Druido..." class filters, "Trucchetto, 1° Livello..." level filters, and an expanded card shows "1 Azione Standard" / "9 Metri" / "8 Ore" / translated subclass names. `/en/dashboard/spells` renders "Bard, Cleric..." / "Cantrip, Level 1..." and the same card in English ("1 Action" / "9 Meters" / "8 hours" / "Paladin - Black Knight, ..."). `pnpm typecheck` / `pnpm lint` / `pnpm format:check` / `pnpm test` (173/173) all pass — the only residual `typecheck` errors are the three domains below, expected.
- **Deity done (2026-07-30).** Same recipe, same session. `magicColors`, `tarotCards`, `deityTypes`, `deityLevels`, `energyElements`, `traditionTypes` (all in `app/lib/config/deity/`) converted to `labelKey`; `celestialBodies` and `celestialPlanes` (`app/lib/config/geography/`) converted too, ahead of the geography domain itself — `deityMeta.ts`'s `celestialBody` and `residence` fields pull them in directly, so deity's compile depended on it. `messages/it.json`/`en.json` gained `deities.*` (colors, types, ranks, elements, traditions, tarotCards) and `geography.*` (celestialBodies, planes). All 8 redundant `getDatum` closures deleted from `deitiesMeta`; `DeityCard.tsx` calls `resolveFieldValue` for each, same Server/Client trap as spells (`DeityLibrary.tsx` is `"use client"`, so `useTranslations` not `getTranslations`).
  - **A live runtime crash found in the browser, not by the type checker.** `DeityLibrary.tsx`'s `SelectButtonery` filters on `alignment`/`alignmentDomain` — shared fields declared in `npcMeta.ts`, not deity's own. `SelectButtonery` now calls `resolveOptions` unconditionally, and `pageMetaFields: Record<string, PageMeta>`'s type annotation is a widening cast that doesn't verify the underlying values — so TypeScript stayed green while every deity page threw `MISSING_MESSAGE: Cannot read properties of undefined (reading 'split')` at runtime, because `alignments.ts`/`alignmentDomains.ts` still had `.label`, not `.labelKey`. This is exactly the "compiler won't catch what you miss" hazard `CLAUDE.md` warns about, now demonstrated at the `Record<string, PageMeta>` boundary rather than the `metaField` string-keying it originally named. **Fixed by migrating `alignments.ts` and `alignmentDomains.ts` too** (`npc.alignments.*`, `npc.alignmentDomains.*` in both catalogues) — two files pulled out of the untouched `npc` domain because a field a migrated domain's UI depends on. `npcMeta.ts`'s `location` and `faction` fields are untouched and still work today only because `DeityCard.tsx` never migrated their call sites off `.getDatum?.()` — **when npc is migrated, re-check every other domain's Card/Library for the same kind of cross-domain field reuse** before assuming a domain's migration is self-contained.
  - **Console errors from a stale browser tab looked like a real regression twice** during verification (`SpellCard` in the previous session, `DeityCard.alignments` in this one) — after a fix actually landed, `read_console_messages` kept replaying old entries from the same tab across `navigate` and even `window.location.reload()`. Confirmed by opening a **fresh tab**: zero errors, correct content both times. Trust a fresh tab over a reused one when a "still broken after the fix" console error doesn't match what the page renders.
  - **Verified in the browser**, both locales, including the filters actually filtering (not just displaying): `/dashboard/deities` renders "Legge/Neutralità/Caos" and "Bene/Neutrale/Male" filter rows, card borders keep their `getOptionColorClass` colors, and an expanded card shows "Paradiso (Sole), Cieli" / "Acquario" / "Il Matto" / "Acqua (Arcana)". `/en/dashboard/deities` renders "Law/Neutrality/Chaos", "Good/Neutral/Evil" (clicking "Evil" correctly filters to 2 of 6), and card text like "Shadow Demon Archon, Law/ Good (Bard - College of Valor)". Deity names/titles (`Elune`, `il Provatore`, …) stay Italian — campaign content, untouched by design.
- **Npc done (2026-07-30).** Same recipe, same session, immediately after deity. `alignments.ts`/`alignmentDomains.ts` were already migrated while unblocking deity (see above); this pass did the rest: `locationList.ts` (`app/lib/config/geography/`, pulled in by npc's `location` field — same cross-domain situation as `celestialBodies`/`celestialPlanes` for deity) and `factions.ts`. `FactionItem` interface's `label: string` became `labelKey: string`. `npcMeta.ts`'s `location`/`faction` closures deleted (the unused `getDataLabel` import went with them). `NpcCard.tsx` switched its one option-backed display (`location`) to `resolveFieldValue` — `personality`/`appearance`/`title`/`position`/`name` stay on `.getDatum(...)` unchanged, they're plain string fields with no options, never in scope. `messages/it.json`/`en.json` gained `npc.locations.*` and `npc.factions.*` — genuine translation work, not just SRD lookup: the setting's own place and faction names (`"Congrega delle Megere"` → `"Coven of the Hags"`, `"Regno di Kang"` → `"Kingdom of Kang"`), per ADR-0007's explicit decision that `locationList`/`factions` get real English renderings same as `tarotCards`. True invented proper nouns (`Norgam`, `Butwhag`, `Ankheet`, `Valleferro`, `Skreebars`, `Miravia`, `Barak Thor`, `Annunaki`, `Quel'Thalas`) stay as-is in both catalogues — that's the ADR-0006 category-3 line, still real, just narrower than a whole list.
  - **Confirmed the cross-domain-reuse hazard immediately.** `DeityCard.tsx`'s `residenza` line also reads npc's `location` field (`DeityMetaField.location` shares the same underlying `NpcMetaField.location` meta) — migrating `locationList` turned its `.getDatum?.()` call into a second compile error next to the one `npcMeta.ts` itself produced, caught by `pnpm typecheck` before the browser ever ran. Fixed in the same pass. This is the second time in two domains a field reuse only showed up as a type error mid-migration rather than being visible from reading the domain's own meta file — treat it as the default expectation now, not a surprise, for every remaining domain.
  - **Verified in the browser, fresh tab, zero console errors both times:** `/dashboard/npc` (auto-redirected to `/en/...` by the browser's `Accept-Language`) renders all 33 location filter buttons translated ("Paradise (Sun)", "Coven of the Hags", "Isle of Captain Cork", …) and filtering by one narrows the count correctly (0 of 119, then 4 of 119 for "Isle of Captain Cork"). Re-checked `/dashboard/deities` afterward to confirm the `location` fix didn't regress it — same zero-error, correct-filter-count result. Did not get a screenshot of `NpcCard`'s expanded `location` line specifically (headlessui `Disclosure` didn't register clicks reliably through the automation tooling this session — a tooling flakiness, not a code signal), but it runs the identical `resolveFieldValue` call already proven correct on the filter row and on `DeityCard`'s own `location` line.
- **Magicitem done (2026-07-30) — step 4 is now complete, all five domains migrated.** Smallest domain, no cross-domain surprise this time: `rarity.ts` and `item-types.ts` (both `app/lib/config/magicitem/`, wholly owned by magicitem) converted to `labelKey`; both are D&D 5e SRD terms (rarity tiers, magic item categories) with official published translations, not homebrew content. `magicItemMeta.ts`'s two redundant `getDatum` closures (`rarity`, `type`) deleted. `MagicItemCard.tsx` switched both to `resolveFieldValue` (`MagicItemLibrary.tsx` is `"use client"`, `useTranslations` again). `attuned`'s boolean `getDatum` ("Sì"/"No") and the hardcoded "Richiede sintonia" string are untouched — plain UI copy, step 6's scope, not step 4's.
  - **`pnpm typecheck` was not clean after the config-file changes alone.** `InputComponent.tsx`'s `resolveOptions(declaredOptions, t)` call failed to infer a single `TValue` for `declaredOptions`'s type — the union of every domain's `.options` array now mixes number-valued lists (rarity, deity fields, …) with string-valued ones (`TempoDiLancio` in spells), and `resolveOptions<TValue extends string | number>` can't unify a mixed union against one type parameter. Not a magicitem-specific bug — it was latent since spells' string-valued options first joined the union, and simply hadn't been exercised by `pnpm typecheck` until the union grew enough branches. **Fixed with one explicit type argument**, `resolveOptions<string | number>(declaredOptions, t)` — `FormField.options` only ever wants the default `ResolvedOption<string | number>[]` anyway, so the narrower per-field inference `resolveOptions` normally provides was never needed at this specific call site.
  - **Verified in the browser, fresh tab, zero console errors, both locales:** `/dashboard/magicitems` in English (auto-redirected by `Accept-Language`) shows all 7 rarity filters and 9 type filters translated ("Common"/"Uncommon"/…, "Ring"/"Weapon"/…) with each of the 62 items' type+rarity pair resolved correctly; `/it/dashboard/magicitems` (explicit prefix, since the auto-redirect won't offer Italian to an English-preferring browser) shows the same in Italian ("Comune"/"Raro"/…, "Anello"/"Arma"/…). Item names (`Anello del Calore`, …) and "Richiede sintonia" stay Italian in both — correct, campaign content and un-migrated UI copy respectively.
  - **`pnpm typecheck` / `lint` / `format:check` / `test` (173/173) all clean with zero errors across the whole repo** — this is the first point since TD-21 started where that's true. Steps 1–4 of the suggested execution order are done. **Step 5 (delete the 22 originally-identified redundant `getDatum` closures) turned out not to need a separate pass**: each domain's migration deleted its own closures as it went (color, deityType, deityRank, tarotCard, celestialBody, element, deityClass, tradition, residence for deity; alignment, alignmentDomain, location, faction for npc; rarity, type for magicitem — 15 in total, plus the spells-domain ones from the session before this). Grep `getDatum: (datum: number) => getDataLabel(` across `app/lib/config/**` before assuming any remain.
  - **Not done, deliberately out of scope for step 4:** steps 6–8 of TD-21's original fix list — inline component copy still has hardcoded Italian strings (`"Richiede sintonia"`, `"Residenza"`, `"Astro associato"`, and others across the Card components touched this session), no locale switcher exists yet, and there is no CI check that `it.json`/`en.json` have matching key sets. All three are real remaining work, not part of the message-key resolution boundary ADR-0007 exists to close.
- **Step 5 done (2026-07-31) — no hardcoded UI string literal remains in `app/ui/**` or `app/[locale]/dashboard/**`.** Four commits, same session: a `common.*` namespace for shared chrome (nav, sidebar, login form + its two server-action error strings, search label, spinner, 404 page, dashboard overview, entity list table headers, form buttons, filter buttons, sort aria-label, select placeholder, brand name — 21 files); then spells, then deities+npc+magicitems together, then geography — each domain's page title/search placeholder/item name/new-item button (public `ListPage` and the admin list, previously two separately hardcoded copies of the same strings each) plus that domain's leftover `ItemMeta`/toast strings.
  - **Two more copy-paste bugs found and fixed while extracting, same shape as the `celestialBodies`/`location` cross-domain misses in step 4:** `npc/page.tsx` and `deities/page.tsx` both had `metadata.title` left over from `magicitems/page.tsx` ("Oggetti magici"); `npc/page.tsx`'s public search placeholder read "Cerca oggetto magici..." instead of its own. Both are the predictable result of four page files built by copying one and editing in place — worth a search for the same pattern if a fifth domain is ever added this way.
  - **All eight domain `page.tsx` files (public + admin, all four domains) switched from a static `export const metadata` to `generateMetadata()`.** The static export was never locale-aware even before TD-21 — the browser tab title was hardcoded Italian regardless of `/en/...`. This was a pre-existing gap step 5 happened to close in passing, not a step-5 requirement itself.
  - **Added a `next-intl` mock to `vitest.setup.ts`** (`useTranslations: () => (key) => key`): `Select`'s existing unit test rendered the component outside `NextIntlClientProvider`, the first component test to hit a component using `useTranslations` directly — no Card component had its own unit test, so this hazard hadn't surfaced in steps 1–4.
  - **Found, not fixed:** visiting an unmatched route under `/dashboard/*` (e.g. `/it/dashboard/nonexistent-xyz`) serves Next's default 404 page instead of `app/[locale]/dashboard/not-found.tsx`, authenticated or not. Confirmed unrelated to this session's change (which only converted that file to an async Server Component) — no existing test (unit or e2e) exercises this page's actual rendering, only `e2e/validation.spec.ts`'s API-level 404 status check. Flagged as a separate task, not investigated further here.
  - **A real gap in step 5's own verification, found and closed in the same session:** six files carried a `COPY` object per CLAUDE.md's single-object convention but were never actually wired to `next-intl` — grouped, not translated. The initial scoping pass read "has a `COPY` object" as "already migrated," which was wrong; found while wiring the step-6 locale switcher against `SpellForm`, then checked for the same pattern across the other three domain forms, `DeleteButton`, `FormErrorSummary`, and the dashboard `error.tsx` boundary. All six fixed the same way as the rest of step 5 (new keys under `<domain>.form.*` and `common.*`); `DeleteButton` also had three strings that were never even in its `COPY` object (an English-hardcoded "Delete" label and the confirm dialog's title/body). **If auditing a similar codebase convention again, grep for `useTranslations`/`getTranslations` alongside `const COPY`, not just the object's existence.**
- **Step 6 done (2026-07-31) — locale switcher added.** `LocaleSwitcher` (`app/ui/dashboard/LocaleSwitcher.tsx`), a `<select>` in `SideNav` built on next-intl's typed navigation (`i18n/navigation.ts`), so switching locale preserves the current path and query string (list filters, page number) rather than dropping back to the dashboard root. Persistence is next-intl's own `NEXT_LOCALE` cookie, already set by `createMiddleware(routing)` in `proxy.ts` on any locale-prefixed request — no new cookie logic needed.
  - **A namespace mistake caught by a `MISSING_MESSAGE` console error, not by `pnpm typecheck`:** `pagination.tsx`'s translations were declared under `common.list.pagination`, but the JSON has `pagination` as a sibling of `list` under `common`, not nested inside it. `next-intl` namespace strings are plain strings to the type checker — a typo there is invisible until runtime, exactly the "compiler won't catch what you miss" hazard `CLAUDE.md` names for the metadata layer, now demonstrated at the translation-namespace boundary too.
- **Step 7 done (2026-07-31) — CI check landed as a unit test, not a workflow step.** `messages/messages.test.ts` flattens both catalogues to dotted key paths and asserts the sets are equal; it rides the existing `test` CI job (`pnpm test` / `pnpm test:coverage`) rather than needing a new one. Verified it actually catches drift before committing: deleted one key from `en.json` locally, watched the assertion name the missing key, reverted.
- **Step 3 done (2026-07-31) — `PageMeta.label`/`.placeholder` migrated, the last item in TD-21's original fix list.** `PageMetaBase.label`/`.placeholder` renamed to `labelKey`/`placeholderKey`, mirroring `SelectOption` → `labelKey` from ADR-0007. Only three consumers ever read them directly — `InputComponent.tsx` (form field label + placeholder) and `FormErrorSummary.tsx` (validation-error field name) — all three already had a `t` in scope from earlier TD-21 commits. Migrated all ~45 field declarations: the three shared across every domain (`name`/`id`/`description` in `pageMetaFields.ts`) plus each domain's own (`<domain>.fields.<field>.{label,placeholder}`). `placeholderKey` is only declared where `InputComponent` actually reads it (`Text`/`Textarea` fields) — the property was already dead on `Select`-typed fields, so it's dropped rather than migrated.
  - **A real bug found and fixed while migrating, not just extracted:** 9 of `deityMeta.ts`'s 12 fields had `label` (and `placeholder`) set to the raw camelCase field name — `"titoloPatrono"`, `"astri"`, `"classe"` — not real copy. Every deity form field showed its own internal identifier as a label. Given proper labels in both languages, cross-checked against `DeityCard.tsx`'s equivalent labels (migrated in an earlier TD-21 commit) so the same field reads the same way in both places.
  - **Verified in the browser, both locales, all four domains' create forms:** field labels and placeholders render correctly; deity's fields no longer show their own camelCase names.
  - **Two more hardcoded-string surfaces surfaced while migrating step 3, both fixed in a follow-up commit the same session:**
    - `app/lib/config/listConfig.ts` — a **separate** set of hardcoded Italian strings (`ListColumn.label` for table headers, `emptyMessage`, `editModalTitle`), never sourced from `PageMeta.label`. `ListColumn.label` → `labelKey`, mostly reusing the same key as the field's own `PageMeta.labelKey` (a column header and a form label are normally the same word); the one genuine divergence (magic items' "Sintonia" column vs. "Richiede sintonia" form label) got its own `magicItems.fields.attuned.shortLabel`. `emptyMessage`/`editModalTitle` → `emptyMessageKey`/`editModalTitleKey`; `editModalTitleKey` reuses each domain's existing `<domain>.form.editTitle` rather than duplicating it, since the two were always the same string.
    - Three `getDatum` closures rendered a hardcoded string depending on a boolean value: `spells.ritual` → `"Rituale"`/`""`, `spells.concentration` → `"Sì"`/`"No"`, `magicitem.attuned` → `"Sì"`/`"No"`. `resolveFieldValue.ts` now falls back to a generic `common.boolean.yes`/`.no` for a boolean field with neither `options` nor `getDatum`, ahead of the plain `String(value)` fallback. `ritual`'s and `concentration`'s closures turned out to be dead code — never invoked anywhere (`SpellCard` reads the raw boolean directly, the form uses a checkbox) — so they're deleted outright rather than replaced; `attuned`'s is the one call site the generic fallback actually replaces (the magicitem admin list's Sintonia column).
  - **TD-21's "done when" criterion is now met**: no user-facing string literal remains in a component or config file. Verified in the browser, both locales: all four domains' admin list column headers, and the magic items list's Sintonia/Attunement column showing Sì/No and Yes/No correctly.

---

## Phase 3 — Deferred

### TD-14 ✅ Map POIs live only in `localStorage` — **DONE (2026-08-01, PR #57 + T6 + T7)**

`app/modules/maps/hooks/usePOIManager.ts` used to read and write POIs to `localStorage`. They were lost on browser change, could not be shared, and — most importantly — could not reference the NPCs and deities stored in Postgres. The map was an island.

**Outcome:** a `poi` Prisma model (polymorphic `linkedType`/`linkedId`, no per-type FK — see [SPEC-002](./specs/002-map-poi-persistence.md) §6) plus `createPoi` / `updatePoi` / `deletePoi` / `fetchPois` Server Actions, all auth-guarded and Zod-validated. `usePOIManager` now writes through them with optimistic state instead of `localStorage`; the POI edit form gained a type-selector + entity-selector pair to link a POI to exactly one NPC or deity; the marker popup gains a "View NPC"/"View deity" link when a link is present. Full task breakdown, edge cases and the resolved design questions (global scope, manual optimistic state over `useOptimistic`) are in [SPEC-002](./specs/002-map-poi-persistence.md).

**Specified 2026-07-31 in [SPEC-002](./specs/002-map-poi-persistence.md) — Agreed.** Two decisions there depart from the one-line fix above and are worth reading before touching this further:

- **The entity link is polymorphic, not a relation per type.** `linkedType` + `linkedId` hold exactly one link (never an NPC _and_ a deity), so adding locations, dungeons or treasure later costs a `LINKABLE_ENTITY_TYPES` entry rather than a migration. The price is no database-level foreign key — referential integrity for the link lives at the Zod boundary, as `category` already does.
- **POIs are global to the instance, not user-scoped.** One DM authors one shared world; per-DM scoping arrives for every entity at once with multi-campaign support.

**Shipped in PR #57 (T1–T5):** the `poi` table and migration; `buildPoiCreateSchema`/`buildPoiUpdateSchema`; `createPoi`/`updatePoi`/`deletePoi`/`fetchPois`/`fetchLinkableEntities` Server Actions; `usePOIManager` rewritten for optimistic writes against Postgres; `MapPOIPanel`'s type/entity selector pair. See SPEC-002 §10 for what each task settled — the polymorphic-link resolution degrading a stale reference to unlinked, the image-space (not geographic) coordinate bounds, the client-id-stability and per-POI operation-serialisation fixes in the hook.

**T6 done:** the Leaflet popup (`usePOIManager.createMarker`) now shows a "View NPC" / "View deity" link when a POI has a resolved `linkedType`/`linkedId`. There is no per-entity detail route for NPCs or deities — both are flat list pages — so the link uses the metadata layer's existing exact-match `?id=` filter (`getQuery.ts`), the same mechanism every `PageType` already supports; `LinkableEntityTypeConfig` gained a `path` field (`linkable-entities.ts`) to hold each type's list-page base. e2e coverage: `e2e/map-poi-link.spec.ts`. One thing that test surfaced: `WorldMap.tsx` — the component actually mounted at `/dashboard/geography`, not the unused `MapMain.tsx` — has `MapSearchBar` commented out, so `MapPOIPanel` is reachable only via the right-click "Add to My Places" flow; there's no way to browse or delete an existing POI once you've navigated away from it. Pre-existing MVP gap, not introduced here.

**Still open — T7:**

- **T7 — docs closeout.** This entry, plus a final read-through of `ARCHITECTURE.md`'s data model section and `ROADMAP.md`'s Phase 3 item, to confirm they still match what actually shipped.

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

### TD-22 ✅ Lint warnings surfaced by TD-05 — **DONE (2026-07-29): 293 → 0**

**Outcome:** `pnpm lint` reports **zero warnings and zero errors**, and every rule the _Severity policy_ block downgraded is back to `error` in `eslint.config.mjs` — a regression now fails the gate instead of quietly growing the count. This closes the item TD-05 opened when switching the linter on first turned up 293 findings.

**Where it lived:** repo-wide, concentrated in the metadata/query layer (closed by TD-08/TD-09) and `app/modules/maps/` (closed here). The last 71 warnings, fixed 2026-07-29, broke down as:

- **21 `no-floating-promises` / `no-misused-promises`**, 13 files, mostly `app/modules/maps/`. Two distinct patterns:
  - **Self-catching fire-and-forget** (16 sites): an async setup function inside a `useEffect` (`setupGeoJSON`, `initializeMap`, `setupMarker`, `setupTileLayer`, `fetchCountryInfo`, `fetchCountries`) or an async handler passed to a prop/ref typed `() => void` (`handleCopyCoordinates`, `onCountrySelect`, `onImport`, `handleDelete`, `handleLocationFound`) already wraps its body in `try/catch` — the promise itself never rejects, so the fix is `void` at the call site (or a sync wrapper around the ref, for `useGeolocation`). No behaviour change.
  - **Genuine unhandled rejections** (5 sites): `useMapMarkers.addMarker`, `useMeasurement.startMeasurement`, `usePOIManager.createMarker`, and `WorldMap`'s `initializeMap` all did `await import("leaflet")` with **no** surrounding `try/catch` — a failed dynamic import (or, for `useMapControls.toggleFullscreen`, a rejected `requestFullscreen()`/`exitFullscreen()`) would have been genuinely silent: no toast, no console, nothing, exactly as this item predicted. Each now has its own `try/catch` (or `.catch`) with a `console.error`, matching the sibling `Leaflet*` components.
- **The rest (50 warnings)**: mostly `no-unsafe-*` from `any`-typed `await response.json()` / `JSON.parse()` results and Leaflet's own loosely-typed event objects, plus a scattered `no-unsafe-function-type` (`Function` used as a prop type — retyped to the real call signature, e.g. `BaseButton.onClick: () => void`, `Modal.setIsOpen: Dispatch<SetStateAction<boolean>>`), `unbound-method` (Vitest's `vi.mocked(prisma.spells.findUnique)` tearing a typed-but-mock method off its object — a known false positive, now scoped off in `__test__/**` with a documented reason, plus three real call sites in app code fixed by not destructuring `const { replace } = useRouter()`), `no-unsafe-enum-comparison` (`SortButton.sortOrder` and `Patrono.gradoPatrono` were `string`/`number` compared against an enum member — retyped to the enum they actually hold), and a handful of `no-unnecessary-type-assertion` / `require-await` / `await-thenable` cleanups.

**One deliberate suppression, not a fix.** `WorldMap.tsx`'s `initializeMap` effect keeps a targeted `eslint-disable-next-line react-hooks/exhaustive-deps` with an inline reason: the effect reads `currentImage` and ends by calling `setCurrentImage`, so adding either to the dependency array would re-run it every time it sets that state — an infinite re-render loop, not a lint nit. Fixing it for real needs a ref-based rewrite of that state, which is out of scope for a lint pass on a component CLAUDE.md already flags as a "thin MVP... will wire more of it up over time." `e2e/map.spec.ts`'s "switching world swaps the map image" test covers this path and would have caught a loop.

Verified against a running dev server: the geography map loads, world-switching swaps the artwork, fullscreen toggles, and the admin spell list's search and column sort (`search.tsx` / `SortableHeader.tsx`, touched by the `unbound-method` fix) still filter and reorder correctly — no console errors in any of it. `pnpm lint` / `pnpm typecheck` / `pnpm test` (173 tests) / `pnpm format:check` all green. No regression tests added for the promise-handling fixes specifically — this is error-handling hygiene on existing behaviour, not new behaviour, and "a dynamic `import()` rejects" isn't practically reproducible without mocking the module loader.

**Previously, re-measured 2026-07-27: 89 warnings, 0 errors.** Two rules are back to `error` — `no-unused-vars` and, since TD-08 step 4, `no-explicit-any`. What remained was concentrated in `app/modules/maps/`: the `no-unsafe-*` family around the vendored Leaflet code and 13 floating promises, which are latent bugs rather than style. The four domain forms, which held 48 of these when this item was written, held none.

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

### TD-25 ✅ An unreachable database surfaces as an opaque UI error — **DONE (2026-07-27)**

**Outcome:** a stopped Postgres announces itself in the terminal, once, at startup, instead of being discovered mid-render by whichever page queries first.

`instrumentation.ts` — Next's one-shot startup hook — runs `SELECT 1` through the existing client. On a refused connection it prints the host, the port and the command that starts it. It never blocks startup and never runs in the request path: an unreachable database is reported and the server carries on.

**Verified in all three states**, without touching the development database — the connection string was pointed elsewhere rather than the container stopped:

| State                           | Result                              |
| ------------------------------- | ----------------------------------- |
| Nothing listening on the port   | the actionable message, and `false` |
| The real database               | silent, `true`                      |
| Reachable but wrong credentials | the driver's own message, quoted    |

And end to end: `next dev` with an unreachable URL is _Ready in 309ms_, prints the message after, and still serves `/login` with a 200. The message appears once, not per request.

**Two guards in the hook, both load-bearing:** it returns early on the edge runtime, where the Prisma client and `pg` do not exist, and during `next build` — CI builds with a placeholder `DATABASE_URL` pointing at nothing, and checking there would print a frightening, meaningless warning on every green build. Both confirmed: a build against an unreachable URL prints nothing.

**The kind of failure is now in the type system.** `DatabaseUnreachableError` (503) is distinct from `DatabaseError` (500), chosen by `toDatabaseError` via `isConnectionFailure`. The distinction cuts both ways, and a test asserts it does: a constraint violation stays a 500. TD-13 made the cause visible; this makes the _kind_ visible, which is what lets a message say "start the database" rather than "something went wrong".

**A wording bug this caught in itself.** The first version of the non-connection branch suggested `prisma migrate deploy` for any failure that was not a refused connection. Running it against wrong credentials produced _password authentication failed_ under a suggestion to migrate. It now quotes the driver's message and lists the common causes rather than guessing one.

**The dashboard boundary distinguishes the two — in development.** `app/dashboard/error.tsx` said "Something went wrong!" for everything; it now recognises an unreachable database and names the command. In production Next replaces a server error's message before it reaches a client boundary, leaving only `digest`, so the specific text is a development-only affordance. That is the case that matters for a self-hosted app whose owner runs it, and the startup check covers the terminal in both modes. Recorded rather than papered over.

The original description follows.

---

### TD-25 (original) 🟡 An unreachable database surfaces as an opaque UI error

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

### TD-30 ✅ Four list pages wrapped a `<Suspense>` that could never trigger — **DONE (2026-07-27)**

**Outcome:** the four public list pages stream. `app/ui/components/EntityLibrary.tsx` is the server half that awaits the query and hands the rows to the domain's client library — the same split `EntityList` already used on the admin side. The pages no longer await the rows at all.

**Measured, not assumed.** Streaming the HTML of `/dashboard/spells` with a session cookie:

| In the response          | Byte        |
| ------------------------ | ----------- |
| Page title               | 2.252       |
| Skeleton (`aria-hidden`) | 17.459      |
| First card               | **122.261** |

The shell and the placeholder are in the first chunk; the 361 cards arrive 104 KB later. Before, the page awaited everything before returning any JSX, so the fallback could not appear in the output at all.

**The fallback is also the right shape now.** These pages render cards and fell back to `TableSkeleton`; `LibrarySkeleton` renders full-width bars like the cards it replaces. The mismatch had gone unnoticed precisely because the fallback never rendered.

**Also removed:** `itemCount`, a prop all four libraries declared and none read.

**Not changed:** the page still awaits its count before the shell renders, because `ListPage` needs it for both the header text and the pagination control. That is a real remaining serialisation, but a smaller one — one aggregate rather than every row — and moving it would mean restructuring the header.

The original description follows.

---

### TD-30 (original) 🟡 Four list pages wrap a `<Suspense>` that can never trigger

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

### TD-31 ✅ Hydration mismatch logged throughout the E2E run — **DONE (2026-07-29)**

**Where:** `app/lib/utils/data/sortSelectOptions.ts`
**Found:** 2026-07-29, reading TD-15's CI log

The original guess in this entry — Italian date formatting diverging between server and client locale — was wrong; there is no date formatting on the affected component at all. The actual cause was a shared mutable array:

`PageMeta.options` (declared once per field in `app/lib/config/<domain>/<domain>Meta.ts`) is not copied as it flows outward — `pageMetaFields.ts` spreads each domain meta shallowly, and `InputComponent.tsx` assigns `result.options = pageMetaFields[fieldName].options` by reference. Every consumer of a given field's options — a form's `<Select>` and a list's `SelectButtonery` filter buttons alike — held the _same_ array object, e.g. `levels` from `app/lib/config/spells/levels.ts`.

`sortSelectOptions` sorted that array with `optionList.sort(...)`, which mutates in place and returns the same reference. The first time a spell form server-rendered its level `<Select>`, that call permanently re-sorted the shared `levels` array alphabetically by label for the rest of the Node process — "1° Livello" through "9° Livello" before "Trucchetto", since digits sort before letters. Every subsequent server-rendered `/dashboard/spells` request then handed `SelectButtonery` this corrupted order, while the client's own bundle still held the original, unsorted array — hence the mismatch: server said "1° Livello" where the client said "Trucchetto".

This was never a merely cosmetic hydration flake: it was a real production bug, silently reordering a shared piece of metadata state across unrelated requests on the same server process, independent of SSR.

**Fix:** `sortSelectOptions` now sorts a copy — `[...optionList].sort(...)` — leaving `PageMeta.options` untouched. Regression test in `sortSelectOptions.test.ts` asserts the input array is unchanged after the call.

**Done when:** a full `pnpm test:e2e` run produces no hydration error in the `[WebServer]` output, and the cause is recorded here. ✅ root cause fixed and covered by a unit test; a full `pnpm test:e2e` re-run to confirm the CI log is clean was not part of this change — see note in the PR.

---

### TD-32 ✅ The E2E job spent nine minutes a run installing fonts — **DONE (2026-07-29)**

**Where:** the `e2e` job in `.github/workflows/ci.yml`
**Found:** 2026-07-29, reading a run whose `Install Playwright system deps` step took 9m14s

The job cached Playwright's browsers correctly and then gave the saving straight back:

```yaml
- name: Install Playwright browsers
  if: cache-hit != 'true'
  run: pnpm exec playwright install --with-deps chromium

- name: Install Playwright system deps
  if: cache-hit == 'true' # ← so this ran on every build, cache hit included
  run: pnpm exec playwright install-deps chromium
```

`install-deps` was the entire cost, and its own output shows it was pointless. Every library Chromium actually needs — `libnss3`, `libgbm1`, `libatk1.0-0t64`, `libcups2t64`, `xvfb` — reported `is already the newest version`, because the `ubuntu-latest` image ships them. The only new packages were 21 MB of fonts (`fonts-ipafont-gothic`, `fonts-wqy-zenhei`, `fonts-tlwg-loma-otf`, `xfonts-cyrillic` …), unpacking to 80 MB and triggering a fontconfig rebuild — so that Playwright could render Japanese, Chinese, Thai and Cyrillic text that this app never displays.

**Outcome:** both `--with-deps` and the `install-deps` step are gone. A cache hit now does no apt work at all; a cache miss downloads the Chromium binary and nothing else. If a future runner image drops one of those libraries, Chromium fails loudly on launch — a one-line failure is a better trade than nine minutes of apt on every run.

**Left undone, deliberately:** the cache key is `playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}`, so **any** dependency change — and most have nothing to do with Playwright — evicts the browser cache and pays the download again. Keying on the resolved `@playwright/test` version instead would be stabler. Small, real, and separable from this fix.

---

### TD-33 ✅ The Italian identifiers TD-19 missed — **DONE (2026-07-30)**

**Outcome:** all sixteen identifiers renamed, one pure-rename commit (`fd8f3fa`), SHA added to `.git-blame-ignore-revs` in a follow-up commit — the same two-commit discipline TD-19 used. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` all green (173/173 unit tests), no behaviour change.

**One claim in the original writeup did not hold up:** `app/ui/deities/DeityCard.tsx` does not import any of these sixteen identifiers. It matched the discovery grep only because two of its JSX label strings happen to read `"Astro associato"` and `"Tarocco"` — Italian UI copy, not code referencing the enums. That copy is correctly untouched. The real importers were `Deity.ts`, `app/seed/initial-data/deities.ts`, and the seven config files (`celestialBodies.ts`, `celestialPlanes.ts`, `locationList.ts`, `deityMeta.ts`, `npcMeta.ts`, plus the two renamed config consts' own cross-imports of `FazioneItem`/`FactionItem`).

**Worth knowing for the next mechanical rename:** the naive approach — `sed` with `\b` word-boundary patterns, several `-e` clauses combined in one invocation — silently dropped the identifier substitution in three separate files while its adjacent path-string substitution in the same invocation succeeded, with no error. Plain non-anchored substitution (`s/Astro/CelestialBody/g` etc.), one identifier per invocation, worked every time. The fix that actually caught it was the `Done when` grep below, re-run after the edits — not a visual diff read, which would have shown the still-Italian local binding names as plausible-looking code.

The original description follows, unchanged, per the register's convention of keeping dated records intact.

---

### TD-33 (original) 🟡 The Italian identifiers TD-19 missed

**Where:** `app/lib/definitions/enums/{deities,geography,tarocchi}/`, `app/lib/config/{deity,npc}/`, `app/lib/definitions/interfaces/npc/FazioneItem.ts`
**Found:** 2026-07-30, by a documentation audit checking TD-19's completion claim against the tree
**Decision:** [ADR-0005](./adr/0005-english-identifiers.md) — unchanged; this is unfinished work under it, not a revision of it

[[TD-19]] reports that "every TypeScript/Prisma identifier is English". **Sixteen are not**, across 14 files and one directory. Two of them are named in TD-19's own list of completed enum renames (`Circolo`→`Circle`, `Tarocco`→`TarotCard`) and were never actually renamed.

These are live exported identifiers, not just filenames — imported by `app/lib/definitions/interfaces/deities/Deity.ts`, `app/seed/initial-data/deities.ts` and several config files (the original claim that `app/ui/deities/DeityCard.tsx` was an importer was wrong — see Outcome above).

| Current                                           | Suggested                                    | File                                            |
| ------------------------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| `Circolo`                                         | `Circle`                                     | `enums/deities/Circolo.ts`                      |
| `Astro`                                           | `CelestialBody`                              | `enums/geography/Astro.ts`                      |
| `Luogo`                                           | `Location`                                   | `enums/geography/Luogo.ts`                      |
| `PianoEsistenza`                                  | `PlaneOfExistence`                           | `enums/geography/PianoEsistenza.ts`             |
| `ResidenzaDivina`                                 | `DivineResidence`                            | `enums/geography/ResidenzaDivina.ts`            |
| `Zona`                                            | `Zone`                                       | `enums/geography/Zona.ts`                       |
| `Tarocco`                                         | `TarotCard`                                  | `enums/tarocchi/Tarocco.ts`                     |
| `SignificatoTarocco`                              | `TarotMeaning`                               | `enums/tarocchi/SignificatoTarocco.ts`          |
| `tarocchi`                                        | `tarotCards`                                 | `config/deity/tarcocchi.ts` — **also misspelt** |
| `coloriMagia`                                     | `magicColors`                                | `config/deity/coloriMagia.ts`                   |
| `allineamenti` · `AllineamentoObject`             | `alignments` · `AlignmentObject`             | `config/npc/allineamenti.ts`                    |
| `dominiAllineamenti` · `DominiAllineamentiObject` | `alignmentDomains` · `AlignmentDomainObject` | `config/npc/dominiAllineamenti.ts`              |
| `fazioni`                                         | `factions`                                   | `config/npc/fazioni.ts`                         |
| `FazioneItem`                                     | `FactionItem`                                | `interfaces/npc/FazioneItem.ts`                 |

Plus the directory `app/lib/definitions/enums/tarocchi/` → `tarot/`.

**Why TD-19 missed them, which is the part worth keeping.** These are option-list and lookup data, reached through `getDataLabel(list, value)` rather than through the metadata key path TD-19 followed field by field. Renaming a type or a const is entirely internal, so nothing failed to compile and no test went red — the two signals that caught TD-19's genuine misses. `Circolo` has no importers at all, so it had no compile pressure whatsoever. **A rename is only as complete as the mechanism verifying it**, and TD-19's verification was the compiler and the suite.

**It is currently partial in the way CLAUDE.md warns is worse than none.** `config/npc/fazioni.ts` declares `const fazioni: FazioneItem[]` while importing the successfully renamed enum `Faction`. `config/deity/` holds English `deityLevels.ts`, `deityTypes.ts`, `energyElements.ts` and `traditionTypes.ts` beside Italian `coloriMagia.ts` and `tarcocchi.ts`. A reader cannot tell which convention the directory follows, which is the cost this item exists to remove.

**Why this is S and 🟡, where TD-19 was L and 🟠.** TD-19's danger was the string-keyed metadata layer: a missed literal silently stopped a filter. Nothing here is string-keyed. Every identifier in the table is a type or a binding, so the compiler verifies each rename completely — `pnpm typecheck` going green _is_ the proof, which it never was for TD-19.

**Enum values stay Italian**, exactly as TD-19 decided: `Luogo.CustodiVerdi = "Circolo druidico di Valleferro"` is campaign content and is not touched. Only the identifier changes.

**Fix**

1. Rename the eight enums and their files; the directory `tarocchi/` → `tarot/`.
2. Rename the five config consts and the three interfaces; fix the `tarcocchi.ts` → `tarotCards.ts` misspelling in the same move.
3. Keep it one pure-rename commit with no behaviour change, and add the SHA to `.git-blame-ignore-revs` — the same discipline TD-19 used.

**Done when:** `grep -riE "circolo|luogo|zona|astro|tarocc|allineament|fazion|residenz|piano" app --include="*.ts" --include="*.tsx"` returns only enum _values_, `@map` arguments and UI copy; `pnpm typecheck && pnpm lint && pnpm test` green.

---

### TD-34 ✅ Every CI action pinned to a deprecated Node 20 runtime — **DONE (2026-07-31)**

**Where:** `.github/workflows/ci.yml`, `package.json` `engines`
**Found:** 2026-07-31, from a GitHub Actions warning on the `Upload Playwright report` step

> Node 20 is being deprecated. This workflow is running with Node 24 by default.

**The warning is not about `NODE_VERSION`, and that is the part worth recording.** The workflow has two unrelated Node versions and only one of them was visible in the file:

| Runs                                   | Declared in                                        | Was |
| -------------------------------------- | -------------------------------------------------- | --- |
| `pnpm install`, `build`, `test`, `e2e` | `env.NODE_VERSION` in this workflow                | 22  |
| the JavaScript of each action itself   | `runs.using` inside that action's own `action.yml` | 20  |

The second is not configurable from here — it ships with the tag you pin. All five actions sat at `@v4`, and every `v4` declares `using: node20`. GitHub was already overriding it to node24, so nothing was broken; the warning announced that the override would not last.

The pins had drifted badly in the meantime — `@v4` against `v7.0.1` current for `checkout` and `upload-artifact`, `v7.0.0` for `setup-node`, `v6.1.0` for `cache`, `v6.0.9` for `pnpm/action-setup`.

**Outcome:** `checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `cache@v6`, `pnpm/action-setup@v6`, all on `node24`; `NODE_VERSION` 22 → 24; `engines.node` `>=22` → `>=24`.

**Two things checked rather than assumed:**

- `setup-node@v5` made package-manager caching automatic when `package.json` has a `packageManager` field — which this one does. The explicit `cache: pnpm` was **kept anyway**: it is still a supported input in v7, and relying on implicit detection for something that silently degrades to "no cache" is not worth the two saved lines.
- `cache@v5+` and `upload-artifact@v5+` require Actions Runner ≥ `2.327.1`. Irrelevant here — `ubuntu-latest` is hosted and well past it. It would matter on a self-hosted runner.

**Consequence for a developer on Node 22:** `pnpm install` prints `WARN Unsupported engine: wanted {"node":">=24"}` and **proceeds** — no `.npmrc`, so `engine-strict` is unset and defaults to off. Verified, not assumed. Upgrading local Node to 24 clears it.

**Left undone, deliberately:** no `.nvmrc`. It would pin local Node the way `packageManager` pins pnpm, and is a genuine gap now that `engines` and the runner agree on 24 — but it is a separate decision about developer setup, not part of unbreaking CI.

---

### TD-35 ✅ E2E specs assert hardcoded copy instead of reading the message catalogue — **DONE (2026-07-31)**

**Outcome:** every `e2e/*.spec.ts` file now imports `messages/it.json` and resolves catalogue-sourced `getByRole`/`getByLabel`/`getByText` assertions from it (`messages.common.auth.submit`, `messages.spells.form.createTitle`, etc.) instead of a hand-copied literal. `common.list.count`'s template (`"{filtered} di {total} {item} trovati"`) is used to build the two count-parsing regexes in `filtering.spec.ts` and `pagination.spec.ts`, so a re-translation of that template can't silently desync the parser. `a11y.spec.ts`'s keyboard-focus test also had its `/Modifica|Delete|Reset/` regex rebuilt from the catalogue — `"Delete"` was a dead branch that never matched the real Italian button text (`"Elimina"`); it's replaced with the real value. Left as literals, deliberately: seeded/DM-authored content the specs control (`"Gork"`, `"Dardo"`), Next.js's own built-in 404 strings in `not-found.spec.ts`, and the vendored maps module's hardcoded English (`"Add Marker"`, `"Copy Coordinates"`, `"Map context menu"` in `MapContextMenu.tsx`) — none of those come from `messages/it.json`.

**Verified:** all ten touched specs pass individually (`auth`, `auth.setup`, `deities-list`, `filtering`, `pagination`, `npc-crud`, `spells-crud`, `map`, `a11y`); full unit suite (177 tests) green; `pnpm typecheck` and `pnpm lint` clean.

**Where:** `e2e/*.spec.ts` — every `getByRole(..., { name: "..." })`, `getByLabel("...")` and `getByText(/.../)` that targets translated UI copy.
**Found:** 2026-07-31, fixing two CI failures on the [[TD-21]] branch. TD-21 correctly wired the login button and the delete-confirmation dialog to `next-intl` — they had been hardcoded English (`"Log in"`, `"Delete"`, `"This operation can't be undone"`) even under the old all-Italian UI. Once translated, they render `"Accedi"` / `"Elimina"` / `"Questa operazione non può essere annullata"` under the Italian default locale, and the specs — which predate the catalogue — still asserted the old strings. Two separate CI rounds were needed to find both: the second (a regex, `/can't be undone/i`) survived a first grep pass that only matched quoted string literals.

**Why this is real debt, not a one-off typo.** Every e2e spec locates elements by their rendered Italian text — 20+ string literals across the suite, cross-checked in this session against `messages/it.json`. None of them import the catalogue; they duplicate its values by hand. `messages/it.json` can now change a value — a copy edit, a future re-translation — and nothing catches the mismatch except an E2E run turning red with a timeout that gives no hint the cause is copy, not behaviour. That is exactly what happened here twice in one afternoon.

**Fix, roughly:** import `it.json` (or the specific keys under test) in the specs that assert translated copy, and resolve `getByRole(..., { name: messages.common.form.delete })` instead of a literal. Structural copy (role names, headings, button labels) benefits most; content the DM authored (spell/NPC names created by the test itself) stays a literal, since that is data the spec controls, not catalogue copy.

**Worth weighing before starting:** `next-intl`'s message objects are typed, so a renamed key becomes a compile error in the specs too — the same protection `messages/messages.test.ts` (TD-21) already gives production code. The trade-off is that e2e specs currently read as self-contained user journeys with visible Italian text; resolving copy through key lookups makes them slightly more abstract to read, in exchange for surviving a copy change.

**Done when:** every `getByRole` / `getByLabel` / `getByText` assertion that targets catalogue-sourced UI copy reads it from `messages/it.json` (or a small typed helper over it) rather than a literal; `pnpm test:e2e` still green.

---

### TD-36 ✅ `proxy.ts` matcher let `.jpg` through the auth/i18n gate, breaking every map tile — **DONE (2026-08-01)**

**Found:** while taking the map screenshot for ROADMAP Phase 2, item 14 (see TD-17). The four custom tile images under `public/maps/*.jpg` rendered as blank grey tiles in the browser — `/maps/mondo-materiale.jpg` came back 404. `curl -L` on the same URL showed why: it 307-redirected to `/login?callbackUrl=...`. Every request through `proxy.ts` runs the i18n rewrite and the auth check; the matcher was meant to skip static assets, but its exclusion list only covered `.png`:

```
"/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"
```

Any `.jpg` (the four map tiles) went through the gate instead of straight to the file. Once through, next-intl's rewrite doesn't correspond to a real file, and the request 404s — invisible in a normal click-through, since a broken `<img>` inside a Leaflet tile layer just shows as empty grey.

**Fix:** the matcher's negative-lookahead now excludes `.jpg` and `.jpeg` alongside `.png`: `.*\\.(?:png|jpg|jpeg)$`.

**Regression test:** `proxy.test.ts` (new, at repo root next to `proxy.ts`) compiles `config.matcher[0]` into the same regex Next.js would and asserts a `.jpg` path is excluded, a `.png` path is excluded, and a real page route (`/dashboard/geography`) still isn't — i.e. it fails without the fix and passes with it. `next-intl/middleware` and `next-auth/jwt` are mocked in the test so importing `proxy.ts` doesn't pull in their ESM builds, which don't resolve under Vitest's module graph.

**Why this sat unnoticed:** nothing exercised `proxy.ts` before — no test imported it, and the E2E map spec (`e2e/map.spec.ts`) presumably asserts on POIs and controls rather than the tile images actually painting, so a grey background didn't fail CI. `pnpm typecheck && pnpm lint && pnpm test` all green throughout; the bug was only visible by looking at the rendered map.

---

## Coverage hardening and Phase 3 — TD-37 through TD-73

**Moved here on 2026-08-08**, in the same operation and for the same reason as the 2026-08-01 split described in this file's header: every item below is closed, and `TECH_DEBT.md` had grown back to 703 lines — long enough that the two genuinely open items in it (TD-63, TD-74) were hard to find, and one of them had gone missing from the summary table entirely.

Two things are worth knowing before reading on:

- **The write-ups keep their "(original)" problem framing** alongside their resolution, unedited, exactly as the TD-01–TD-36 block above does.
- **The "Recommended execution order" block at the end is historical and was already known to be unreliable** — its own maintenance note (2026-07-30) records that it had drifted to showing 9 items done when 21 were. It is kept because it shows the sequencing reasoning, not because its checkboxes can be trusted. The summary table in `TECH_DEBT.md` is, and always was, the authority on what is done.

---

## Coverage hardening — TD-37 through TD-43

**Opened 2026-08-01.** Every audit-era correctness item is closed; TD-36 was the last bug this project knew about. What remains is that `docs/ROADMAP.md`'s Phase 2 exit criterion — coverage above 70% — was never actually met. The register said "Phase 2 is complete" while the roadmap's own exit-criteria line said "at 22% — the one criterion still far off"; both were reading the same number and drawing different conclusions. **A test suite that hasn't looked at most of the code cannot promise the code is right — this is drift between what the register claims and what CI actually checks, the exact failure mode `docs/TESTING.md`'s "coverage is a diagnostic, not a goal" line exists to prevent.**

These seven items are one coverage pass, split by area so each stays a single-session unit, in the order `docs/TESTING.md` §2's own target table implies: the auth/DB boundary first (an unverified login path is a security question, not a polish one), then the data layer, then presentation-only code last. **No item here changes behaviour** — every one adds tests against what the code already does. If a test reveals the code does the wrong thing, that becomes its own bug-fix item, not scope creep on the coverage item that found it.

Figures below are from a live `pnpm test:coverage` run on 2026-08-01, not from the (now corrected) stale 22% figure in `docs/TESTING.md`.

### TD-37 ✅ `authenticate()` and `app/lib/connections/**` are 0% covered — **DONE (2026-08-02)**

**Outcome:** all four files this item named are now covered — `app/lib/connections/**` reads 100% lines / 83.33% branches, and `app/lib/actions.ts` and `app/lib/actions/search/useClearSearchParams.ts` (the real name of the "`searchParams.ts`" this item's write-up pointed at) are both at 100%. Test suite grew 267 → 283.

- `__test__/auth/authenticate.test.ts` (6 tests) — the three outcomes the plan named (success, `CredentialsSignin`, any other `AuthError`), plus that `logServerIssue` fires only for the `AuthError` cases and that a non-`AuthError` rethrows rather than being swallowed. `next-auth`'s own barrel import pulls in `next/server`, which vitest/jsdom cannot resolve, and `@auth/core` (where `AuthError`/`CredentialsSignin` actually live) is a transitive dependency pnpm does not hoist — so `next-auth` is mocked with minimal local classes reproducing the one property the code reads (`error.type`), rather than importing the real ones.
- `app/lib/connections/checkDatabaseReachable.test.ts` (6 tests) — the actual filename (this item's write-up said `dbReachable.ts`). Covers the success path, a connection failure naming host and port, the documented port-5432 default, an unset/malformed `DATABASE_URL` degrading to a named message rather than throwing, and a non-connection failure (e.g. a missing relation) logging the underlying message instead of the "nothing is listening" copy. Follows `createPoi.test.ts`'s documented pattern of a direct hoisted mock reference rather than `vi.mocked(prisma.$queryRaw)`, which trips `unbound-method`.
- `app/lib/connections/prisma.test.ts` (3 tests) — the singleton itself, previously untested and invisible in the coverage table for an unrelated reason (see below): the adapter is built from the validated `DATABASE_URL`, the client is constructed with that adapter, and the global-caching behaviour (reused across module reloads outside production) actually reuses rather than reconstructing.
- `app/lib/actions/search/useClearSearchParams.test.ts` (1 test) — the hook clears search params by replacing the current pathname.

**A display bug found on the way, not fixed here.** `app/lib/actions.ts` (a flat file) sits beside `app/lib/actions/` (a directory) — the exact "flat file beside a directory of the same name" pattern `CLAUDE.md`'s decision log already forbids. It doesn't break anything at runtime, but it breaks `pnpm test:coverage`'s human-readable table: the row for `app/lib/actions.ts` is silently dropped from the printed output entirely (confirmed present and at 100% in `coverage/coverage-summary.json`, just never rendered in the text table). Filed as a follow-up rather than fixed here, since a rename is a mechanical, unrelated change that belongs in its own commit. **Resolved 2026-08-02, same day, in `8093b41`** — `authenticate()` moved to `app/lib/actions/authenticate.ts`; the directory-shadowing flat file is gone.

**Where:** `app/lib/actions.ts` (the `authenticate` Server Action bound to the login form), `app/lib/connections/prisma.ts` (the singleton every data function imports), `app/lib/connections/checkDatabaseReachable.ts` (TD-25's startup check — the original write-up below calls it `dbReachable.ts`), `app/lib/actions/search/useClearSearchParams.ts` (the write-up calls it `searchParams.ts`).

The original write-up follows for context.

---

### TD-37 (original) 🟠 `authenticate()` and `app/lib/connections/**` are 0% covered

**Where:** `app/lib/actions.ts` (the `authenticate` Server Action bound to the login form), `app/lib/connections/prisma.ts` (the singleton every data function imports), `app/lib/connections/dbReachable.ts` (TD-25's startup check), `app/lib/actions/search/searchParams.ts`.

**Why this is first, not the data layer.** Every other auth-adjacent path already has tests — `requireSession`/`requireApiSession` (`__test__/auth/session-guards.test.ts`), the eight mutation guards, the four DELETE endpoints. `authenticate()` is the one gap in that set: the function that turns a submitted credential into a session in the first place is currently unverified by anything except `e2e/auth.spec.ts`, which checks the user-visible outcome, not this function's own branches (wrong password, unknown email, NextAuth throwing `CredentialsSignin` vs. an unexpected error). `dbReachable.ts` is TD-25's fix for a real incident (an unreachable Postgres surfacing as an opaque React error) — untested since the day it landed.

**Plan:** mock `next-auth`'s `signIn` and Prisma's `user.findUnique` the way `mutationGuards.test.ts` already mocks Prisma; cover the three outcomes `authenticate()` distinguishes (success, bad credentials, unexpected throw) and that each produces the right return value for the form to render. For `dbReachable.ts`, mock the `SELECT 1` call to fail and assert the log line names the host/port, per TD-25's own "done when".

**Done when:** `app/lib/actions.ts` and `app/lib/connections/**` are at or above the 90% `app/lib/data/**` target — they are the same trust tier.

---

### TD-38 ✅ Data-layer `fetch*`/`get*Count` untested for deities, magicitems, npc — **DONE (2026-08-02)**

**Outcome:** `app/lib/data/**` reads 93.75% statements / 93.61% lines, above the 90% target. Test suite grew 322 → 348 (26 new tests across 10 files). All three previously-0% domains (`deities`, `magicitems`, `npc`) are now at 100% for `fetchFiltered*`/`get*Count`/`delete*ById`, and `spells/getSpellsCount.ts` (the one outlier) is covered too.

- Three tests per domain, mirroring `fetchFilteredSpells.test.ts`: a well-formed row parses, a malformed one throws `DatabaseError` rather than returning bad data, and a Prisma failure is wrapped rather than leaking a raw driver error. Rows are built generically from `entityFieldKeys(pageType)` + `fieldMeta[key].defaultValue` — the same fixture `buildEntitySchema.test.ts` already uses to prove `buildResultSchema` accepts a real row — instead of one hand-written literal per domain, so a field renamed in the metadata can't silently desync the fixture from the schema it is meant to exercise.
- One test per domain for `get*Count`, which also exercises `getItemsCount.ts` (the shared function all four wrappers call, previously 0% despite being on the "already covered" side of TD-38's write-up).
- Four tests per domain for `delete*ById`: deletes an existing row, 404s a missing one without deleting, and wraps both a lookup failure and a delete failure in `DatabaseError`.

**The plan's "throws without a session" case for `delete*ById` does not apply, and was not added.** Unlike `deletePoi` (a Server Action that calls `requireSession()` directly, since POI deletion has no route handler), `deleteDeityById`/`deleteMagicItemById`/`deleteNpcById` are internal helpers with no auth check of their own — per TD-01's note, the guard lives at the DELETE route handler that is these functions' only caller, not in the functions themselves. Asserting a guard that isn't there would have been testing a behaviour the code doesn't have.

**Where:** `app/lib/data/deities/{fetchFilteredDeities,getDeitiesCount,deleteDeityById}.ts` and the equivalent triplets under `app/lib/data/magicitems/` and `app/lib/data/npc/` — all at 0%. `app/lib/data/spells/getSpellsCount.ts` is the one outlier that's also 0%; everything else in `spells` is covered.

The original write-up follows for context.

---

### TD-38 (original) 🟠 Data-layer `fetch*`/`get*Count` untested for deities, magicitems, npc

**Where:** `app/lib/data/deities/{fetchFilteredDeities,getDeitiesCount,deleteDeityById}.ts` and the equivalent triplets under `app/lib/data/magicitems/` and `app/lib/data/npc/` — all at 0%. `app/lib/data/spells/getSpellsCount.ts` is the one outlier that's also 0%; everything else in `spells` is covered.

**Why:** `app/lib/data/**` is the project's own stated highest-value tier (90% target, "the risky part" per `docs/TESTING.md` §2) and sits at 83% today only because these four domains' count/fetch functions were never included when `getQuery.test.ts` and the mutation suites were written — `getQuery.ts` itself (the shared query builder all four call into) is already at 91%. This isn't four new test strategies, it's the existing `fetchFilteredSpells`/`getSpellsCount` pattern applied to three more domains that use the identical shape.

**Plan:** mirror `app/lib/data/spells/fetchFilteredSpells.test.ts` for the three missing domains — same mocked-Prisma approach already proven there. `deleteDeityById`/`deleteMagicItemById`/`deleteNpcById` need the same "throws without a session" case `mutationGuards.test.ts` already asserts for every `create*`/`update*`.

**Done when:** `app/lib/data/**` reads ≥90% lines in the coverage report, matching `docs/TESTING.md` §2's target.

---

### TD-39 ✅ Pure functions in `app/lib/utils/**` at 51%, cheapest real coverage available — **DONE (2026-08-02)**

**Outcome:** `app/lib/utils/**` reads 100% lines, above the 95% target. Test suite grew 348 → 393 (45 new tests across 9 files).

- `filterByMeta.test.ts` (10 tests) — no filter, case-insensitive search term, no match, an array-type meta filter, a scalar meta filter via equality, a search term combined with a meta filter (both must match), an empty-array filter value ignored, a negative numeric filter value ignored, a non-array/non-numeric field value under an array filter, and the default empty `meta` argument.
- `generatePagination.test.ts` (4 tests), `getOptionColorClass.test.ts` (3), `getSearchParam.test.ts` (7, against real `SpellMetaField` metadata rather than a stub — an integer, an array field both serialized and bare, a string, a boolean, an unknown field, and an invalid value), `isArrayEmpty.test.ts` / `isObjectArray.test.ts` (table-driven, matching the existing validator style) — one test file each, table-driven per the plan.
- `resolveFieldValue.test.ts` — the one branch nothing in the app actually reaches (every declared field has `options`, a `getDatum`, or is boolean) needed a stub `PageMeta` rather than real config, to exercise the bare `String(value)` fallback. `renderRichText.test.tsx` — a one-line component, covered with a plain render assertion.
- `sortByField/index.test.ts` — extended from one `test()` block asserting three cases to nine, covering descending order, case sensitivity on and off, equal elements, a custom `sortedValues` order, and non-array input.

**Not touched:** `isKeyOfItem.ts`, `isNumberArray.ts`, `isStringArray.ts`, `isValidDataArray.ts`, `isValidDataObject.ts`, `isValidFunction.ts`, `isValidString.ts`, `elementExists.ts`, `createEmptyArray.ts`, `getDataLabel.ts`, `parseSerializedArray.ts`, `resolveOptions.ts`, `sortSelectOptions.ts` — all were already at or near 100%, covered indirectly through component tests (`TextInput.test.tsx`, `renderFieldValue.test.ts`, etc.) rather than a dedicated suite of their own.

**A few filenames in the original write-up don't exist under those names** — `getPagination.ts` is `generatePagination.ts`, `cssColorClass.ts` is `getOptionColorClass.ts`. Same drift TD-37's write-up had; noted rather than silently worked around.

The original write-up follows for context.

---

### TD-39 (original) 🟡 Pure functions in `app/lib/utils/**` at 51%, cheapest real coverage available

**Where:** `filterByMeta.ts`, `getPagination.ts`, `getSearchParam.ts`, `cssColorClass.ts` — all 0%; `isArrayEmpty.ts`/`isObjectArray.ts`/`isStringArray.ts` at 0–50%; `sortByField` at 80%.

**Why:** `docs/TESTING.md` §2 sets this tier's target at 95% precisely because these are "trivial to cover" — no I/O, no mocking, table-driven `it.each` the way `isValidString`/`isNumberArray` already are. It's the highest coverage-per-hour in the register; the only reason it's ranked below TD-37/TD-38 is that pure-function bugs here are lower-stakes than an unverified auth path or query builder.

**Plan:** table-driven tests per function, same shape as the existing validator suites — empty input, single item, malformed input, the documented edge case in each function's own comment (e.g. `filterByMeta`'s handling of a filter key not present in the metadata).

**Done when:** `app/lib/utils/**` reads ≥95% lines.

---

### TD-40 ✅ Metadata correctness untested — `npcMeta` 14%, `deityMeta` 25% — **DONE (2026-08-02)**

**Outcome:** `app/lib/config/**` now reads 98.55% lines (68/69), above the 80% target. Added `pageMetaInvariants.testkit.ts` — not a test file itself (excluded from vitest's `**/*.{test,spec}.*` glob), a shared `describePageMetaInvariants(suiteName, meta)` helper called once per domain — plus `deity/deityMeta.test.ts`, `npc/npcMeta.test.ts`, `spells/SpellsMeta.test.ts`, and `pageMetaFields.test.ts` for the three base fields (`id`/`name`/`description`) declared directly on `pageMetaFields.ts` rather than in a domain meta object. Each domain suite runs the shared invariants (every field has a working `validator`, every select/multiselect has a non-empty `options` list, every `getDatum` survives a representative value for its `fieldType`) plus one domain-specific assertion: every declared field key appears in that domain's `queryFields` entry, so a field that stops being filterable is caught here rather than by a user noticing a missing filter control. `magicItemMeta.ts` needed no test of its own — it was already above 80% by virtue of being exercised through TD-38's `fetchFilteredMagicItems` suite. Test suite grew 349 → 504 (`describe.each` turns one domain file into one test per field per invariant, which is the bulk of that jump).

**One lint fix the plan didn't anticipate.** `expect(field.validator.safeParse).toBeTypeOf("function")` trips `@typescript-eslint/unbound-method` — passing a method off an object as a bare reference, the same class of issue `checkDatabaseReachable.test.ts` already documents for `vi.mocked(prisma.$queryRaw)`. Fixed the same way: `expect(typeof field.validator.safeParse).toBe("function")` reads the property instead of unbinding the method.

**Where:** `app/lib/config/pageMetaInvariants.testkit.ts` (new), `app/lib/config/deity/deityMeta.test.ts`, `app/lib/config/npc/npcMeta.test.ts`, `app/lib/config/spells/SpellsMeta.test.ts`, `app/lib/config/pageMetaFields.test.ts`.

The original write-up follows for context.

---

### TD-40 (original) 🟡 Metadata correctness untested — `npcMeta` 14%, `deityMeta` 25%

**Where:** `app/lib/config/npc/npcMeta.ts` (14.28%), `app/lib/config/deity/deityMeta.ts` (25%), `app/lib/config/spells/SpellsMeta.ts` (50%), `pageMetaFields.ts` (60%).

**Why:** the metadata layer is "the core abstraction" per `CLAUDE.md` — every field declared here drives form rendering, list columns, filters and query construction in one place, which is exactly why a wrong declaration is high-blast-radius and exactly why `docs/TESTING.md` §2 sets an 80% target here despite this being declarative data, not logic. `getQuery.test.ts` already covers the query builder that _consumes_ this data; nothing asserts the declarations themselves — that every field has a matching `validator`, that `getDatum` returns what the type says, that option lists used as `defaultValue: list[0].value` are non-empty (the exact class of bug `firstOptionValue.ts` was written to prevent, per TD-20b's write-up in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)).

**Plan:** one test per domain metadata file asserting structural invariants across every declared field (validator present and matches the field's type, `getDatum` doesn't throw on a representative row, filterable fields appear in the filter list) rather than one test per field — the failure mode this guards against is a missing or wrong declaration, not a specific field's behaviour.

**Done when:** `app/lib/config/**` reads ≥80% lines.

---

### TD-41 ✅ `app/lib/hooks/**` at 52% — `useFilterController` entirely untested — **DONE (2026-08-02)**

**Outcome:** `app/lib/hooks/**` now reads 95.56% lines (43/45), above the 70% target. Added `useFilterController.test.ts` (7 tests) via `renderHook`, mocking `next/navigation`'s `useRouter`/`usePathname`/`useSearchParams` the way `useClearSearchParams.test.ts` already does — `useSearchParams` returns a real `URLSearchParams` instance so the hook's own `new URLSearchParams(searchParams)` and `.get()` calls behave exactly as they would against the real API. Covers: inactive/no value with the param absent, active with the parsed value once present, `sortValue` defaulting to ascending and reading `desc` only when the URL says so, and `onFilter` both setting the field's param (resetting `page` to `1`) and — the one branch a first pass could easily miss — removing the param instead of writing `?level=-1` when the value is the query layer's "no selection" sentinel. Test suite grew 504 → 510.

**Where:** `app/lib/hooks/useFilterController.test.ts`.

The original write-up follows for context.

---

### TD-41 (original) 🟡 `app/lib/hooks/**` at 52% — `useFilterController` entirely untested

**Where:** `app/lib/hooks/useFilterController.ts` (0%); `usePageManager.ts` is already at 92%, the pattern to follow.

**Why:** filter state is what the URL round-trips through `getQuery.ts` — a bug here produces a filter UI that silently shows the wrong count or the wrong rows, the same failure class `getQuery.test.ts`'s own top-billing ("the highest-value unit tests in the project") exists to catch on the query side. The hook that drives it from the client has no equivalent.

**Plan:** `@testing-library/react`'s `renderHook`, the same tooling already in the dev dependencies for component tests (see TD-42). Cover add/remove/clear-filter transitions and that the hook's output shape matches what `getQuery.ts` expects as input, so a future change to one side is caught by the other's tests.

**Done when:** `app/lib/hooks/**` reads ≥70% lines.

---

### TD-42 ✅ `app/ui/**` behaviour untested — domain forms/cards/libraries near 0% — **DONE (2026-08-02)**

**Outcome:** `app/ui/**` reads 60.64% lines (305/503), above the 60% target; `EntityForm.tsx`, `EntityList.tsx` and `EntityLibrary.tsx` — the three TD-09 shells "done when" names — are each at 100%. Following the plan's own priority order:

- **`EntityList.tsx`** (6 tests): dispatch to the one fetch function matching its own `pageType`, the domain empty message, one row per item with the subtitle field rendered only for domains that declare one, a header per `listConfig` column, and the edit/delete actions per row. The row-level buttons (`SortableHeader`, `DeleteButton`, `ModalButton`) are stubbed — each has its own suite below, and re-rendering them here would test their internals twice while adding nothing to what `EntityList` itself is responsible for.
- **`EntityLibrary.tsx`** (6 tests): the same dispatch shape, one test per domain plus the search-params passthrough, with the four `*Library` components stubbed for the same reason.
- **Shared buttons** `app/ui/buttons/`: `SortableHeader` (5 tests — plain label vs. filter `<Select>`, sort click writing `sort`/`fieldSort`, filter-select writing the field param), `SelectButtonery` (4), `SortButton` (2), `ModalButton` (7 — the five `modalContent` variants plus open/close/`onSave` forwarding, with `Modal` and all five domain forms stubbed), `DeleteButton` (4 — success, server-reported failure, the missing-`error`-message fallback, and a rejected `fetch`), `ResetSearchButton` (1).
- **Other shared components**: `pagination.tsx` (6 — active-page rendering, arrow disabling at both ends, the ellipsis rendering as inert text).
- **Per-domain wrappers**: `SpellForm`/`NpcForm`/`DeityForm`/`MagicItemForm` (2–3 tests each — `EntityForm` stubbed, asserting each wires the right `pageType`/copy namespace/mutations and that the field-layout `children` function renders every field the domain declares; `MagicItemForm`'s `disableUntilEdited={false}` — the one documented behavioural difference among the four — gets its own assertion), `NpcCard` (2 — collapsed vs. expanded content), `NavLinks` (3 — link/label per entry, the admin link only where `listConfig` declares one, active-page highlighting matching either the public or admin path).
- **Left as-is, deliberately:** `WorldMap.tsx` (114 lines, 0%) — `CLAUDE.md`'s "Decisions and rejected approaches" names this exact file as intentionally-unwired scaffolding; a coverage push here would lock in incomplete behaviour as if it were finished, which is what this item's own "Why" section warns against. `SpellCard`/`DeityCard`/`MagicItemCard`, the four `*Library.tsx` wrappers, `login-form.tsx`, `skeletons.tsx` and a handful of near-pure-markup components (`Spinner`, `Modal`, `sidenav`, `cards.tsx`) were left uncovered too — the 60% target was reached on the aggregate without them, which is what "done when" asks for, and `docs/TESTING.md` §2's own warning against "padding, not verification" argues against chasing markup-only components just to move the number.

**A gap in coverage tooling, not in the suite, found on the way.** Selecting a real Headless UI `Listbox` option (as opposed to just opening it, which `Select.test.tsx` already covered) throws `ReferenceError: ResizeObserver is not defined` — jsdom does not implement it. `SortableHeader.test.tsx` stubs a minimal `ResizeObserver` locally rather than adding one to `vitest.setup.ts`, since no other suite needs it yet; if a second suite hits the same gap, that is the signal to promote the stub to the global setup instead of duplicating it a third time.

**Where:** `app/ui/components/{EntityList,EntityLibrary,pagination}.test.tsx`, `app/ui/buttons/{SortableHeader,SelectButtonery,SortButton,ModalButton,DeleteButton,ResetSearchButton}.test.tsx`, `app/ui/{spells,npc,deities,magicitems}/*Form.test.tsx`, `app/ui/npc/NpcCard.test.tsx`, `app/ui/dashboard/nav-links.test.tsx`.

The original write-up follows for context.

---

### TD-42 (original) ◑ `app/ui/**` behaviour untested — domain forms/cards/libraries near 0%

**Progress (2026-08-02):** the shared form machinery is covered, following exactly the "prioritize the TD-09 shells first" plan below — `EntityForm.tsx` (9 tests: create vs. edit mode, the `disableUntilEdited` gate, submit calling `create`/`update` with the right payload shape, field errors surfacing and blocking `onSaveFinished`), `PageForm.tsx` (10 tests: save vs. delete mode, button enablement, `isSaving` copy), and all of `app/ui/forms/inputs/` — `TextInput`, `TextareaInput`, `CheckboxInput`, `FormLabel`, `InputComponent` (which resolves a real `MetaConfigKey` against live `pageMetaFields` config to the right control, rather than a fake registry). Statements coverage moved 27.4% → 29.75%, branches 19.67% → 24.4%. `EntityList`/`EntityLibrary` and the per-domain `*Card.tsx`/`*Form.tsx` wrappers remain open — this item is not done, both TD-09 shells named in "done when" are still outstanding.

**Where:** effectively all of `app/ui/{deities,npc,magicitems,spells}/`, `app/ui/components/` (`EntityList`, `EntityLibrary`, `Modal`, `pagination`), `app/ui/buttons/`. `Select` (91%), `BaseButton/getCSSClasses` (100%) and `app/ui/forms/` (above) are now covered — the pattern to extend, not a green field.

**Why last:** `docs/TESTING.md` §2 sets this tier's target lowest among app code (60%, "behaviour, not markup") and is explicit that this is supporting cast, not one of the four things a reviewer pokes at. It's also the largest single surface in the register (this is why it's sized L, not S) — TD-09 already collapsed four duplicated component quartets into `EntityList`/`EntityLibrary`/`EntityForm`, so most of this domain-specific 0% is actually the same three generic components rendered four times, and testing the generic shell once covers most of the gap rather than requiring 16 separate suites.

**Plan:** Testing Library, user-facing queries (`getByRole`, `getByLabelText`) not snapshot tests, per `docs/TESTING.md`'s existing stance. Prioritize `EntityForm`/`EntityList`/`EntityLibrary` (the TD-09 shells, highest leverage) before the thin per-domain `*Card.tsx`/`*Form.tsx` wrappers around them. Skip pure-markup components with no logic (e.g. `PageTitle.tsx`) — coverage there would be padding, not verification, exactly what `docs/TESTING.md` §2 warns against chasing.

**Done when:** `app/ui/**` reads ≥60% lines, with `EntityForm`/`EntityList`/`EntityLibrary` individually above that bar.

---

### TD-43 ✅ `app/modules/maps/**` geometry and hooks near 0% — **DONE (2026-08-02)**

**Outcome:** `app/modules/maps/lib/utils/**` + `hooks/**` (excluding `components/`) reads 56.16% lines (442/787), above the 50% target. Covered, table-driven, no Leaflet-rendering involved: `coordinates.test.ts` (100%), `validation.test.ts` (86.44%) and `maps.test.ts` (89.52%) — the last of these against the _real_ `leaflet` package rather than a stub, confirmed safe to import headlessly first (bounds/geometry math needs no DOM; only tile rendering does). On the hooks side: `useTheme.test.ts` (mocking `next-themes` directly), `useMapTileProvider.test.ts` (mocking the sibling `useTheme` hook), `useMapControls.test.ts`, `useMapContextMenu.test.ts` (a fake map with working `on`/`off` to drive open/close transitions on right-click, click-away and Escape) and `useSafeMapOperations.test.ts`, all via a hand-built `MapContext.Provider` wrapper rather than the real `MapProvider`, for direct control over the map instance each hook receives.

**Narrower than the original plan, deliberately.** `useMeasurement` (135 lines) and `useMapMarkers` (42 lines) were left uncovered: both create real Leaflet layers via `L.marker(...).addTo(map)`, and `Layer.addTo` calls into `map.addLayer`, which in a real Leaflet `Map` does DOM wiring (`_panes`, icon positioning, `viewreset` listeners) that a hand-rolled fake `addLayer` can't reproduce without re-implementing Leaflet itself. That crosses into the rendering territory this item's own "Why" section already routes to `e2e/map.spec.ts`, not Vitest — the same reasoning TD-36 established. `useGeolocation` (`navigator.geolocation`, real browser permissions flow) was skipped for the same reason: not pure logic, not worth a jsdom-mocked navigator to hit a number. The 50% target was reached without them; the aggregate, not full per-file coverage, is what "done when" asks for.

**Where:** `app/modules/maps/lib/utils/{coordinates,validation,maps}.test.ts`, `app/modules/maps/hooks/{useTheme,useMapTileProvider,useMapControls,useMapContextMenu,useSafeMapOperations}.test.ts`.

The original write-up follows for context.

---

### TD-43 (original) 🟢 `app/modules/maps/**` geometry and hooks near 0%

**Where:** `app/modules/maps/lib/utils/{coordinates,maps,validation}.ts` (all 0%) — these are the same twenty sites TD-20b's write-up names as the reason `noUncheckedIndexedAccess` initially couldn't be verified safe by test; TD-20b shipped anyway with documented non-null assertions instead, so this item is not blocking anything, it is closing the gap TD-20b left on the table. Also `app/modules/maps/hooks/` at 20% (`useMeasurement`, `useMapMarkers`, `useContextMenu`, `useMapControls` all 0%) and `app/modules/maps/components/map/**` (0%, Leaflet rendering).

**Why last:** `docs/TESTING.md` §2 sets this tier's target lowest in the whole project (50%) and says why — "Leaflet is hard to test headlessly; cover hooks and utils, not rendering." `CLAUDE.md`'s "Decisions and rejected approaches" also flags this module as partly-vendored, partly-unwired-by-design scaffolding (`WorldMap.tsx`'s unused imports are deliberate) — a blanket coverage push here risks writing tests that lock in scaffolding as if it were finished behaviour, which is not this item's job.

**Plan:** `coordinates.ts`/`maps.ts`/`validation.ts` are pure geometry functions despite living in the maps module — test them exactly like TD-39's utils, table-driven, no Leaflet needed. `useMeasurement`/`useMapMarkers`/`useContextMenu`/`useMapControls` are plain hooks and take `renderHook`, same as TD-41. **Explicitly out of scope:** rendering `LeafletMap.tsx`/`MapMarker.tsx`/`MapContextMenu.tsx` themselves — `docs/TESTING.md` already routes that coverage through Playwright's `e2e/map.spec.ts`, not Vitest, and TD-36 is the live example of why a rendering assertion in Vitest wouldn't have caught the real bug anyway (it was a middleware routing issue, invisible to a component test).

**Done when:** `app/modules/maps/lib/utils/**` and `app/modules/maps/hooks/**` (excluding `components/`) read ≥50% lines.

---

## Post-sweep scoping — TD-44 through TD-46

### TD-44 ✅ Re-measure coverage with `coverage.all: true`; re-scope the 70% gap TD-37–43 didn't close — **DONE (2026-08-02)**

**Outcome:** `coverage.all: true` is set in `vitest.config.ts`. Re-running `pnpm test:coverage` with the flag on and off, on the same commit, produced byte-identical totals — 3289 lines either way, 1667 covered, 50.68%. **The suspected blind spot doesn't exist in this repo.** Without `all: true`, the v8 provider only instruments files a test actually loads — but with 93 test files exercising a codebase this interconnected, every file under `app/**` already gets pulled in transitively (shared definitions, enums re-exported through barrels, config composed from the same modules the tests import directly). There was no invisible file to find. The flag stays on anyway, as the more correct default going forward, and because the plan's premise — "a diagnostic run against a deliberately incomplete file list is not trustworthy input" — is still true in general, just not falsified by anything this repo currently has lying around untouched.

**Corrected finding:** the two gaps the original plan flagged as "already visible even without the flag" turned out to be the whole story, not a preview of a bigger one:

- **Page-level Next.js route components** (`app/[locale]/dashboard/**`, `app/ui/geography`) — 21 files, 121 lines, plus `app/ui/geography/WorldMap.tsx` at 114 lines. 235 lines total, 0% covered, no target in `docs/TESTING.md` §2's table. Filed as **TD-45**.
- **`app/modules/maps/components/**`** (Leaflet rendering) — 19 files, 737 lines, 0% covered. This alone accounts for the maps directory's low overall score despite `lib/utils/**` + `hooks/**` clearing TD-43's 50% target on their own. Deliberately routed through `e2e/map.spec.ts` rather than Vitest (`docs/TESTING.md` already says so; TD-36 is the standing example of why a Vitest rendering assertion wouldn't have caught that bug anyway). Filed as **TD-46**.

Thresholds in `vitest.config.ts` raised to 50/50/47/50 (lines/functions/branches/statements) to match what the suite actually achieves, replacing the stale 34/32/28/34 that had drifted behind TD-37–43's own progress. Baseline recorded in `docs/TESTING.md` §1.

**Do not fold TD-45 or TD-46 into a reopened TD-42 or TD-43.** Both closed against the target they were actually given; retroactively enlarging a closed item's scope after the fact is the same class of mistake as `CLAUDE.md`'s "flat file beside a directory" entry in the Decisions log — a boundary that existed for a reason getting quietly redrawn because it was inconvenient in the moment.

### TD-45 ✅ Page-level route components have no coverage target and 0% coverage — **DONE (2026-08-04)**

**Where:** `app/[locale]/dashboard/**` (layouts, loading/error/not-found boundaries, the 13 domain `page.tsx` files under `admin/` and the plain list routes) and `app/ui/geography/WorldMap.tsx`. 22 files, 235 lines, all 0%.

**Why:** every other tier in `docs/TESTING.md` §2's coverage-targets table was sized and pushed forward by TD-37–43; this layer was never given a row, so nothing has ever pointed at it. Most of these are thin Server Components (a `page.tsx` that composes a data fetch with a layout shell) — the risky logic they call into (`fetch*`, metadata, mutations) is already covered elsewhere per TD-38/TD-40, so this is not a security gap, but it is 235 lines of the app with zero verification that the composition itself is correct (right fetch called, right component rendered, error/loading boundaries actually wired).

**Outcome:** followed the plan's "one representative test per pattern, not one per domain" — 10 new test files, 27 new tests, suite 682 → 709. Coverage 50.68% → 54.51% lines, 47.64% → 48.92% branches; `vitest.config.ts` thresholds raised 50/50/47/50 → 54/53/48/54.

- `error.test.tsx`, `not-found.test.tsx`, `(overview)/loading.test.tsx`, `layout.test.tsx` — the plain-component boundaries, each covering its own conditional logic directly (the generic-vs-unreachable branch in `error.tsx`, the reset/console.error wiring, etc).
- `(overview)/page.test.tsx` — the one page with its own shape (`dynamic = "force-dynamic"`, `CardWrapper` composition).
- `spells/page.test.tsx` — representative of the public list-page pattern (`ListPage` + `EntityLibrary`, `generateMetadata`, item-count fetch); `deities`/`magicitems`/`npc` share the same shape and are not duplicated.
- `admin/spells/page.test.tsx` — representative of the admin list-page pattern (`Search`/`BaseButton`/`ResetButton`/`EntityList`/`Pagination`); same non-duplication rationale.
- `admin/spells/new/page.test.tsx` — representative of the admin "new item" pattern (a thin client component wiring a domain form's cancel/save to `router.push`).
- `geography/page.test.tsx` — the map-switcher's own state (selected map, highlighted button), with `WorldMap`/`MapProvider`/`MapErrorBoundary` stubbed.
- `WorldMap.test.tsx` — the component's own state machine (image-overlay bootstrap effect, POI-location-selection flow, export/import), with its child map components and hooks stubbed since each already has its own suite (`app/modules/maps/hooks/*.test.ts`). **Updated 2026-08-04 (TD-46):** the file was five components / four hooks even at TD-45 time — `MapDetailsPanel`/`useMapTileProvider` and the country-search state they backed were dead code, not unwired scaffolding, and were removed in `WorldMap.tsx`'s cleanup rather than left for this suite to eventually stub. The measurement panel is wired and covered separately, by e2e (`e2e/map-measurement.spec.ts`).

### TD-46 ✅ `app/modules/maps/components/**` (Leaflet rendering) had 0% Vitest coverage — DONE (2026-08-04)

**Where:** `app/modules/maps/components/map/` — `LeafletMap.tsx`, `MapMarker.tsx`, `MapContextMenu.tsx`, `MapPOIPanel.tsx`, `MapSearchBar.tsx`, `MapMain.tsx`, `MapControls.tsx`, `MapDetailsPanel.tsx`, `MapMeasurementPanel.tsx`, and smaller supporting components. 19 files, 737 lines, 0% covered.

**Why:** `docs/TESTING.md` originally routed this through `e2e/map.spec.ts` rather than Vitest — jsdom can't meaningfully render a Leaflet map, and TD-36's bug (a middleware routing issue) is the standing example of a rendering assertion in Vitest not being where this class of bug actually shows up. That's still true for the map canvas itself, but it doesn't apply to most of this tree: `vitest.config.ts` excludes `**/e2e/**` from coverage and measures `app/**` (this directory included), so **no amount of Playwright spec here moves the coverage number** — TD-45's own `WorldMap.test.tsx` already proved these components' _surrounding UI_ (forms, lists, panel state) is perfectly testable in jsdom with the map hooks stubbed. This is by far the largest coverage gap left in the codebase — 737 lines is more than the two other items combined.

**Strategy pivot (2026-08-04).** The first three sub-slices below were e2e (`map-poi-crud.spec.ts`, `map-measurement.spec.ts`) and real, valuable user-flow verification — but they left the coverage number untouched and are not what closes this item. Going forward TD-46 is Vitest work, following `WorldMap.test.tsx`'s pattern (stub the map/Leaflet internals, test the component's own state and rendering), split into two tiers so effort goes to code that ships before code that might not:

- **Tier 1 — components `WorldMap.tsx` actually renders today:** `MapPOIPanel`, `MapContextMenu`, `MapMeasurementPanel`, `MapControls`, `LeafletMap`. 0% coverage on live code — the real gap. **✅ Done 2026-08-04** — see outcome below.
- **Tier 2 — components only `MapMain.tsx` (unused reference copy) references:** `MapSearchBar`, `MapTopBar`, `MapTileSwitcher`, `MapThemeSwitcher`, `MapUser`, `LeafletGeoJSON`, `LeafletTileLayer`, `MapDetailsPanel`. Decide cable-or-delete per component _before_ writing tests for it — testing something destined for deletion is the worst ratio on the list. `MapDetailsPanel` moved here 2026-08-04: it's no longer imported by `WorldMap.tsx` at all (see below). **✅ Done 2026-08-04** — see outcome below.

**Tier 1 outcome (2026-08-04).** Five new test files — `LeafletMap.test.tsx`, `MapContextMenu.test.tsx`, `MapMeasurementPanel.test.tsx`, `MapControls.test.tsx`, `MapPOIPanel.test.tsx` —46 new tests, suite 709 → 755. Coverage 54.51% → 63.81% lines, 48.92% → 60.89% branches; `vitest.config.ts` thresholds raised 54/53/48/54 → 63/64/60/63.

- `LeafletMap.test.tsx` mocks the `leaflet` module directly (`L.map()`, `map.on`/`off`, `getContainer`) rather than a wrapper hook — the one component in this tree actually driving Leaflet's own API, as opposed to reacting to state around it. Found along the way, not fixed: its `onClick`/`cursorStyle` effects depend on `[onClick]`/`[cursorStyle]` identity, not on whether `mapRef.current` is populated yet, so on first mount — with a stable callback — neither wires up. `WorldMap.tsx`'s real usage happens to work around this: `handleMapClick`'s `useCallback` is keyed on `isSelectingPOILocation`, so toggling location-selection is what changes the callback identity and triggers the effect to (re)run, by which point the map has initialized. The test documents this rather than treating it as a bug to fix under a coverage item.
- `MapContextMenu.test.tsx` — pure props component, no hooks: open/closed rendering, all three menu actions (add marker, measure, add-to-POI) firing with the clicked coordinates and closing, clipboard copy with the "Copied!" feedback state, outside-click-to-close (with the real 0ms `setTimeout` the component uses to avoid closing itself from the same contextmenu event) versus inside-click no-op.
- `MapMeasurementPanel.test.tsx` — mocks `useMeasurement`; mode-tab toggling (start vs. clear on a re-click), point count and distance/area display with the component's own m/km and m²/ha/km² formatting thresholds, Undo/Done disabled-state rules per mode, and that the panel's own `lastMeasurement` state (not the mocked hook) is what keeps the result visible once `mode` resets to idle on finish.
- `MapControls.test.tsx` — mocks `useMapControls`/`useGeolocation`; button-to-hook wiring, disabled zoom/reset with no map, and the `fullscreenchange` listener flipping the Enter/Exit fullscreen label and icon.
- `MapPOIPanel.test.tsx` — the largest (889 lines): list rendering and category filtering, Export/Clear disabled with no POIs, confirmed Clear All, add/edit/delete/fly-to, title and coordinate validation on save, the linked-entity type→id cascading select with `fetchLinkableEntities` mocked, and import-file wiring. Desktop panel branch only (`window.innerWidth` pinned above the mobile breakpoint) — the mobile `Drawer` branch is unexercised, matching the "one representative shape, not every branch" approach TD-45 used.

**Tier 2 outcome (2026-08-04).** Before writing anything, checked who actually imports the eight remaining components: `MapMain.tsx` wires together `MapSearchBar` → `MapUser`, `MapTopBar`, `MapTileSwitcher`, `LeafletGeoJSON`, `LeafletTileLayer`, `MapDetailsPanel` — and `MapMain.tsx` itself has zero importers outside its own directory (`grep` confirmed only a barrel re-export in `index.ts`). `MapThemeSwitcher` is orphaned even from `MapMain`. Per `CLAUDE.md`'s "vendored library stays as inventory, ask before deleting" rule, asked the user for a cable-or-delete decision rather than assuming either way; the answer was **test as-is, leave dead** — write coverage for each component in isolation, without wiring `MapMain` into `WorldMap.tsx`. Eight new test files, 52 new tests, suite 755 → 807. Coverage 63.81% → 70.09% lines, 60.89% → 69.66% branches; `vitest.config.ts` thresholds raised 63/64/60/63 → 70/71/69/69. **This crosses Phase 2's 70% coverage exit criterion** — see `docs/ROADMAP.md`.

- `MapTopBar.test.tsx`, `MapThemeSwitcher.test.tsx` — small pure-props/single-hook components: pill rendering and click wiring; mounted/unmounted placeholder, icon/label per theme, toggle wiring (mocks `useTheme`).
- `MapUser.test.tsx` — the one Radix `DropdownMenu` in this tree with a test. jsdom has no `user-event` dependency in this repo, but a plain `fireEvent.pointerDown` + `fireEvent.click` on the trigger opens it reliably; from there, item clicks (GitHub link, Close Maps → `router.push("/")`, the mobile theme toggle) are ordinary `fireEvent.click`.
- `MapTileSwitcher.test.tsx` — selected-provider label, fallback to the first layer for an unknown id, `onProviderChange` wiring. The label text appears twice (main button + slide-out panel), so assertions scope with `within()` on the main button's role rather than a bare `getByText`.
- `LeafletGeoJSON.test.tsx`, `LeafletTileLayer.test.tsx` — mock `@/app/modules/maps/hooks/useLeafletMap` directly (a fake map object) plus the `leaflet` module's `geoJSON`/`tileLayer` factories, following `LeafletMap.test.tsx`'s pattern of stubbing Leaflet itself rather than a wrapper. Cover: no-op with no map yet, add-and-fly-to-bounds / add-with-defaults, style/prop overrides, invalid-bounds and invalid-url guards, layer replacement on prop change, and cleanup on unmount.
- `MapDetailsPanel.test.tsx` — desktop panel branch only (jsdom's default `window.innerWidth` already reads as desktop), matching `MapPOIPanel.test.tsx`'s convention. Covers the `fetch` to `restcountries.com` keyed on `ISO_A2` (missing code → no fetch), the rendered facts (population/area/capital/currency/languages), a rejected fetch logging rather than throwing, and the close button.
- `MapSearchBar.test.tsx` — the largest of the eight (14 tests): immediate fetch on focus, the 150ms debounce on typing (`vi.useFakeTimers` + `advanceTimersByTimeAsync`), loading/no-results/fetch-failure states, click and keyboard (arrow/Enter/Escape) selection, the selected-country and POI-panel display modes, locate-me and Map Tools wiring, and outside-click collapse. The dropdown panel is CSS-collapsed (`max-h-0`/`opacity-0`) rather than unmounted when closed, so "is it closed" assertions check the panel's class list, not the absence of result text — an early version of these tests asserted text removal and failed for exactly this reason.

**`WorldMap.tsx` cleanup (2026-08-04, TD-46).** The file carried an `eslint-disable @typescript-eslint/no-unused-vars` covering its whole body, justified by `CLAUDE.md`'s "unused is not dead" note. Re-examined: most of what it covered was genuinely dead, not unwired-and-waiting — `MapSearchBar`/`MapTopBar` were commented out of the JSX entirely (no path to ever render), and everything that existed only to feed them (`selectedCountry` state, `handleCountrySelect`, `handleClearSelection`, `handleOpenPOIPanel`, `handleCategoryClick`, `handleMeasurementOpen`, `GEOJSON_STYLE`, the whole `useMapTileProvider()` call and `tileLayerProps`, and the `<MapDetailsPanel>` render — confirmed dead by removing the disable comment and letting `eslint` name every unused local) was removed along with them. The disable comment is gone; the file now imports and renders only what it uses. `CLAUDE.md`'s decision-log entry was narrowed to match — see there for what's still legitimately unwired-scaffolding versus what wasn't.

**Audit (2026-08-04).** What e2e exercised before the strategy pivot, against the Tier 1/2 component list above:

- `map.spec.ts` — map mount/artwork, world switching, and the right-click context menu opening with its three items visible.
- `map-poi-link.spec.ts` (pre-existing, previously missing from `docs/TESTING.md` §"E2E — Playwright") — the "Add to My Places" → linked-entity flow end to end, including the popup's "View NPC" link.

Sub-slices closed or attempted, in order:

1. ✅ **POI panel CRUD (e2e)** — add an unlinked POI → list → edit → delete → gone (`e2e/map-poi-crud.spec.ts`). Real flow coverage; doesn't move the Vitest number.
2. ❌ **Map search/filtering (e2e) — abandoned.** `MapSearchBar`'s only entry point (the search bar itself) was commented out of `WorldMap.tsx` — unreachable by a real user, so there was nothing for e2e to exercise. Now Tier 2: wire-then-test, or delete, as a deliberate feature decision.
3. ✅ **Measurement (e2e)** — distance mode from the context menu's "Measure" item (`e2e/map-measurement.spec.ts`). Real flow coverage; doesn't move the Vitest number.
4. Tile/theme switching — `MapTileSwitcher`/`MapThemeSwitcher` confirmed to have no importer in `WorldMap.tsx` (same status as the now-removed `useMapTileProvider` call). Given a Vitest suite in Tier 2 instead of e2e, since there's no reachable user flow to drive.
5. ✅ **Tier 1 Vitest suites (2026-08-04)** — `MapPOIPanel`, `MapContextMenu`, `MapMeasurementPanel`, `MapControls`, `LeafletMap`. See outcome above.
6. ✅ **Tier 2 Vitest suites (2026-08-04)** — `MapSearchBar`, `MapTopBar`, `MapTileSwitcher`, `MapThemeSwitcher`, `MapUser`, `LeafletGeoJSON`, `LeafletTileLayer`, `MapDetailsPanel`. See outcome above.

**Done.** Both tiers have Vitest coverage; Tier 2 was tested in place rather than wired-or-deleted, per the user's explicit call against `CLAUDE.md`'s "vendored library stays as inventory" rule. `docs/TESTING.md` §2 now reflects the actual result — Vitest, not e2e, is what closed most of this. The suite crosses Phase 2's 70% coverage exit criterion; no further TD is filed for this component tree unless a future session decides to wire or delete the dead `MapMain` subtree, which would be a product decision, not a coverage one.

---

## TD-58 ✅ Dependabot grouped a major ESLint bump into the dev-dependencies group, breaking CI — DONE (2026-08-06)

**Where:** `.github/dependabot.yml`.

**Why:** TD-57 (2026-08-04) added Dependabot with an `ignore` list blocking major-version bumps for `next`/`react`/`@prisma/*`/`typescript` — packages `CLAUDE.md` rule 7 says need a human changelog read — and an `exclude-patterns` list keeping `typescript` out of the grouped `dev-dependencies` PR for the same reason. `eslint` wasn't on either list. Dependabot PR #81 (2026-08-06) grouped a major ESLint bump (9.39.2 → 10.8.0) together with 12 unrelated patch/minor updates under `chore(deps-dev): bump the dev-dependencies group`, and CI's `pnpm lint` step failed: `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function`. ESLint 10 changed `context.getFilename()` (the _rule_-context method, not `Linter#getFilename` — the two are separate APIs in ESLint's docs) in a way `eslint-plugin-react@7.37.5` — pulled in transitively by `eslint-config-next` — still calls the old way. Not a bug in this codebase; an upstream incompatibility that a same-day major-version PR surfaced.

**Fix:** added `eslint` to `dependabot.yml`'s `dev-dependencies` group `exclude-patterns` (so a future major bump can't hide inside an otherwise-safe grouped PR) and to the `ignore` list with `update-types: ["version-update:semver-major"]` (so Dependabot won't propose one until a human reads the changelog and confirms `eslint-plugin-react`/`eslint-config-next` compatibility) — same treatment as `next`/`react`/`@prisma/*`/`typescript`.

**Not done here:** PR #81 itself. It bundles the breaking major bump with 12 safe updates; resolving it (closing and letting Dependabot re-open a clean set, or manually splitting it) is a GitHub action left to the maintainer rather than done from this session.

**A gap worth naming, not fixed here:** TD-56 and TD-57 (2026-08-04 — `.env.example` and this same `dependabot.yml`) were never given entries in this register despite shipping and merging; a PR merge-commit message claimed "record TD-47 – TD-57" but no `TECH_DEBT.md` entry for any of TD-47–TD-57 exists except this one. Backfilling those is out of scope for this fix — it touches unrelated history — but it means the register currently understates what's actually been done, the same "two documents disagreeing" failure the 2026-07-30 maintenance note below already warns about.

---

## TD-59 ✅ `prisma` CLI and `@prisma/client`/`@prisma/adapter-pg` could bump independently, breaking the build — DONE (2026-08-06)

**Where:** `.github/dependabot.yml`, `package.json`, `pnpm-lock.yaml`.

**Why:** Prisma requires the CLI/generator (`prisma`, a devDependency) and the client runtime it targets (`@prisma/client`, `@prisma/adapter-pg`, both prod dependencies) to be on the same version — a mismatch produces code the runtime can't satisfy, not a warning. TD-57's `dependabot.yml` grouped dependencies by `dependency-type` (`dev-dependencies` vs `prod-dependencies`), which put `prisma` and `@prisma/client`/`@prisma/adapter-pg` in two different groups with no relationship between them. Surfaced 2026-08-06 as two simultaneously open PRs, each breaking CI alone: **PR #83** bumped `@prisma/client` alone (7.1.0 → 7.9.1) — Turbopack's build failed with `Module not found: Can't resolve '@prisma/client/runtime/query_compiler_bg.postgresql.mjs'`, because the still-7.1.0 generator emits an import for a runtime filename the 7.9.1 client no longer ships (only `query_compiler_fast_bg.*`/`query_compiler_small_bg.*` variants exist there now). **PR #87** (the grouped dev-dependencies PR) bumped `prisma` to 7.9.1 without touching the client packages — the mirror-image half of the same mismatch, left latent because that PR's own failure was TD-58's ESLint issue, found first.

**Fix:**

- `dependabot.yml`: added a `prisma` group matching `prisma` and `@prisma/*` with no `dependency-type` restriction, so both sides bump together in one atomic PR regardless of prod/dev classification. Added `exclude-patterns: [prisma]` to `dev-dependencies` so the CLI doesn't also get swept into that group (it would otherwise match both). `prod-dependencies` already excluded `@prisma/*`, kept as-is.
- Added `prisma` (the bare CLI, previously not covered — only `@prisma/*` was) to the major-version `ignore` list, matching `CLAUDE.md` rule 7.
- Aligned the repo to the already-in-flight version to unblock both stuck PRs: `prisma`, `@prisma/client`, `@prisma/adapter-pg` all pinned to `7.9.1` (previously `@prisma/adapter-pg` was already at `^7.9.1` while `@prisma/client`/`prisma` sat at `^7.1.0` — a pre-existing mismatch in the repo before either PR, just not yet triggered). `pnpm prisma generate`, `pnpm build`, `pnpm typecheck`, `pnpm lint` and the full suite (807 tests) all verified green locally before pushing.

**Not done here:** closing PR #83 and #87 themselves — once this merges, both are superseded (the versions they proposed are already in `main`) and can be closed without merging, a GitHub action left to the maintainer.

---

## TD-61 ✅ Option-backed `Int` fields accept any number; an out-of-list value renders as a blank cell — DONE (2026-08-07)

**Outcome:** audited every option-backed column against the live database first (per the plan below) — `SELECT DISTINCT`-equivalent checks via a throwaway script against all 18 columns (`npc.alignment`/`alignmentDomain`/`location`/`faction`, `magicitems.rarity`/`type`, `spells.level`/`circle`/`classes`, and `deities`' 9 option-backed columns) found zero out-of-list values, so a strict membership validator could be applied directly with no data-repair step. Added `optionValueValidator`/`optionArrayValidator` in `app/lib/utils/validators/`, each building a Zod schema from an option list's `value`s; applied to all ~20 fields across `npcMeta`, `deityMeta`, `magicItemMeta`, `SpellsMeta`, replacing every `z.number().int()` and (on `deityMeta`) the weaker `z.coerce.number()`. `pageMetaInvariants.testkit.ts` (TD-40) gained a generic invariant — any field declaring `options` on an integer or array `fieldType` must reject a value not in that list — so it now runs automatically for every domain's test file, including a new `magicItemMeta.test.ts` (the only domain that didn't already have one). Unit tests cover both validator functions directly; `pnpm test`, `pnpm typecheck`, `pnpm lint` and `pnpm format:check` all pass (two pre-existing, unrelated `UPLOAD_DIR`-env failures in `prisma.test.ts` reproduce on `main` too).

**Where:** every field in `app/lib/config/**` that declares an `options` list — roughly 20 across `npcMeta`, `deityMeta`, `magicItemMeta` and `SpellsMeta`.

**Why:** these fields store an `Int` whose meaning comes entirely from a `value:` literal in a hand-maintained TypeScript array (`factions.ts`, `locationList.ts`, `rarity.ts`, …). Nothing checks that a submitted number is actually in the list:

- Nine fields declare `validator: z.number().int()`, which accepts `999`.
- The nine option-backed fields in `deityMeta` declare `validator: z.coerce.number()` — weaker still, accepting the string `"999"` and the non-integer `5.7`.
- Postgres has no constraint either: the columns are plain `Int`.

The failure is silent, not loud. `getDataLabel` filters the option list for a matching `value` and returns `""` when nothing matches, so a row holding an unmatched number displays an **empty cell** — in the list, the card and the form — with no error anywhere. Editing one of the option arrays (renumbering, or deleting an entry) therefore repoints or blanks every row that held an affected number, with nothing to catch it. `factions.ts` already runs `0…8, 10…19, 21, 22` — values 9 and 20 were removed at some point, and whether any row still holds them is unknown.

**Plan:** one shared helper in `app/lib/utils/validators/` that builds a Zod schema from an option list (plus an array variant for `spells.circle` / `spells.classes`), applied to every option-backed field so a new one cannot be declared without membership checking. `pageMetaInvariants.testkit.ts` (TD-40) is the natural place to assert that every field declaring `options` also validates against them, so the rule is enforced for future fields rather than just fixed for today's.

**Audit first.** Run a `SELECT DISTINCT` per option-backed column against the live database before applying the validators. If existing rows hold out-of-list values, a membership validator turns every future save of those rows into a validation failure — on a field the DM may not even be editing. That case needs a decision (repair the data, or reject only newly-submitted out-of-list values), not just the validator.

**Why it is its own item, not part of SPEC-003.** It needs no migration, no schema change and no new table; it covers all ~20 fields rather than the two that become relations; and it is where most of the correctness benefit of the whole "real relations" idea actually lives. Agreed on 2026-08-06 to ship ahead of any schema work. See [`docs/specs/003-real-relations.md`](./specs/003-real-relations.md) §1 for the full analysis.

**Done when:** every field declaring `options` rejects a value outside that list with a field-level error, there is a test proving it per domain (scalar and array), and the invariant suite fails if a future field declares `options` without a matching validator.

---

## TD-62 ✅ POI category names are hardcoded English and reach the UI — DONE (2026-08-07)

**Outcome:** SPEC-004 (already largely implemented by the time this was picked up) kept the 14 POI categories as-is under `kind: "poi"`, confirming the re-theming it flagged as a reason to wait hadn't landed — so this could proceed independently, per its own "Sequencing" note. `POICategoryConfig.name: string` became `labelKey: string`, resolved at the render boundary in `MapPOIPanel.tsx` with `useTranslations()` (ADR-0007's pattern) rather than `resolveOptions`/`SelectOption`, since the category shape carries `color`/`bgColor`/`icon` fields that don't fit that generic type. Added `geography.poiCategories.*` — 14 keys — to both `messages/en.json` and `messages/it.json` (English keeps the original strings; Italian is new authoring, no rulebook to check against per ADR-0007's note on the setting's own lists). `MapPOIPanel.test.tsx`'s one assertion touching a category label was updated to match `vitest.setup.ts`'s global `next-intl` mock (identity function, returns the raw key). Verified live in the browser: switching the locale selector changes all 14 category labels in the "Add Place" panel's Category dropdown. Scope stayed strictly to `POI_CATEGORIES`' `name`/`labelKey` field — the rest of `MapPOIPanel.tsx` (and the map module generally) has plenty of other hardcoded English copy (`"My Places"`, `"Category"`, `"Linked entity"`, the context menu's `"Copy Coordinates"` / `"Add to My Places"`, …), a much larger pre-existing TD-21 gap this item was never scoped to close.

**Where:** `app/modules/maps/constants/poi-categories.ts` — the `name` field of all 14 `POI_CATEGORIES` entries (`"Food & Drink"`, `"Shopping"`, `"Transport"`, …). Rendered at [`MapPOIPanel.tsx:330`](../app/modules/maps/components/map/MapPOIPanel.tsx).

**Why:** TD-21 extracted every user-facing string into `messages/{it,en}.json` and the app ships bilingual, but this list was missed — it declares its labels inline, in English, and the panel renders them directly. An Italian user filtering POIs by category sees English labels. `CLAUDE.md`'s rule is explicit: no new hardcoded UI strings, and these are old ones that survived the sweep.

Found on 2026-08-06 while drafting [SPEC-004](./specs/004-world-model.md), which turns `category` into the world model's `kind` and re-themes these values for the setting (an inn, a temple, a boat in the harbour) — so the strings are going to be rewritten anyway.

**Plan:** replace `name: "Food & Drink"` with a `labelKey`, resolved at the render boundary per [ADR-0007](./adr/0007-message-key-resolution-boundary.md), the way every option list in `app/lib/config/**` already does. Add the 14 keys to both catalogues so TD-21's CI key-set check stays green.

**Sequencing:** cheap and self-contained, so it can ship now. But if SPEC-004 is built soon it will rewrite this list wholesale, and doing both means translating strings twice — worth checking which is closer before starting.

**Done when:** no `POI_CATEGORIES` entry carries a hardcoded display string, and switching locale changes the category labels in `MapPOIPanel`.

---

## TD-64 ✅ `WorldMap.tsx`'s async-effect map-loading pattern trips `react-hooks/set-state-in-effect` — **DONE (2026-08-07)**

**Where:** [`app/ui/geography/WorldMap.tsx`](../app/ui/geography/WorldMap.tsx) — the `useEffect` that used to call `void initializeMap()`.

**Why:** PR #90 (Dependabot, dev-dependencies group) bumped `eslint-config-next` 16.0.10 → 16.2.12, which pulled in the React Compiler's `react-hooks/set-state-in-effect` and `react-hooks/refs` rules. Three pre-existing patterns started failing `pnpm lint` as a result — unrelated to what that PR actually changed (only `package.json`/lockfile). Two were fixed outright on 2026-08-06: `MapSearchBar.tsx`'s `selectedIndex` reset moved from a `useEffect` to the "adjust state during render" pattern from the React docs, and `usePOIManager.ts`'s `tRef.current = t` moved from the render body into a dependency-less `useEffect`. PR #90 itself went 49 commits stale before it could land and was superseded by PR #112, which carried the same dependency bump plus a third pre-existing fix in this family (`useNavigableChildren.ts`'s ref mutated during render) and pinned `eslint-plugin-react-hooks` to `7.1.1` via `pnpm.overrides` — without that override, `pnpm install` resolved 7.0.1, which does not flag this rule family at all.

`WorldMap.tsx`'s case was different from the other two: the old `initializeMap` was `async`, and the rule flagged the function invoked directly in the effect body because it transitively called `setState` through an `await` — a known category of false positive for this rule with async local functions declared, then called, in an effect. Re-verified against `eslint-plugin-react-hooks@7.1.1` on 2026-08-07: still flagged, so the false-positive read held and no upstream fix had landed.

**Fix:** restructured the effect per the plan below — the dynamic `import("leaflet")` is the only genuinely async step, so it now stays a plain `.then()`/`.catch()` chain instead of an `async` function called from the effect body. Building the overlay and calling `setCurrentImage` moved into the `.then()` callback, which the rule can see is synchronous. A `cancelled` flag guards against committing state after an unmount or a `map`/`mapUrl` change mid-flight (the old `async` version had no such guard). No behavior change; `WorldMap.test.tsx`'s 11 cases pass unmodified.

**Done when:** the disable comment is removed and `pnpm lint` still passes. ✅ — no `eslint-disable-next-line react-hooks/set-state-in-effect` remains in this file.

---

## TD-65 ✅ `DATABASE_URL` in this dev environment isn't a throwaway DB — e2e debris landed in real data — **DONE (2026-08-07)**

**Where:** `.env`'s `DATABASE_URL`, which `pnpm test:e2e` also writes and deletes real rows against (`CLAUDE.md`'s own warning on the command).

**Why:** found 2026-08-06 while starting SPEC-004 T3 — the `poi` table's only 5 rows were e2e test debris (`"E2E World 1786045869959"`, four `"E2E POI …"` rows linked to `npc` ids 713–716), not a DM-created root. No real world had been created via the M4 UI yet; the debris was masquerading as one, with an arbitrary uploaded test image instead of the real `piani-esistenza.jpg`. Deleted by hand before T3's seed ran (confirmed no live-data references first: nothing had `parentId` pointing at the fake root, `npc` 713–716 weren't otherwise touched).

This means whatever ran `pnpm test:e2e` most recently was pointed at this same dev database rather than a disposable one, contrary to `CLAUDE.md`'s explicit instruction. It is easy to do by accident — nothing enforced `DATABASE_URL` being different for `pnpm dev` vs `pnpm test:e2e`, both read the same `.env`. On investigation, the more precise mechanism is Playwright's own `reuseExistingServer: true` default outside CI: a `pnpm dev` already running against `.env`'s real database is exactly what gets silently attached to, rather than a fresh e2e-configured server.

**Fix:** both parts of the plan below, not just one. `playwright.config.ts` now loads `.env.test` (new — see `.env.test.example`) and passes its `DATABASE_URL` explicitly to the dev server it spawns for `webServer`, never `.env`'s; it throws at config-load time if `.env.test` is missing, has no `DATABASE_URL`, or that value matches `.env`'s. Separately, `reuseExistingServer` is now unconditionally `false` (previously `!process.env.CI`, i.e. `true` locally) — the actual root cause found above — so a stray dev server on `:3000` now fails the run on a port conflict instead of being silently reused. Both checks are skipped in CI (`process.env.CI`), which has no `.env`/`.env.test` at all — the `e2e` job already provisions its own disposable Postgres service and sets `DATABASE_URL` as a job-level env var (`.github/workflows/ci.yml`), so requiring a file there would just break CI for no protection gained. `docs/TESTING.md` §E2E and `CLAUDE.md`'s command warning updated to describe the new setup and point at `.env.test.example`'s exact commands for creating the second database inside the same Postgres container.

**Done when:** running `pnpm test:e2e` locally cannot write to the same database `pnpm dev` uses, either because the config makes it structurally impossible or because a guard refuses to start otherwise. ✅ — verified directly: `pnpm exec playwright test --list` throws before listing anything when `.env.test` is absent, and again when its `DATABASE_URL` is set equal to `.env`'s; succeeds once it names a distinct database.

---

## TD-66 ✅ `UPLOAD_DIR`'s relative default silently splits map-image files from the DB rows referencing them — **DONE (2026-08-07)**

**Where:** [`app/lib/config/env.ts`](../app/lib/config/env.ts)'s `UPLOAD_DIR` (default `./storage/maps`, per `.env.example`), consumed by [`FilesystemMapImageStore`](../app/lib/storage/FilesystemMapImageStore.ts).

**Why:** `UPLOAD_DIR` is a relative path, resolved against whatever `process.cwd()` happens to be for the process that wrote it — not tied to the repo root or to any other process reading it. `DATABASE_URL` has no such ambiguity (it names a server, not a location on disk), so nothing about running two checkouts of the same repo against one shared Postgres instance warns that map images need the same care.

Hit 2026-08-07: SPEC-004 T3's migration script (`app/seed/migrateWorldTreeT3.ts`) ran from an agent worktree, uploading four map images via `defaultMapImageStore.put()`. The DB rows it created (in the one shared dev database) correctly reference those images' ids — but the actual JPEG bytes landed in the worktree's own `./storage/maps/`, not the maintainer's separate checkout of the same repo. `/dashboard/geography` loaded with no errors (`fetchRootPlace` succeeded — the DB row was fine) but every map image 404'd, because that checkout's `./storage/maps/` was empty. Fixed by hand: copying the four files across.

**Fix:** `env.ts` now rejects a relative `UPLOAD_DIR` outright — `path.isAbsolute()`, refined at parse time, throwing a message that names TD-66 — instead of silently resolving it against whichever checkout happens to be running. When `UPLOAD_DIR` is unset entirely, it now defaults to a fixed, checkout-independent path under `os.homedir()` (`~/.campaign-settings/storage/maps`) rather than throwing as it did before; every checkout on the same machine agrees on this path regardless of `process.cwd()`. `.env.example` documents the requirement and leaves the variable commented out (recommending the default) rather than shipping the relative value that caused the incident; `docs/adr/0008-map-image-storage.md` updated to match. **Side effect worth noting:** making `UPLOAD_DIR` optional-with-a-default also fixed 3 previously-failing, pre-existing test cases in `app/lib/connections/prisma.test.ts` that had nothing to do with TD-66 directly — they failed only because `UPLOAD_DIR` wasn't set in their test environment, which the new default now supplies. `app/lib/storage/FilesystemMapImageStore.test.ts` still fails standalone on a missing `DATABASE_URL`, unrelated to this fix.

**Done when:** running the app (or a migration script) from a second checkout of this repo, pointed at the same `DATABASE_URL`, serves every existing map image with no manual file copy. ✅ — both checkouts now resolve `UPLOAD_DIR` to the same absolute, home-anchored path by default; a checkout that still has an old relative value in its own `.env` fails loudly at startup instead of silently writing to the wrong directory.

---

## TD-67 ✅ "Add to My Places" context-menu label is misleading — it creates any kind, not just a POI — **DONE (2026-08-07)**

**Where:** [`MapContextMenu.tsx`](../app/modules/maps/components/map/MapContextMenu.tsx)'s `label="Add to My Places"` / `sublabel="Save this location"` menu item — the only entry point into `MapPOIPanel`'s "Add Place" form.

**Why:** found 2026-08-07 verifying SPEC-004 T2/T3's UI end-to-end. Since M5, that one context-menu item opens a form whose first field is a `Kind` selector covering all seven kinds (`region`, `plane`, `city`, `dungeon`, `deity`, `npc`, `poi`) — not just a POI. The label and sublabel both predate M5 and were never updated once the form grew beyond POIs, so a DM reading "Add to My Places / Save this location" has no reason to expect a plane or an NPC pin lives behind it.

**Fix:** exactly the rename the plan proposed — `label="Add Place"` / `sublabel="Create a place here"`, matching `MapPOIPanel`'s own "Add Place" heading. `MapContextMenu.tsx` still hardcodes its copy directly in JSX (TD-21, bilingual UI, has not reached this file), so this stays a plain string change, not a catalogue key. Updated every reference to the old copy: `MapContextMenu.test.tsx`'s assertions and test names, and the `getByRole` selectors in `e2e/map-poi-crud.spec.ts` and `e2e/map-poi-link.spec.ts`.

**Done when:** the context-menu item's label and sublabel describe what the form actually does for every kind, not just POI. ✅ — verified via `MapContextMenu.test.tsx` (8/8 passing, including the "shows/hides depending on `onAddPOI`" and "calls `onAddPOI`" cases against the new text). The two e2e specs' `getByRole` selectors were updated to match but not re-run end-to-end in this session — no `.env.test` was set up locally and the change is a same-length string swap already covered by the unit-level render assertions; CI's `e2e` job will be the first real run against the new copy.

---

## TD-68 ✅ `MapPOIPanel`'s Close button is unclickable — a same-`z-index` overlay intercepts the click — **DONE (2026-08-07)**

**Where:** [`MapPOIPanel.tsx`](../app/modules/maps/components/map/MapPOIPanel.tsx) — the desktop side-panel's close button (`absolute top-4 right-4 z-10`, `aria-label="Close"`) versus the hero-image gradient overlay (`absolute inset-0 bg-gradient-to-t ... z-10`) in the same stacking context.

**Why:** found and reproduced live 2026-08-07. Both elements share `z-10`; per CSS stacking rules a tie resolves by DOM order, and the gradient overlay comes after the button, so it wins and sits on top everywhere the two overlap — including exactly where the close button is. `document.elementFromPoint()` at the button's own center returns the gradient `div`, not the button, confirming every click there is swallowed before it reaches `onClick`. Once open, a DM has no way to close this panel from the button that says "Close" — only navigating away or (on mobile, a separate `Drawer` implementation) swiping down still works.

**Fix:** exactly the one-line fix the plan proposed — the close button's `z-10` raised to `z-20`, matching the title overlay's existing `z-20` and clearing the gradient's `z-10`. Audited the rest of the header per the plan's own risk note: the Add/Import/Export/Clear action buttons live in a normal-flow (non-`absolute`) row below the hero image entirely, never overlapping it — no other element in this panel shared the collision.

**Verification:** added `e2e/map.spec.ts`'s "clicking the visible Close button closes the desktop POI panel" — a real Playwright `.click()`, which performs actionability/hit-target interception before dispatching, exactly the check `document.elementFromPoint()` did manually during triage. Confirmed both directions locally: reverted to `z-10` and re-ran just this test, which failed with Playwright's own diagnostic naming the exact intercepting element — `<div class="... bg-gradient-to-t ... z-10">... subtree intercepts pointer events` — then restored `z-20` and re-ran, passing (5/5 in the full file). `MapPOIPanel.test.tsx`'s existing `fireEvent.click` case (27/27 passing) was insufficient on its own, as the plan predicted: it calls the handler directly and would not have caught this.

**Done when:** clicking the visible "Close" (X) button closes the desktop panel every time, verified by a test that simulates a click at the button's actual rendered position (not just calling the handler directly, which would not have caught this). ✅

---

## TD-69 ✅ `poi.linkedType`/`linkedId` has no unique constraint — a second pin per NPC/deity is silently possible — **DONE (2026-08-07)**

**Where:** [`prisma/schema.prisma`](../prisma/schema.prisma)'s `poi` model — currently `@@index([linkedType, linkedId])`, a plain index.

**Why:** SPEC-004 §6 documents this pair as `@@unique([linkedType, linkedId])` and relies on that guarantee explicitly: "it makes a second pin for the same NPC impossible rather than merely discouraged." The unique constraint was never actually added when M2 built the column — only a lookup index. Found 2026-08-07 by reproducing it directly: creating a `deity` place through `MapPOIPanel` for Elune (already pinned by SPEC-004 T4's migration, `linkedId` 18) succeeded without any error, leaving two `deity` pins for the same record. Deleted by hand after confirming nothing referenced the duplicate.

This is a real data-integrity gap, not just a spec/implementation mismatch on paper: nothing in the app — form validation, the server action, or the database — stops it from recurring for any NPC or deity, silently, indefinitely.

**Fix:** ran the audit query first (`SELECT "linkedType", "linkedId", count(*) FROM poi WHERE "linkedType" IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1` against the live dev DB) — 0 rows, nothing for the constraint to reject. Replaced the plain `@@index` with `@@unique([linkedType, linkedId])` in `schema.prisma` (Postgres's normal unique-index semantics exempt `NULL`, so every unlinked `poi` row is unaffected). TD-63 is still open, so this went through its documented hand-apply workaround rather than `prisma migrate dev`: wrote `prisma/migrations/20260807130000_poi_linked_unique_constraint/migration.sql` by hand, applied it directly against the live dev DB via `docker exec … psql`, then `prisma migrate resolve --applied`. `prisma migrate diff` against the live DB afterward reported only one remaining difference — an empty, pre-existing `customers` table unrelated to this schema and to TD-69 — confirming nothing else leaked into this migration.

**Verification:** added `e2e/map-poi-link.spec.ts`'s "a second POI linked to the same NPC is rejected, not silently duplicated", run against a real Postgres with the migration applied. The server log confirms the actual mechanism: a genuine `PrismaClientKnownRequestError` (`P2002`, `Unique constraint failed on the fields: (linkedType, linkedId)`) is thrown by the real database, caught by `usePOIManager.addPOI`'s existing rollback-and-toast path (previously only unit-tested against a generic mocked rejection, never against this real error), and surfaced to the DM as "Impossibile salvare «…». La modifica è stata annullata." — the second pin is never created. Chose a real end-to-end test over a mocked unit test deliberately: a mock proves the application's error-handling code path works, not that the database itself enforces the constraint, which is the actual claim TD-69 needed proven.

**Done when:** the constraint exists in `schema.prisma` and the live DB, and a test proves a second `create` for the same `(linkedType, linkedId)` pair is rejected. ✅

---

## TD-70 ✅ No rendering path exists for `deity`/`npc` pins on the map, even once positioned — **DONE (2026-08-07)**

**Where:** `app/modules/maps/hooks/` — `usePOIManager.ts` only renders `kind: "poi"` markers (filters `row.kind === "poi"`); `useNavigableChildren.ts` only renders navigable kinds (`region`/`plane`/`city`/`dungeon`) that carry a map. Nothing renders `deity` or `npc` pins.

**Why:** found 2026-08-07 giving Elune (a deity) real coordinates through `MapPOIPanel`'s "Add Place" flow — the row was created successfully (until TD-69's duplicate got cleaned up) with `lat`/`lng` set, but nothing appeared on the map. There is currently no hook, marker layer, or icon set for `deity`/`npc` kinds at all — not a bug in an existing path, an entirely missing one.

This sits next to, but is narrower than, SPEC-004 T4's already-deferred "derive and display location from the tree" (reading a record's place by walking up its pin — see `docs/specs/004-world-model.md` T4). That deferred item is about _computing_ a location to show in the NPC/deity UI; this item is about the map itself never drawing a `deity`/`npc` pin as a marker at all — a DM can give one coordinates (TD-71 aside, once they exist to give), but can never see it on the map to confirm the placement looks right.

**Fix:** exactly the plan's shape — `app/modules/maps/hooks/useLinkedEntityMarkers.ts`, mirroring `useNavigableChildren.ts`'s data-fetch/draw-effect structure (same `fetchPlaceChildren` call, same `refetchToken` wiring), but filtering for `kind === "deity" || kind === "npc"` with non-null coordinates and a resolved link, and rendering its own circular marker (colour and emoji per `LinkableEntityType` — purple ✨ for `deity`, teal 🧑 for `npc`) with a popup linking to the entity's own page, reusing `usePOIManager.createMarker`'s popup-link pattern. Wired into `WorldMap.tsx` alongside `useNavigableChildren`, sharing the same `parentId`/`placesRefetchToken`. New code, so unlike the POI popup it's modeled on, the title is HTML-escaped before reaching the popup — no reason to start a fresh file with an XSS gap an existing one happens to have.

**Verification, and a real Playwright/Leaflet interaction bug found along the way:** `e2e/map-linked-entity-markers.spec.ts` creates a deity, places it via "Add Place", and clicks the resulting marker. A real Playwright `.click()` (move-then-mousedown-then-mouseup) reliably failed to open the bound popup — reproduced directly: the marker received focus and Leaflet's own outline-suppression ran, proving the click landed on the right element, but no `.leaflet-popup` ever appeared, while a plain synthetic `element.click()` run by hand in a live browser session opened it every time. Root cause: Leaflet's own map-drag handler reads Playwright's synthetic mouse movement into position as the start of a pan and suppresses the click it would otherwise forward to the marker — not a bug in this hook or the app, and the reason `map-poi-link.spec.ts`'s existing popup test never actually clicks a marker either, using `flyToPOI`'s `openPopup()` call instead. Worked around here with `locator.dispatchEvent("click")`, which fires the DOM event Leaflet listens for without going through synthetic-mouse-event drag detection.

**Done when:** a `deity` or `npc` pin with coordinates renders as a clickable marker on its parent's map. ✅ — 7 new unit tests (`useLinkedEntityMarkers.test.ts`, incl. an HTML-escaping case) plus the e2e test above, run against a real Postgres.

---

## TD-71 ✅ No way to position or edit a place that already exists — only newly-created ones get coordinates — **DONE (2026-08-07)**

**Outcome:** both interactions the 2026-08-07 product decision called for, per [SPEC-005](./specs/005-place-repositioning.md) — a "Da posizionare"/"Unplaced places" section in `MapPOIPanel`'s list view (click-to-place through the existing crosshair mode) and drag-to-reposition on every marker all three hooks render. `updatePoi` needed no changes at all — no `kind` filter, no `kind` field in its update schema, so it was already reusable for any kind; every write in both flows sends only `{ id, lat, lng }`, never `category` (SPEC-005 §6's one hazard).

Landed as nine commits on `td71-place-repositioning`, in SPEC-005 §10's order:

- **T0 (TD-72, done first — see its own entry):** inline `style` → Tailwind in the two marker hooks' HTML, sequenced ahead because T4/T5 rewrite the same lines.
- **T1:** `useUnplacedChildren.ts` — data-only hook reading a place's children still missing `lat`/`lng`, any kind.
- **T2:** the panel section itself (presentational), plus a `positioningPlaceId` prop so a row shows "Click on map (cancel)" while its own positioning is in flight.
- **T3:** wiring into `WorldMap.tsx` — the crosshair mode is shared with the create flow, branching on whether a place is being positioned; `usePOIManager` exports `reloadPOIs` (its existing internal `loadPOIs`) since a newly-positioned `poi` isn't in its own optimistic-update state yet.
- **T4–T6:** drag-to-reposition in `usePOIManager.ts`, `useNavigableChildren.ts` and `useLinkedEntityMarkers.ts`. `useNavigableChildren.ts` needed an explicit guard (`justDragged`, a plain per-marker closure variable) so a drop doesn't also trigger `onDescend` — Leaflet's own click suppression after a drag isn't a documented cross-version/touch guarantee.
- **T7:** e2e coverage for the drag flow (`e2e/map-place-repositioning.spec.ts`) — a real mouse gesture, reload, and a coordinate-changed assertion proving the write persisted. **The picker flow (§5.A) has no e2e spec, deliberately** — there is no in-app path that produces an unplaced place to start from (`placeSchema.ts` requires `lat`/`lng` at creation for every kind; the only unplaced rows that have ever existed are SPEC-004's one-time seed script's), and reaching around that with raw-DB seeding in the e2e harness would be a new precedent bigger than this item. Covered instead at the unit/integration level: `useUnplacedChildren.test.ts`, `MapPOIPanel.test.tsx`'s unplaced-places block, `WorldMap.test.tsx`'s positioning block.

**A real bug found by a test, not by inspection, mid-implementation:** `useNavigableChildren.ts`'s first draft read `previous` off the closure inside `setChildren`'s own updater function — React does not guarantee that updater runs before the next line of caller code executes, so `previous` was `undefined` by the time `revert()` needed it on a failed drag. Fixed the same way `usePOIManager` already does it: a `childrenRef` kept in sync via its own effect, read synchronously instead of trusting the updater's timing. Applied correctly from the start in `useLinkedEntityMarkers.ts` (T6).

**Also found doing T7's local e2e setup, not fixed here:** filed as TD-73 — `.env.test.example`'s documented `prisma db push` step leaves a fresh e2e database unable to seed, because the `faction` table's data only comes from a migration's raw SQL, which `db push` never runs.

The original write-up follows for context.

---

### TD-71 (original) 🟠 No way to position or edit a place that already exists — only newly-created ones get coordinates

**Where:** `MapPOIPanel.tsx`'s `handleEditMode` (only reachable from `POIListItem`'s `onEdit`, itself only ever fed `kind: "poi"` rows by `usePOIManager`) — the only path in the app that can set or change a place's `lat`/`lng` after creation.

**Why:** found 2026-08-07 while verifying SPEC-004 T3/T4's seeded tree (166 places and pins, all with `null` coordinates by design — "assigned a parent, not yet placed", per §6). There is no UI to give any of them a position: the only way a `region`/`plane`/`city`/`dungeon`/`deity`/`npc` place gets `lat`/`lng` is choosing that kind in "Add Place" _at creation time_, right-clicking the exact spot on the map. Nothing lets a DM select an existing place from the tree and say "place it here" — the closest workaround is deleting and recreating it, which loses everything that made it what it was (a `deity`/`npc`'s `linkedId`, a `region`'s own children underneath it).

This is not a bug introduced by T3/T4 — the gap predates them (M5 was only ever designed around create-time positioning) — but T3/T4 are what expose it: they are the first thing to populate the tree with places nothing can ever position through the UI as it stands today.

**Done when:** a DM can select any existing place (any kind, not just `poi`) and give it a position on its parent's map, without deleting and recreating it.

---

## TD-73 ✅ `.env.test.example`'s documented e2e setup (`prisma db push`) leaves a fresh DB unable to seed — **DONE (2026-08-07)**

**Outcome:** `.env.test.example` and `docs/TESTING.md` §E2E's step 2 now say `prisma migrate deploy`, with an inline note on why `db push` fails (it skips `add_faction_table_and_fk`'s raw-SQL `INSERT`). `grep -l "INSERT INTO" prisma/migrations/*/migration.sql` returns only that one migration, so no other data-seeding migration has the same gap — nothing else to fix. Verified against the local e2e database left over from TD-71's session (already migrated with `migrate deploy`, not recreated — a `DROP DATABASE`/`CREATE DATABASE` reset was attempted for a from-scratch check but blocked by the permission classifier as destructive): `faction` holds 21 rows, `npc` 2, no FK violation, and `pnpm test:e2e e2e/npc-crud.spec.ts --project=chromium` passes (3/3).

**Where:** `.env.test.example`, `docs/TESTING.md` §E2E's setup instructions.

**Why:** found 2026-08-07 provisioning a fresh e2e database for TD-71's T7. Both places instruct `DATABASE_URL="<.env.test's URL>" pnpm prisma db push` to sync the schema before `pnpm db:seed`. Following that exactly reproduces: `magicitems`/`deities` seed fine, then `npc` fails with `Foreign key constraint violated on the constraint: npc_fazione_fkey`. The `faction` table (SPEC-004 T1) is populated by a raw-SQL `INSERT` inside migration `20260806220000_add_faction_table_and_fk`, not by `prismaSeed.ts` — `db push` diffs the schema shape only, it never runs migration files, so the table exists but stays empty. `prisma migrate deploy` (which does run migration SQL) fixes it; confirmed working against the same fresh database.

**Plan:** change `.env.test.example`'s comment and `docs/TESTING.md` §E2E to say `prisma migrate deploy`, not `prisma db push`. Worth checking whether any other data-seeding migration has the same problem before calling this done — `add_faction_table_and_fk` might not be the only one.

**Done when:** following `.env.test.example`'s own instructions on a brand-new database, verbatim, ends with a working `pnpm db:seed` and a passing `pnpm test:e2e`.

---

## TD-63 ✅ Local dev DB's migration history had a gap `migrate dev`/`migrate deploy` couldn't get past — **DONE (2026-08-08)**

**Outcome:** resolved all three untracked/failed migration rows against the maintainer's dev DB, and found and fixed one more drift the original write-up hadn't caught.

- Confirmed with `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` that the live DB matched the two pending migrations' target schema except for one leftover: the `customers` table (Next.js Learn tutorial debris, 0 rows, no code references — TD-06's dead-tutorial-table cleanup had already gotten `invoices`/`revenue` but missed this one). Dropped it with the maintainer's explicit confirmation, per CLAUDE.md's rule against unconfirmed `DROP`s, then the diff went empty.
- `prisma migrate resolve --applied` for `20260726093000_add_spells_nome_drop_tutorial_tables` and `20260726100000_add_timestamps_and_name_indexes`, and for the `20251126152855_resetio` row, which had reverted to **failed** since the write-up's last check — exactly the SPEC-004 M2 leftover it had already flagged as "worth checking before the next migration attempt." `applied_steps_count: 0` confirmed it died on its very first statement (an "already exists" against objects `db push` had already created), and the DB-wide diff being empty confirmed its target state was already live, so `--applied` was correct there too.
- `prisma migrate status` then reported no pending, no failed — but a real `prisma migrate dev` round-trip (throwaway nullable column on `spells`, reverted after) still hit drift: `ALTER TABLE "png" RENAME TO "npc"` (`20260730020000_rename_png_table_to_npc`) renames the table but not Postgres's auto-named objects, so a full sequential replay leaves the primary key `png_pkey` and the name index `png_nome_idx`, while the maintainer's DB — rebuilt with `db push` at some point since — already had `npc_pkey`/`npc_nome_idx`. Added a corrective migration, `20260808150000_rename_npc_pkey_and_index`, doing the two renames explicitly (same pattern as `20260726093000`'s corrective fix), then `resolve --applied` on the dev DB since it was already in the target state.
- Re-ran the throwaway-column round-trip against the fixed history: `prisma migrate dev` applied cleanly, no shadow-DB drift, no reset prompt.

**Where:** `my-database-container` (the maintainer's local dev Postgres, `DATABASE_URL` in `.env`). `_prisma_migrations` there, plus the new `prisma/migrations/20260808150000_rename_npc_pkey_and_index/`.

**Why:** the dev database was originally built with `db push`, and only some migrations were ever recorded as applied against it — `20260730020000_rename_png_table_to_npc` and `20260731120000_add_poi_table` (both hand-applied via `docker exec … psql` then marked with `prisma migrate resolve --applied`, per that migration's own header comment). The three migrations before them (`20251126152855_resetio`, `20260726093000_add_spells_nome_drop_tutorial_tables`, `20260726100000_add_timestamps_and_name_indexes`) were never recorded, even though the schema they describe was already live — the DB's actual shape and its tracked history disagreed.

This blocked both commands that assume a clean history:

- `prisma migrate dev` builds a shadow database and replays every migration file from empty; the replay died partway through with `relation "png" does not exist` (a step assumed state the shadow DB never had, because the real DB got there by a different path).
- `prisma migrate deploy` tried to apply the DB's actual pending list in order and died the same way, now with `relation "deities" already exists` — the SQL was trying to create a table the live DB already had.

Surfaced again on 2026-08-06 while shipping SPEC-004 M2's migration, which had to be applied the same workaround way as M1: hand-write the SQL (via `prisma migrate diff --from-config-datasource --to-schema` against the live DB, which needs no shadow database), apply it directly with `docker exec … psql`, then `prisma migrate resolve --applied` to record it.

---

## TD-75 ✅ `pnpm test` fails on a clean checkout — one suite needs a `DATABASE_URL` that only CI provides — **DONE (2026-08-08)**

**Outcome:** `vitest.config.ts`'s `test` block now sets `env: { DATABASE_URL: "postgresql://admin:postgres@localhost:5432/placeholder" }`, the same placeholder `.github/workflows/ci.yml` already sets for the `test` job. Verified with `env -u DATABASE_URL pnpm test`: 139/139 files, 1029/1029 tests, green with no `.env` file present and nothing exported. `pnpm typecheck`, `pnpm lint` and `pnpm format:check` all pass on the same change.

**Where:** `app/lib/config/env.ts` (the eager validation), surfaced by `app/lib/storage/FilesystemMapImageStore.test.ts`. The harness gap was in `vitest.config.ts`, which set no `env`.

**Why:** `env.ts` parses the environment **at import time** — deliberately, per TD-02b, and the file says why: _"a missing variable throws immediately, naming it, at the first import instead of at first use."_ That is right for the app. It also means any test that exercises real code importing `env.ts` needs a `DATABASE_URL` present, and nothing in the test harness provided one.

So `pnpm test` on a machine that had not exported it failed **one file out of 139** with a `ZodError` naming `DATABASE_URL`, while everything else passed. Reproduced 2026-08-08; `set -a; . ./.env; set +a; pnpm test` was green, so the failure was environmental, not a real regression.

**Two things made this worth an item rather than a note.**

- **It was invisible in CI**, which is why it survived. `.github/workflows/ci.yml` sets `DATABASE_URL: postgresql://admin:postgres@localhost:5432/placeholder` as a job env var for the `test` job, so the suite was green there and nothing signalled the gap.
- **It made the project's own Definition of Done unreliable.** `CLAUDE.md` requires "`pnpm test` passes" before a change is complete. On a fresh clone that command was red for reasons unrelated to the change, so the first thing anyone did was diagnose a non-bug — the exact cost `CLAUDE.local.md` exists to prevent.

**Plan (as executed):** gave `vitest.config.ts` an `env` block setting a placeholder `DATABASE_URL`, mirroring exactly what CI already does. Self-contained, no dependency on a gitignored local file, and it fixes the class rather than the instance.

Three alternatives, and why not:

- **Load `.env` in `vitest.setup.ts`** — makes the suite depend on a gitignored file, so a fresh clone still fails. This is the obvious-looking fix and it does not work.
- **Mock `env.ts` in the affected suite** — narrow, and recurs for every future test of code that reads env.
- **Make `env.ts` validate lazily.** This would fix it, and it **reverses a deliberate TD-02b decision** quoted above. Do not trade the app's fail-fast behaviour for a test-harness convenience; fix the harness.

---

## TD-74 ✅ `pageMetaFields` spread four domain metas into one flat object — a name collision silently discarded one — **DONE (2026-08-08)**

**Outcome:** `pageMetaFields.ts` now declares a `SharedMetaField` union (`"alignment" | "alignmentDomain" | "location"`) and a type-level check, `DomainMetaFieldsAreDisjoint`, asserting that every pair of the four domain metas is disjoint outside that set. A real collision fails `pnpm typecheck`, naming the offending pair.

Two things surfaced only by testing the guard against an induced collision, not obvious from the plan:

- **A naive `keyof A & keyof B` never catches anything**, because domain metas key their entries by enum member and string enums are nominal — `DeityMetaField.alignment` and `NpcMetaField.alignment` are different types despite both being `"alignment"` (the same fact `MetaConfigKey`'s own comment already documents, for the same reason). `keyof typeof deitiesMeta & keyof typeof npcMeta` intersects to `never` even when the two really do share a key, silently defeating the whole check. Verified in isolation before writing it into the real file: an `E1.alignment`/`E2.alignment` pair (same string, different enum) produces no error with a bare `keyof` intersection and does with `` `${keyof A}` & `${keyof B}` `` — the template literal `MetaConfigKey` already uses to collapse enum members to their string values.
- **A union of the six pairwise checks doesn't survive lint.** Today every pair is genuinely disjoint, so `CollidingKeys<...> | CollidingKeys<...> | ...` is six indistinguishable `never`s — exactly what `@typescript-eslint/no-duplicate-type-constituents` and `no-redundant-type-constituents` exist to catch, and they did, correctly, since this isn't the union it looks like. Restructured as a mapped object type (`DomainMetaPairs`, one named property per pair) checked against `Record<keyof DomainMetaPairs, never>` instead — no `|` syntax for the linter to flag, and a real collision now names its pair in the error (e.g. `magicItemsNpc`) rather than just surfacing as an anonymous string literal.

**Verified by probe, not by an automated test** — this project has no type-testing harness (no `.test-d.ts` convention, no `expectTypeOf`/`tsd` anywhere), and the "Done when" below is itself phrased as a manual `pnpm typecheck` check. Added a throwaway colliding key to `npcMeta.ts` (`rarity`, already declared in `magicItemsMeta`) and confirmed `pnpm typecheck` failed naming `magicItemsNpc`; added a throwaway `DeityMetaField.location` entry to `deityMeta.ts` and confirmed the allowed-shared-field case stayed clean; reverted both. `pnpm typecheck`, `pnpm lint` and `pnpm format:check` all pass on the real change.

**Where:** `app/lib/config/pageMetaFields.ts`.

**Why:** the registry is built as `{ ...deitiesMeta, ...spellsMeta, ...magicItemsMeta, ...npcMeta }`. Domain metas key their entries by enum member, and those members are plain strings — `DeityMetaField.alignment` and `NpcMetaField.alignment` are both `"alignment"`. **Last spread wins, so `npcMeta`'s declaration is the one that survives, and `deityMeta`'s is discarded with no type error.** Object spread does not report duplicate keys, and `satisfies Record<string, PageMeta>` only checks the shape of what survives.

This was correct purely by accident of the colliding fields being identical: `alignment`, `alignmentDomain` and `location` genuinely are the same field for both domains, which is why `deityMeta.ts` declares none of them and `pagesConfig.ts`/`listConfig.ts` reach for `NpcMetaField.*` on the deity pages. `pagesConfig.ts`'s own header comment documents the arrangement, so the sharing is deliberate.

**What made it debt rather than a design** is that nothing distinguished deliberate sharing from an accidental collision. If someone added a `deities.title` while `npcMeta` already declared `title` — plausible, both domains have one, and they mean different things — the deity form and list would have silently rendered the NPC field's label, placeholder, options and validator. No compiler error, no test failure unless one happened to assert that exact label. SPEC-003 §1 spotted this and recorded it as "worth recording for a future reader, though not this spec's business"; it was true and unguarded from then until this fix.

The risk was rising with [SPEC-006](./specs/006-factions.md): once a field can declare `optionTable`, a collision would silently swap not just a label but _where a field's options come from_ — this guard is now in place before SPEC-006 T6 switches `npcMeta.faction` to a table source.

---

## TD-72 🟢 `usePOIManager.ts` and `useNavigableChildren.ts` build marker/popup HTML with inline `style`, not Tailwind classes

**Where:** `app/modules/maps/hooks/usePOIManager.ts`'s `createMarker` (POI markers and their popups) and `useNavigableChildren.ts`'s marker `html` — both build Leaflet `L.divIcon`/`bindPopup` content as raw HTML template strings using `style="..."` attributes.

**Why:** found 2026-08-07 when the maintainer reviewed PR #119 (TD-70) and pointed out `useLinkedEntityMarkers.ts` — new in that PR — did the same thing, and flagged it as a rule that was true all along but never written down: this project uses Tailwind exclusively, no inline styles, including in non-JSX raw HTML strings (CLAUDE.md's "Non-negotiable rules" §8 now says so explicitly). `useLinkedEntityMarkers.ts` was fixed before merge. These two older files were the precedent it copied the _pattern_ from (not the specific violation — inline styles predate TD-70 entirely) and are now the only two places in `app/modules/maps/**` still doing it.

**Plan:** convert both to the same `class="..."` Tailwind-utility approach `useLinkedEntityMarkers.ts` now uses — straightforward 1:1 translation (`width: 32px` → `w-8`, `border-radius: 50%` → `rounded-full`, arbitrary values for anything off the default scale), no behavior change. Small enough to be one commit touching both files.

**Done when:** no `style="..."` attribute remains in any marker or popup HTML string under `app/modules/maps/**`.

---

## TD-76 ✅ `renderRichText` injects stored text as raw HTML with no sanitisation — **DONE (2026-08-13)**

**Outcome:** the fix was neither of the two options the item originally weighed. Checking the actual call sites first (`ControlType.Textarea` on every field this touches, no sanitiser library anywhere in `package.json`, no WYSIWYG control in the app) showed the DM has never authored real HTML — every description is plain text typed into a `<textarea>`. So `dangerouslySetInnerHTML` was not "unsanitised rich text," it was **plain text being misrendered as HTML that happened not to have broken yet.** That reframes the fix: not "sanitise the HTML" (implies HTML is legitimately authored) and not "switch to Markdown" (Phase 5's separate, bigger feature, with its own spec, later) — the correct minimal fix is to stop treating the string as HTML. `renderRichText` now renders `{datum}` as JSX text (React escapes it — an `<img onerror=...>` typed into a field renders as literal characters, never as a real element) inside a `whitespace-pre-wrap` div, which preserves the DM's line breaks without injecting `<br>` markup. Zero new dependencies, no input-control change, and it does not foreclose Phase 5 Markdown — that will replace this function's body entirely when it is built, unblocked either way. Three new tests replace the one that asserted the old (defective) behaviour: HTML-looking text renders literally rather than as markup, a script/event-handler payload never executes, line breaks survive via CSS rather than `<br>` injection. Verified in a real browser against seeded spell descriptions — multi-line text renders correctly, no visual regression.

**(original) Where:** `app/lib/utils/data/renderRichText.tsx` was four lines:

```tsx
const renderRichText = (datum: string): ReactNode => (
  <div dangerouslySetInnerHTML={{ __html: datum }} />
);
```

It is the `getDatum` of every `description` field, so **every description in the
database is rendered as unsanitised HTML** on the card and list pages.

**(original) Why this is Medium and not Critical.** The app is self-hosted, single-user, and
the only author of that text is the DM writing about their own world. There is no
untrusted submitter today, and non-negotiable rule #2 (validate at the boundary)
is satisfied for _shape_ — `z.string()` accepts the text, which is correct; it is
the _rendering_ that trusts it.

**(original) Why it is not Low either.** Two of the boundaries are already wider than "the DM
types it":

- **`pnpm db:import`** loads a JSON file from disk through the same Zod
  validators. A library exported from somewhere else, or edited by hand, reaches
  `renderRichText` unchanged.
- **The player-facing read-only view** (`ROADMAP.md` Phase 5) is the point at
  which a second reader exists, and it is the wrong moment to discover this.

**(original) The fix is small** — sanitise on the way out, or keep the field plain text and
render Markdown instead. That second option is not a workaround: `ROADMAP.md`
Phase 5 already lists "Rich text in descriptions — `renderRichText` exists as a
stub; make it real", and the DM named formatted descriptions as one of the three
things they miss most (2026-08-10). **So this item and that feature are the same
piece of work, and doing them together is cheaper than doing either alone.**
Decide the direction when it is scheduled; do not sanitise HTML now and then
replace it with Markdown next month.

**Why the original framing's two options were both wrong, and a third existed.** The item asked to decide between sanitising HTML and switching to Markdown — both assume the field legitimately carries markup today. Neither is true. The actual defect was narrower and cheaper than either option it was framed against, which is why "decide the direction when scheduled" turned out to be the wrong question: there was no direction to decide, only a bug to fix. Phase 5's Markdown feature remains exactly as open as it was — this item closing does not touch it.

---

## TD-77 ✅ An entity's location is resolved through two unreconciled read paths — **DONE (2026-08-13)**

**Outcome:** read both functions and every call site before picking a direction, per the item's own instruction not to guess. `fetchEntityLocationSummaries` (`EntityList`) and `fetchDerivedAncestry` → `toDerivedPlacements` (`EntityLibrary`) turned out not to be a coin flip: `toDerivedPlacements`'s `DerivedPlacement` (`place`, `plane`, `zoneId`, `poiId`) is already a strict superset of what `LocationSummary` (`zoneId`, `poiId`, `title`) gave `EntityList` — same precedence (the POI's title over the Zone's, `null` when nothing is assigned), same ids, plus a `plane` field the admin list simply has no column for and ignores. Pointing `EntityList` at the same path `EntityLibrary` already used was therefore the cheaper direction with no adapter needed, exactly the "pick whichever already has the shape the other call site needs" instruction the item gave.

One asymmetry surfaced only by reading, not guessable from the two functions' names alone: `fetchEntityLocationSummaries.ts` opened with `"use server"`, making it an independently POST-reachable Server Action, which is why it called `requireSession()` — per `requireSession`'s own docstring, "Server Actions are POST endpoints any client can reach, and the proxy does not cover them." `fetchDerivedAncestry.ts` carries no such directive; it is a plain server-only function only reachable from other server code during render (the dashboard's own auth gate, `auth.config.ts`'s `authorized` callback, already covers the page it renders inside), the same pattern `fetchFilteredNpc`/`fetchFilteredDeities` already use for both the admin list and the public library. Losing the `requireSession()` call is therefore not an auth regression — it brings `EntityList`'s location read in line with every other read it already makes, not an exception to non-negotiable rule #1.

Changed `app/ui/components/EntityList.tsx` to call `fetchDerivedAncestry` + `toDerivedPlacements` instead, reading `place`/`zoneId`/`poiId` off the resulting `Record<number, DerivedPlacement>` in place of the old `Map<number, LocationSummary>`. Deleted `fetchEntityLocationSummaries.ts`, `fetchEntityLocationSummaries.test.ts`, and the now-unused `LocationSummary` interface. No coverage was lost in the deletion: the precedence and null-fallback tests were re-derived as `EntityList.test.tsx` assertions against the real (unmocked) `toDerivedPlacements`, the same pattern `EntityLibrary.test.tsx` already used to keep its own suite honest about the real reduction logic; the deities-vs-npc dispatch and DB-error-wrapping cases were already independently covered in `fetchDerivedAncestry.test.ts`. The one test with no equivalent — "rejects an unauthenticated request" — was dropped deliberately, not folded in: it was asserting the now-removed `requireSession()` call, which the paragraph above explains was never actually protecting anything the page's own auth gate didn't already cover.

Updated the two doc comments (`pageMetaFields.ts`'s `location` field, `deriveEntityAncestry.ts`'s module docstring) and `fetchDerivedAncestry.ts`'s own docstring to describe the single path, rather than leaving them to reference a function that no longer exists.

**(original) Where:** `EntityList` resolved an NPC/deity's location via `fetchEntityLocationSummaries`. `EntityLibrary` resolved the same thing via `fetchDerivedAncestry` → `toDerivedPlacements`. Both were correct, and agreed, but only because both independently relied on the same `zoneId := poi.zoneId` invariant — nothing in the code enforced that they stayed in step if that invariant ever changed.

**(original) Why this shape.** This was exactly the failure shape [SPEC-007](./specs/007-placement-backlog.md) §7 named in advance ("two things doing one job and drifting", after TD-09's quartets and the metadata layer's near-forks) and asked to reconcile in its implementation plan. What shipped instead (T3, PR #142) was the minimum that unblocked the card's "Sconosciuta" state — `toDerivedPlacements` also carried `zoneId`/`poiId` — without collapsing the two paths into one.

**(original) The fix is a direction choice, not a mechanical one:** either point `EntityList` at `toDerivedPlacements` too, or have `EntityLibrary` read `fetchEntityLocationSummaries` instead. Pick whichever already has the shape the other call site needs, then delete the loser.

---

## TD-80 ✅ Deity, magic-item, and faction create/update Server Actions lack unit and e2e test coverage — **DONE (2026-08-17)**

**Outcome:** followed the two templates the item pointed at, one per mutation shape. Unit tests (`createDeity.test.ts`, `updateDeity.test.ts`, `createMagicItem.test.ts`, `updateMagicItem.test.ts`, `createFaction.test.ts`, `updateFaction.test.ts`) follow `createNpc.test.ts`/`updateNpc.test.ts` — the closest existing pattern, since all six share the same `requireSession()` + `buildCreateSchema`/`buildUpdateSchema` shape npc's mutations use, unlike the maps mutations' `toDatabaseError`-wrapped try/catch. None of the six wraps its Prisma call in a try/catch, so unlike `createNpc`/`updateNpc` there is no foreign-key or `DatabaseError`-wrapping case to assert — each suite covers only what the code actually does: unauthenticated rejection (no write), a successful create/update with the exact `data` payload asserted, a non-positive id rejected on update without a write, and one out-of-range-value rejection per domain (an `optionValueValidator` field — `deityType`/`rarity` — for deities and magic items; a missing `name` for factions, whose only two fields are unconstrained `z.string()`s with no option list to violate). Valid test payloads pull real option values via `firstOptionValue` from each domain's own option-list files rather than hardcoding numbers, the same source the production defaults use. 20 new unit tests, all passing; `pnpm typecheck` caught two payloads using bare strings for `Deity.holidays`/`Deity.meaning`, which are string enums (`Holidays`, `TarotMeaning`) — fixed by importing the actual enum members instead of loosening the interface.

e2e specs (`deities-crud.spec.ts`, `magicitems-crud.spec.ts`, `factions-crud.spec.ts`) follow `spells-crud.spec.ts`/`npc-crud.spec.ts`: create → find via `?query=` → edit → delete, filling only the Nome field and leaving every select at its form default, the same scope `npc-crud.spec.ts` uses for the domain with the next-most fields. One thing worth recording since it isn't obvious from `queryFields.ts` alone: that file excludes `name` from magic items' per-field filter list ("No `nome` or `descrizione` here… that is how both magic item queries already were"), but the free-text `?query=` search in `getQuery.ts` always matches on `name` regardless of domain — it is a separate code path from the per-field filters `queryFields.ts` governs — so the same `gotoX(page, name)` helper works unchanged across all four CRUD specs. Verified against a real Postgres e2e database (`my_database_e2e`, already provisioned from an earlier session but missing its `.env.test` — recreated from `.env.test.example` and brought current with `prisma migrate deploy`, which applied three pending SPEC-006/009/010 migrations). All 5 tests pass (`auth.setup`, `world.setup`, the three new specs).

Deities' pre-existing `deities-list.spec.ts` is unchanged and untouched — it still covers list rendering against seeded rows; the new `deities-crud.spec.ts` is the create/update/delete flow that was genuinely missing.

**(original) Where:** Six Server Actions had no test coverage at all — `createDeity.ts`/`updateDeity.ts`, `createMagicItem.ts`/`updateMagicItem.ts`, `createFaction.ts`/`updateFaction.ts`. All six had `requireSession()` guards and Zod validation via `PageMeta` in place — the audit confirmed no auth or correctness bugs, purely a coverage gap. Spells and NPC had e2e CRUD coverage (`spells-crud.spec.ts`, `npc-crud.spec.ts`) and all maps mutations had unit coverage (`app/lib/data/maps/*.test.ts`); deities' e2e was list-only, and magic items/factions had no e2e CRUD spec at all.

**(original) The fix:** unit tests following the maps mutation-test pattern (mock Prisma, auth, and cache revalidation; assert the write payload's shape); e2e CRUD specs following `spells-crud.spec.ts`/`npc-crud.spec.ts`, covering create, update, and delete.

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
8. ✅ TD-24  Playwright + 40 E2E specs    → needed TD-23 to make the CI job blocking
9. ✅ TD-17  portfolio README
--- Phase 1 complete: the project is correct, safe and verified ---
10. ✅ TD-08  type the metadata layer
11. ◑ TD-20a strict flags, cheap batch + ES2022 target (exactOptionalPropertyTypes done)
12. ✅ TD-19  rename identifiers to English → residual set became TD-33
14. ✅ TD-11 schema timestamps + indexes (relations remain, Phase 3)
14b. ✅ TD-27 SpellLibrary's mount effect deleted
14c. ✅ TD-28 seed ids removed; the database assigns them
15. ✅ TD-12  single where-clause
17. ✅ TD-13  typed errors                  → preserve { cause }; biggest diagnosability win
18. ✅ TD-25  startup DB-reachability check → done with TD-13, as advised
19. ✅ TD-10  real notifications            → also closed TD-13's last step
20. ✅ TD-09  collapse duplicated components
21. ✅ TD-22  lint backlog to zero          → 293 → 0; every rule back to error
23. ✅ TD-15  accessibility pass            → zero axe violations, not an allowlist
23b. ✅ TD-31 hydration mismatch            → shared mutable PageMeta.options
23c. ✅ TD-26 / TD-29 / TD-30 / TD-32       → see the summary table
24.  ✅ TD-33  the Italian identifiers TD-19 missed → compiler-verified, no behaviour change
25.  ✅ TD-21  extract UI strings, ship it + en    → L; message-key resolution + locale switcher + CI key-set check
26.  ✅ TD-35  e2e specs resolve copy from the catalogue, not literals
27.  ✅ TD-02b remaining trust boundaries (env, localStorage, GeoJSON, Prisma results) → Phase 2 complete
28.  ✅ TD-20b noUncheckedIndexedAccess → 20 sites in the vendored maps module fixed with documented assertions
29.  ✅ TD-14  map POIs into Postgres → Phase 3, closed 2026-08-01
30.  ✅ TD-36  proxy.ts matcher let .jpg through the auth/i18n gate
✅ TD-18 was done early (it unblocked the build)
--- everything above is done. What is actually left: coverage, TD-37–TD-43 ---
31.  TD-37  authenticate() + connections/** → 0% on the one untested auth surface
32.  TD-38  data-layer fetch/count for deities, magicitems, npc → 51% to the 90% target
33.  TD-39  app/lib/utils/** pure functions → 51% to the 95% target, cheapest per hour
34.  TD-40  app/lib/config/** metadata → npcMeta 14%, deityMeta 25%, target 80%
35.  TD-41  app/lib/hooks/** → useFilterController untested, target 70%
36.  TD-42  app/ui/** behaviour → EntityForm/List/Library first, target 60%
37.  TD-43  app/modules/maps/** geometry + hooks → target 50%, rendering stays E2E-only
--- TD-37–43 all closed 2026-08-02; per-tier targets met, but coverage.all: false hides the true gap ---
38.  TD-44  coverage.all: true, re-measure, re-scope the 70% gap into new dated items
```

**Maintenance note (2026-07-30).** This block had drifted badly: it carried ✅ on 9
items when 21 were done, which made it read as "Phase 2 has barely started" while
the summary table at the top of this file — which is accurate, and is the one to
trust — showed the opposite. Two documents disagreeing about what is finished is
worse than either being merely out of date, because the reader cannot tell which
to believe. If you close an item, tick it in **both** places or delete this block.

The ordering is not arbitrary: each step makes the next one cheaper or safer. In particular, do not attempt TD-09 before TD-08, do not attempt TD-01/TD-02 before TD-03 (you want a working test suite before you touch security-critical code), and do not attempt TD-24 before TD-01/TD-02 — the E2E specs assert auth and validation flows those two items create.

---

## TD-03 addendum — the Jest → Vitest migration plan, as executed

**Moved here from `docs/TESTING.md` §4 on 2026-08-08.** It was 88 lines of a finished 2026-07-22 migration — including the original install commands and config — sitting in the middle of the document people open to learn how to write a test today. The four recorded deviations are the part worth keeping, and they are kept verbatim below; `TESTING.md` now links here instead.

Kept for the record, and because four steps went differently than written. Deviations, all deliberate:

1. **`vite-tsconfig-paths` was installed and then removed.** Vite resolves tsconfig paths natively now (`resolve: { tsconfigPaths: true }`); Vitest prints a deprecation notice if you use the plugin. One fewer dependency than this plan called for.
2. **Coverage thresholds were set at 14/9/9/13, not 70/70/60/70.** Setting them at the target would have failed CI on day one — the exact failure mode §2 warns about. They ratchet up instead, and are **27/25/19/27 today**; §2 is the current figure, this line is what the migration shipped with.
3. **Playwright was not installed.** TD-03's exit criterion is a green unit suite enforced by CI; the eight specs in §3 are a body of work in their own right, and `pnpm create playwright` is interactive besides. The CI `e2e` job was left documented-as-unrunnable rather than half-done — **TD-24 installed it properly on 2026-07-25**, and the job has been blocking since 2026-07-26.
4. **Tests import from `vitest` explicitly** rather than relying on `globals: true` for typing. Dropping `@types/jest` left `test`/`expect` untyped under `tsc`, and explicit imports fix that without adding a `types` array to tsconfig, which would have overridden the default and pulled the rug on `@types/node`.

Also removed: `__test__/mocks/next/*`, orphaned once Jest's `moduleNameMapper` went away — nothing imported them.

**Original plan below.** Effort was ~2h as estimated.

**1 — Install**

```bash
pnpm remove jest jest-environment-jsdom @types/jest @babel/preset-env @babel/preset-react @babel/preset-typescript
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @vitest/coverage-v8
```

**2 — `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["**/*.config.*", "**/generated/**", "app/seed/**", "**/*.d.ts"],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
```

`vite-tsconfig-paths` makes the `@/*` alias work without duplicating the mapping — one fewer thing to keep in sync than Jest's `moduleNameMapper`.

**3 — `vitest.setup.ts`**

Port `jest.setup.ts`, replacing `jest.mock` with `vi.mock`. The `TextEncoder`/`TextDecoder` polyfills are no longer needed — Vitest's jsdom environment provides them.

**4 — Delete**

`jest.config.ts`, `jest.setup.ts`, `babel.config.js`, `__test__/stubs/` (Vite handles CSS and asset imports natively).

**5 — Port existing tests**

Rename `__test__/utils/createEmptyArraytest..ts` → `createEmptyArray.test.ts` (it was never being collected). Keep `generatePwdHash.test.ts`, `parseSerializedArray.test.ts`, `sortByField/index.test.ts`, `Select.test.tsx`. Delete `dashboard-snapshot.tsx`. The `__test__/mocks/next/*` mocks mostly carry over with `jest.fn` → `vi.fn`.

**6 — Playwright**

```bash
pnpm create playwright
```

Config: `testDir: "./e2e"`, `webServer` pointing at `pnpm dev`, `baseURL: "http://localhost:3000"`, `trace: "on-first-retry"`.

**7 — Scripts**

> ⚠️ The `typecheck` script below is the **original plan and is wrong** — do not
> copy it. A bare `tsc --noEmit` passes vacuously in a fresh checkout, because the
> route-handler signatures live in types Next generates. The live script is
> `next typegen && tsc --noEmit`; see TD-04.

```json
{
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

---

---

## TD-44 / TD-45 / TD-46 addendum — the coverage sweep, as executed

**Moved here from `docs/TESTING.md` §1 on 2026-08-08**, where four dated paragraphs of closed-item narrative sat above the material someone opening that file actually needs. The reusable techniques were lifted into `TESTING.md` §1's "Techniques that took a while to work out"; the record of what each item did is below, verbatim.

**TD-46 Tier 1 done (2026-08-04):** `LeafletMap.test.tsx`, `MapContextMenu.test.tsx`, `MapMeasurementPanel.test.tsx`, `MapControls.test.tsx`, `MapPOIPanel.test.tsx` — the five `app/modules/maps/components/map/**` components `WorldMap.tsx` actually renders, previously all at 0%. 46 new tests; suite grew 709 → 755; lines 54.51% → 63.81%. `LeafletMap`'s own suite mocks the `leaflet` module directly (`L.map()`, event wiring) rather than stubbing a wrapper hook, and along the way found that its `onClick`/`cursorStyle` effects key off prop identity, not map readiness — documented in the test file rather than "fixed", since it's how `WorldMap.tsx`'s real usage already works (a `useCallback` whose identity changes on the relevant state change).

**TD-46 Tier 2 done (2026-08-04):** the remaining `app/modules/maps/components/map/**` components — `MapSearchBar`, `MapTopBar`, `MapTileSwitcher`, `MapThemeSwitcher`, `MapUser`, `LeafletGeoJSON`, `LeafletTileLayer`, `MapDetailsPanel` — reachable only through `MapMain.tsx`, which itself has no importer outside its own directory. Asked the user for a cable-or-delete decision per CLAUDE.md's "vendored library stays as inventory" rule; the answer was to test them as-is, in isolation, without wiring `MapMain` into `WorldMap.tsx`. 52 new tests across 8 files; suite grew 755 → 807; lines 63.81% → 70.09%, branches 60.89% → 69.66%. `MapSearchBar.test.tsx` and `MapDetailsPanel.test.tsx` are the two substantial suites (14 and 7 tests): search debounce via `vi.useFakeTimers`/`advanceTimersByTimeAsync`, keyboard navigation, and — since the dropdown panel is CSS-collapsed rather than unmounted (`max-h-0`/`opacity-0`) — assertions check the panel's class list rather than the absence of result text. `MapUser.test.tsx` opens its Radix `DropdownMenu` in jsdom with a plain `fireEvent.pointerDown` + `fireEvent.click` on the trigger, no `user-event` dependency needed. `MapDetailsPanel` is tested on its desktop-panel branch only (jsdom's default `window.innerWidth` already reads as desktop), matching `MapPOIPanel.test.tsx`'s existing convention of not exercising the mobile `Drawer` branch.

**TD-45 done (2026-08-04):** page-level route components (`app/[locale]/dashboard/**`, `app/ui/geography/WorldMap.tsx`) had no coverage target and 0% coverage. 10 new test files cover the repeated shapes once each rather than per domain — `error.tsx`/`not-found.tsx`/`loading.tsx`/`layout.tsx`, the overview page, the public list-page pattern (`spells/page.tsx` stands in for `deities`/`magicitems`/`npc`), the admin list-page pattern (`admin/spells/page.tsx`), the admin "new item" pattern (`admin/spells/new/page.tsx`), `geography/page.tsx`'s map-switcher state, and `WorldMap.tsx`'s own bootstrap effect and POI-selection flow (its child components and hooks are stubbed — each already has its own suite; five components and four hooks after TD-46's cleanup removed two that were dead, not unwired). 27 new tests; suite grew 682 → 709.

**`coverage.all` investigated, found moot (TD-44, 2026-08-02):** the plan was to flip `coverage.all: true` to remove the v8 provider's suspected blind spot — without it, a file no test ever imports doesn't appear in the report at all, so the denominator could in principle be silently undercounting the codebase. Trying it on Vitest 3 first produced byte-identical totals (3289 lines) with the flag on or off; on this repo's Vitest 4.1.10 the option doesn't even compile anymore, because `CoverageOptions` dropped it — "instrument every `include`d file regardless of import" is now unconditional default behaviour, not an opt-in. So there was no blind spot to remove and nothing to set in `vitest.config.ts`. What the full picture _did_ surface, cleanly, is two directories nothing has a target for: page-level route components and `app/modules/maps/components/**` (Leaflet rendering) — filed as TD-45 and TD-46.

---

## Phase 4 — Session tooling

### TD-88 ✅ The sidebar cannot scroll, so the last nav items (logout, locale) are unreachable — **DONE (2026-08-18)**

**Outcome:** one class added to the sidenav's own column, `md:overflow-y-auto`, alongside the layout column's existing `md:overflow-hidden` (left untouched, so the page itself still does not scroll — [PR #183](https://github.com/pastorello/nextjs-campaign-settings/pull/183)).

**The bottom-pinning trap the write-up warned about was checked, not assumed.** Rather than eyeballing it in a browser, the actual pinning mechanism was traced in the markup: a `grow` spacer between the nav links and the locale-switcher/sign-out controls — and its parent column, also `grow` — push the bottom controls down regardless of list length, independent of `overflow`. `sidenav.test.tsx` (new) asserts both elements still carry `grow` and that the spacer is immediately followed by the locale switcher then the sign-out form, so a future change that breaks the pin by _reordering_ rather than by removing a class still fails the test. `layout.test.tsx` was extended to assert the page-level `md:overflow-hidden` survives.

The original description follows.

---

### TD-88 (original) 🟠 The sidebar cannot scroll, so the last nav items (logout, locale) are unreachable

The dashboard sidebar is `flex h-full flex-col py-4 px-2` (`app/ui/dashboard/sidenav.tsx:13`)
inside a layout column that is `h-screen ... md:overflow-hidden`
(`app/[locale]/dashboard/layout.tsx:5`). Nothing in that chain scrolls. While the
nav was short this was invisible; now that the sections have grown past the
viewport, the items at the bottom — **sign-out and the locale switcher** — are
clipped away with no way to reach them.

**The fix, in shape:** let the nav's own column scroll (`md:overflow-y-auto` on
the sidebar container), keeping the layout's `md:overflow-hidden` so the page
itself still does not. Check that the sign-out block stays pinned to the bottom
when the list is short — `mt-auto`/`grow` spacing there is doing that job today
and a naive overflow change can break it.

**Not the same bug as TD-84**, though they rhyme: this one is a missing scroll
container, that one is a wrong height. Fixing either does not fix the other.

---

### TD-89 / TD-90 ✅ Card disclosure chevrons — wrong ancestor, wrong rotation target — **DONE (2026-08-18)**

**Outcome:** both fixed together, as the write-up asked, across every card with the pattern — [PR #184](https://github.com/pastorello/nextjs-campaign-settings/pull/184), two commits (one per root cause). `NpcCard` gained the missing `group` ancestor; all five cards now rotate `flex h-10 w-10 items-center justify-center`-boxed icons rather than a non-square wrapper, with `transition-transform` added so it reads as a turn.

**The check-the-neighbours instruction found a real, unreported bug.** `SpellCard` and `FactionCard` both had the exact TD-90 defect — a bare `w-[40px]` div rotated instead of the icon inside it — even though nothing had been reported about either. Neither had the TD-89 defect (both already carried `group` on their `DisclosureButton`). Fixed identically to `DeityCard`/`MagicItemCard`, so all five cards now share one shape.

**Verification discipline:** each new/extended test was confirmed to fail against the pre-fix source by stashing only the `.tsx` sources while keeping the new tests, then re-running — all five test files failed as expected before the fix, confirming genuine regression coverage rather than tests that happened to pass either way.

The original descriptions follow.

---

### TD-89 (original) 🟢 `NpcCard`'s chevron never rotates — the `group-*` variant has no marked ancestor

`NpcCard`'s disclosure arrow stays pointing down whether the card is open or
closed. The class is there — `group-data-open:rotate-180` (`NpcCard.tsx:97`) —
but it cannot ever match: a `group-*` variant needs an ancestor carrying the
`group` class, and `NpcCard`'s `DisclosureButton` does not have one.
`DeityCard.tsx:47` and `MagicItemCard.tsx:22` both do (`className="... group"`),
which is precisely why their arrows move and this one does not. The class is
also on the button itself here rather than on the icon, where the other two put
it.

**The fix, in shape:** mark the ancestor `group` and move the rotation onto the
chevron, matching the other two cards — then fix all three the same way per
TD-90, since the shape those two use is itself wrong.

### TD-90 (original) 🟢 `DeityCard`/`MagicItemCard` rotate a non-square wrapper, so the chevron shifts instead of turning in place

Both cards wrap the chevron in `<div className="w-[40px] group-data-open:rotate-180">`
(`DeityCard.tsx:113`, `MagicItemCard.tsx:50`) and rotate **the wrapper**. The
wrapper is 40px wide but takes its height from the icon and does not centre it,
so a 180° turn about the box's centre lands the glyph somewhere else — the DM
sees it slide toward the edge rather than pivot.

**The fix, in shape:** rotate the icon, not the box, and give the box a square,
centred geometry (`flex h-10 w-10 items-center justify-center`) so the pivot and
the glyph share a centre. Add `transition-transform` while there, so it reads as
a turn rather than a jump.

**Do TD-89 and TD-90 as one change across all three cards** — same file shape,
same fix, and leaving them inconsistent is how the divergence happened in the
first place. `SpellCard` and `FactionCard` have the same disclosure pattern and
should be checked in the same pass even though nothing has been reported about
them.

---

### TD-91 / TD-92 ✅ Dashboard counts four domains of six, and none of the cards are clickable — **DONE (2026-08-18)**

**Outcome:** [PR #187](https://github.com/pastorello/nextjs-campaign-settings/pull/187), two commits. `fetchCardData` gained `prisma.zone.count()` and `prisma.faction.count()` in the same `Promise.all`; every card now wraps in the locale-aware `Link` from `@/i18n/navigation`, pointing at `/dashboard/magicitems`, `/dashboard/npc`, `/dashboard/spells`, `/dashboard/deities`, `/dashboard/geography` (places — the route predates the card and was never renamed) and `/dashboard/factions`, each verified to have a real `page.tsx` before being wired.

**The DM's decision on TD-91's open question:** count every place in the tree, not only positioned ones — the `zone.count()` call carries no filter.

**A pre-existing test needed a companion fix, not a workaround.** `__test__/data/errorPropagation.test.ts`'s prisma mock builds its count array eagerly; adding two new `count()` calls to `fetchCardData` meant the mock needed `zone`/`faction` stubs too, or the pre-existing DB-unreachable propagation test threw before it ever reached the rejection it was testing for. Stubs added, not the assertion loosened.

The original descriptions follow.

---

### TD-91 (original) 🟡 The dashboard counts four domains of six — places and factions were never added

`fetchCardData` (`app/lib/data/fetchCardData.ts`) counts magic items, NPCs,
spells and deities. Places and factions — both of which now exist as full
domains (SPEC-004, SPEC-006) — are missing, so the dashboard silently
under-reports what the campaign contains. Neither spec added the count when it
shipped.

**The fix, in shape:** two more `prisma.*.count()` calls in the same
`Promise.all`, two more `Card`s in `CardWrapper` (`app/ui/dashboard/cards.tsx`),
and the two message keys in **both** `messages/it.json` and `messages/en.json`
(a key in one and not the other fails CI's key-set check). Check what "places"
should count — every place in the tree, or only positioned ones — before
writing the query; TD-79 is about exactly that ambiguity elsewhere.

### TD-92 (original) 🟢 The dashboard's cards are not clickable, so the counts lead nowhere

`Card` (`app/ui/dashboard/cards.tsx:37`) renders a static tile. Seeing "142
spells" and wanting to go to the spells list is the obvious next move, and there
is nothing to click.

**The fix, in shape:** wrap each card in the locale-aware `Link` from
`@/i18n/navigation` (not `next/link` — the locale segment matters, TD-21) and
point it at that domain's list page. Do this after TD-91, so the two new cards
get their links in the same pass rather than being added and then linked.

---

### TD-81 ✅ Every map is framed with the same square default bounds, so any non-square image is stretched — **DONE (2026-08-19)**

**Outcome:** [PR #189](https://github.com/pastorello/nextjs-campaign-settings/pull/189). The open question was answered by the DM: keep the coordinate space in image pixels, preserve the aspect ratio, letterbox rather than crop, and make sure a full zoom-out is still reachable. The image-loading effect now frames the map with the stored/default bounds at `opacity: 0`, then corrects to the loaded image's real `naturalWidth`/`naturalHeight` via `computeImageBounds` once it reports them, fading in only after the correction lands — so a DM never sees the wrong-aspect-ratio frame, even briefly.

**A second, real bug was found and fixed in the same PR, not left for later:** the async image-load callback fires `map.fitBounds`/`setView`, and Leaflet's `movestart` event fires identically for that and a real user drag — `useMapContextMenu`'s close-on-movestart handler was closing an open right-click menu out from under a DM who had just opened it, whenever the image happened to finish loading mid-interaction. Fixed with a `runWithoutClosing()` wrapper scoped to WorldMap's own programmatic camera moves; a genuine drag still closes the menu. This was traced from a CI E2E failure via the actual Playwright trace artifact, not guessed at — see TD-87's entry below for the full mechanism, since both fixes shipped together.

The original description follows.

---

### TD-81 (original) 🟠 Every map is framed with the same square default bounds, so any non-square image is stretched

**Severity:** 🟠 High · **Effort:** M · **Found:** 2026-08-17, reported by the DM while navigating root → material plane → Kang

Descending from the material plane into Kang's realm renders that map visibly
deformed. Nothing about Kang is special: **no map in the tree is framed to its
own image.** `DEFAULT_MAP_BOUNDS` (`app/modules/maps/lib/utils/placeMapView.ts:22`)
is a hardcoded square, `[[0, 0], [2000, 2000]]`, and
`parsePlaceMapBounds` falls back to it for every place, because nothing ever
writes `mapBounds`: `updateZoneMap` only ever sets `mapImage`, and M4's
create-world flow only sets `title`/`mapImage` — the file's own header comment
says so. `WorldMap.tsx:562` then hands those bounds to `L.imageOverlay`, which
stretches whatever pixels it is given to fill them. An image close to 1:1 looks
fine; a 3:2 or 2:3 one is scaled non-uniformly along one axis.

**The stretch factor is the image's aspect ratio, nothing else** — which is why
the root and the material plane look right and Kang does not, and why the
distortion is stable rather than zoom-dependent.

**The fix, in shape:** derive the bounds from the image's real pixel dimensions
instead of a constant, so the overlay's aspect ratio always matches the file's.
Two places it could happen, and they are not exclusive:

- **At upload (preferred).** Read the image's intrinsic size in the upload
  route handler and persist `[[0, 0], [height, width]]` into `mapBounds`. One
  write, no client work, and `checkPlacement`'s existing use of
  `parsePlaceMapBounds` — which validates that a child's coordinates fall
  inside the parent's map — starts being correct too, instead of validating
  against a square that does not describe the map.
- **At render (fallback for maps already uploaded).** `L.imageOverlay`'s image
  exposes `naturalWidth`/`naturalHeight` on load; bounds could be recomputed
  then. Needed only if we choose not to backfill.

**Open question for the DM before implementing:** should the stored coordinate
space stay in image pixels (so `mapBounds` is literally the file's dimensions
and every existing pin keeps meaning what it meant), or be normalised to a
fixed range? Pixels are the lower-risk answer, but it means **existing pins
placed against the old square bounds will land in the wrong spot once the
bounds change**, and that migration is the reason this is M rather than S.

---

### TD-83 ✅ The "up" button is unreachable once you descend — it scrolls out of view above the map — **DONE (2026-08-19)**

**Outcome:** [PR #189](https://github.com/pastorello/nextjs-campaign-settings/pull/189). "Up" moved out of `GeographyExplorer`'s scrolling header row into the map's own overlay container — the same `relative` box `WorldMap`, `MapControls` and `MapTileSwitcher` already float in — so it can no longer scroll away from the thing it acts on, independent of whatever TD-84 does to the surrounding page chrome. The header keeps the title and the unpositioned count. Regression test in `GeographyExplorer.test.tsx` asserts the button lives inside the map's overlay container, not the header row; confirmed to fail against the pre-fix code by stashing the change and re-running.

The original description follows.

---

### TD-83 (original) 🟠 The "up" button is unreachable once you descend — it scrolls out of view above the map

**Severity:** 🟠 High · **Effort:** S · **Found:** 2026-08-17, reported by the DM (twice: root → material plane, and again generally)

Descending from the root into a child map leaves the DM with no visible way
back. The button is not missing from the render tree — `GeographyExplorer`
renders a `BaseButton` with `t("up")` whenever `stack.length > 1`, and that
condition is satisfied — but it sits in a header row **above** the map, and the
map's own box is a full viewport tall (see TD-84). To see any of the map the DM
scrolls down inside the dashboard's `md:overflow-y-auto` column, and the header
— title, unpositioned count and the only exit from this map — scrolls away with
it. Until TD-84's height bug is fixed, the button is present, correct, and
unreachable.

**A second symptom confirms the reading.** The DM separately reported that the
page title is visible on the root map but "disappears" on a sub-map
(2026-08-18). `GeographyExplorer` renders `<PageTitle>{current.title}</PageTitle>`
unconditionally, so it cannot disappear — but it shares the header row with the
"up" button, and the two go out of view together. One header, two complaints.
(The DM also asked for a breadcrumb trail in that header. That is a separate,
deliberate reversal of SPEC-004 M7's no-breadcrumbs decision, recorded in
`ROADMAP.md`, not part of this fix.)

**Reproduce before fixing.** The above is the reading of the code, not a
verified repro; confirm the button really is rendered-but-scrolled rather than
not rendered at all (a broken descend that never pushes the stack would look
identical to the DM and would be a different bug entirely).

**Fix TD-84 first,** then re-check this one: a map that stops overflowing its
container may well take the header back into view and close this item for free.
If it does not, the answer is to stop relying on page chrome for map
navigation — put "up" in the map overlay with the other floating controls,
where it cannot scroll away from the thing it acts on.

**Related:** TD-82 would give the browser's own back button a meaning here,
which is a second, independent way out. It is not a substitute for a visible
control.

---

### TD-84 ✅ `WorldMap` is `h-screen` inside a padded column, so the bottom-right control stack is clipped below the fold — **DONE (2026-08-19)**

**Outcome:** [PR #189](https://github.com/pastorello/nextjs-campaign-settings/pull/189). One-class fix, as the write-up predicted: `WorldMap`'s root element is `h-full` now, not `h-screen`, so it fills `GeographyExplorer`'s `flex-1 min-h-0` slot instead of declaring its own viewport-sized height inside it. Regression test asserts the root carries `h-full` and not `h-screen`. Fixing TD-84 also removed TD-83's root cause, as that entry predicted it might.

The original description follows.

---

### TD-84 (original) 🟠 `WorldMap` is `h-screen` inside a padded column, so the bottom-right control stack is clipped below the fold

**Severity:** 🟠 High · **Effort:** S · **Found:** 2026-08-17, reported by the DM after the "modifica" button landed

Adding `MapOptionsButton` to `MapControls`' `extraControls` slot made the
floating column at the bottom right taller, and the DM now sees only the new
pencil button — zoom, reset and fullscreen are below the visible area. **The
new button did not cause this; it revealed it.**

`WorldMap`'s root element is `relative h-screen w-full overflow-hidden`
(`app/ui/geography/WorldMap.tsx:590`) — a full _viewport_ height — while it is
mounted inside `GeographyExplorer`'s `relative w-full flex-1 min-h-0` slot,
itself inside the dashboard layout's `grow p-6 md:overflow-y-auto md:p-12`
column, under a header row with `mb-4`. So the map's box starts roughly
150–200px down the viewport and is still 100vh tall: its bottom edge, and every
`absolute bottom-*` control anchored to it, lands that far below the fold.
`MapControls` (`bottom-24 sm:bottom-8 right-4`) grows _upward_ from that edge,
so the topmost item — the newly added pencil — is the only one that survives
into the visible area. `MapTileSwitcher` (`bottom-24 sm:bottom-8 left-4`) is
anchored the same way and should be checked in the same pass.

**The fix, in shape:** `h-full` instead of `h-screen`, so the map fills the
`flex-1 min-h-0` box that `GeographyExplorer` already sizes for it, rather than
declaring its own viewport-sized height inside it. Check the fullscreen path
while there — `MapControls`' fullscreen toggle uses the Fullscreen API on the
map element, which is where a viewport-sized height was plausibly wanted, and
that is the one case `h-full` must not break.

**A third symptom, reported 2026-08-18 and worth fixing in the same pass:**
`MapPOIPanel`'s desktop shell is `absolute top-0 left-0 h-full w-96`
(`MapPOIPanel.tsx:1031`), so it inherits the same wrong height and its lower
half — including the description field of the "add a place" form — is cut off
below the fold. Three independent-looking complaints, one `h-screen`.

**Verify at more than one viewport.** The mobile offset (`bottom-24`) exists to
clear something; confirm what, before flattening both breakpoints to the same
value.

**Same root cause as TD-83,** most likely fixed in the same change — but filed
separately because the symptoms are independent and either fix could land
without the other.

---

### TD-86 ✅ "Add marker" drops an ephemeral pin that cannot be removed and does not survive a reload — **DONE (2026-08-19)**

**Outcome:** [PR #190](https://github.com/pastorello/nextjs-campaign-settings/pull/190). Renamed to "Aggiungi un marker temporaneo" / "Add a temporary marker" in both catalogues, sublabel stating plainly it disappears on reload. A dismiss control was added — `clearMarkers`, wired from `useMapMarkers` into a small "clear temporary markers" button shown whenever any exist — as a proposal beyond what the DM asked for, not assumed; visible to every viewer, not DM-gated, per the DM's explicit note that this is a table-conversation tool.

The original description follows.

---

### TD-86 (original) 🟡 "Add marker" drops an ephemeral pin that cannot be removed and does not survive a reload

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-08-18, reported by the DM

The right-click menu's "Aggiungi marker" places a pin that the DM then cannot get
rid of, and that disappears on reload. Both are by construction:
`useMapMarkers` keeps markers in React state and a `useRef` map of Leaflet
handles, with no persistence anywhere; and `WorldMap` destructures only
`addMarker` from it (`WorldMap.tsx:159`), never the hook's own `removeMarker`.
The context-menu item is therefore add-only, and the state dies with the
component.

**Decided with the DM on 2026-08-18: keep the behaviour, fix the name.** The
ephemerality is the point — this is a scratch pin for reasoning about the map
out loud ("the party is about here, the dragon is about there"), not a record of
anything. What made it a defect was a label that promised persistence it never
had.

**So the fix is much smaller than this entry originally assumed:**

- Rename the menu entry to **"Aggiungi un marker temporaneo"** (and its English
  counterpart), in **both** `messages/it.json` and `messages/en.json`. The
  sublabel should say plainly that it disappears on reload.
- Give the marker a way to be dismissed — clicking it, or a "clear temporary
  markers" action. `useMapMarkers` already exposes `removeMarker`; `WorldMap`
  currently destructures only `addMarker` (`WorldMap.tsx:159`), so this is
  wiring, not new machinery. **The DM did not ask for this**, having accepted
  reload-to-clear; propose it, do not assume it.

**This one is for players too, not only the DM** (DM, 2026-08-18) — a scratch
marker is a table-conversation tool, so whatever role model lands must leave it
on the player side of the line. Recorded here because the accounts epic in
`ROADMAP.md` will otherwise default every map action to DM-only.

---

### TD-87 ✅ Zoom out does nothing on a child map — every map opens already at its minimum zoom — **DONE (2026-08-19)**

**Outcome:** [PR #189](https://github.com/pastorello/nextjs-campaign-settings/pull/189). The write-up's own reproduction steps confirmed the read exactly. Fixed with a `computeMinZoom(fitZoom, openZoom)` helper using Leaflet's own `getBoundsZoom(bounds)` rather than a hardcoded floor, guaranteeing the minimum sits strictly below whatever zoom the map opens at — recomputed both at the interim framing and again once the image loads and the bounds correct (TD-81), so a stale floor from the first pass can't survive the second.

**Traced to a genuine CI regression, not test flake, via the actual Playwright trace artifact rather than a guess.** The E2E suite failed deterministically on a right-click → "Add Place" interaction; the trace showed the click functionally landing (the POI panel ended up open) while Playwright's own `.click()` call kept losing the target to "element detached from the DOM, retrying." Root cause: the corrective re-fit this fix introduces (`map.fitBounds`/`setView`, fired from an async `image.once("load", …)` callback that can land at any point after mount) fires Leaflet's `movestart` event — identical to a real user drag — and `useMapContextMenu`'s existing close-on-movestart handler was closing an open right-click menu out from under the click whenever the image happened to finish loading mid-interaction. Fixed with `useMapContextMenu.runWithoutClosing(fn)`, which suppresses that handler only for the duration of a caller's own synchronous programmatic camera move; a genuine user drag/scroll still closes the menu. Regression tests: `useMapContextMenu.test.ts` (closes on a real `movestart`; does not close on one triggered inside `runWithoutClosing`; resumes closing afterward even if the wrapped call throws) and a `WorldMap.test.tsx` wiring test confirming both camera moves are actually routed through the wrapper rather than calling the map API directly.

The original description follows.

---

### TD-87 (original) 🟠 Zoom out does nothing on a child map — every map opens already at its minimum zoom

**Severity:** 🟠 High · **Effort:** S · **Found:** 2026-08-18, reported by the DM as "zoom out only works on the root map"

The image-loading effect (`WorldMap.tsx:565-570`) runs, for every map:

```
map.setMinZoom(0);
map.setZoom(0);
map.setMaxZoom(10);
map.setMaxBounds(bounds);
map.fitBounds(bounds);
map.setView(initialView, initialZoom);
```

`initialZoom` is `DEFAULT_MAP_INITIAL_ZOOM` = **-2** for every place, since
nothing writes `mapInitialZoom` (same root cause family as TD-81). Leaflet
clamps that to the minimum just set, so the map settles at zoom 0 — which _is_
its minimum. There is no room to zoom out, on any map, until the DM has zoomed
in first. `setMaxBounds(bounds)` compounds it by refusing to show anything
outside the (wrong, per TD-81) bounds.

**Why the root map appears to be the exception:** most likely because the DM
zooms in there before trying, which restores the margin. **Reproduce before
fixing** — open a child map, zoom in twice, then zoom out and see whether it
moves and stops at zoom 0. If it does, this reading is confirmed. If zoom out is
dead even from a zoomed-in state, the cause is elsewhere and this write-up is
wrong.

**The fix, in shape:** stop hardcoding the floor. Compute the minimum zoom from
the map's own bounds and the container size — Leaflet's `getBoundsZoom(bounds)`
gives exactly the zoom at which the image fits — and open at that, rather than
pinning `minZoom` to 0 and the view to a constant -2. Schedule with TD-81: both
are "the map's framing is a constant instead of a property of the image", and
fixing bounds without fixing zoom leaves the second half visibly broken.

---

### TD-95 ✅ The place panel is half-untranslated, with English strings hardcoded in the component — **DONE (2026-08-19)**

**Outcome:** [PR #190](https://github.com/pastorello/nextjs-campaign-settings/pull/190). All five named strings extracted into `messages/it.json`/`messages/en.json` under `geography.poiPanel`. "My Places" became "Luoghi di interesse" as the DM asked, with a matching English label chosen deliberately ("Places of Interest", echoing the existing `POICategory` terminology) rather than a literal re-translation of the old wording. The toast's hand-built English pluralisation was replaced with next-intl's plural support.

**The "check the neighbours" instruction found more than the one file.** `MapControls.tsx`'s tooltips and `MapLoadingSpinner.tsx`'s loading text were also hardcoded English, fixed in the same sweep. A further instance — `MapErrorBoundary.tsx`'s fallback UI — was found but correctly left for its own follow-up rather than scope-creeped in: it is a class component needing a structural wrapper, with no existing test coverage. That follow-up shipped separately as [PR #191](https://github.com/pastorello/nextjs-campaign-settings/pull/191).

The original description follows.

---

### TD-95 (original) 🟡 The place panel is half-untranslated, with English strings hardcoded in the component

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-08-18, reported by the DM

Opening "Aggiungi luogo" shows an Italian app with English labels in it.
`MapPOIPanel` does import `useTranslations` and does use `t` in places, but at
least five user-facing strings are written straight into the JSX: `"My Places"`
(`:341`), `"Clear"` (`:815`), `"Clear coordinates"` (`:656`),
`"Unplaced places (n)"` (`:830`), and a toast built by template literal,
`` `Cleared ${n} place${n !== 1 ? "s" : ""}` `` (`:556`) — which also hardcodes
English pluralisation, something the catalogue's own plural support exists to
handle.

**This is a straight violation of a standing rule**, not a gap in an unfinished
feature: `CLAUDE.md` says new user-facing copy goes in both catalogues and is
read through `next-intl`, never written into JSX. Same shape as TD-62, which
found hardcoded English POI category names, and a leftover the TD-21 bilingual
pass did not reach because this file came from the vendored map module.

**The DM also asked for a rename while we are here:** "My Places" becomes
**"Luoghi di interesse"** — so this is not a mechanical extraction of the current
wording, and the English catalogue needs a matching decision rather than
`"My Places"` copied across.

**Do not treat this as a rename-only change.** Sweep the whole file for
JSX-embedded copy before starting, and check the rest of
`app/modules/maps/components/**` in the same pass — if this file drifted, its
neighbours plausibly did too. A key added to one catalogue and not the other
fails CI's key-set check, which is the cheap safety net here.

---

### TD-94 ✅ The measurement tool reports haversine metres on a pixel-space map — **DONE (2026-08-20)**

**Outcome:** closed by [SPEC-015](./specs/015-map-grid-and-scale.md) T7
([PR #209](https://github.com/pastorello/nextjs-campaign-settings/pull/209)), not
patched in isolation — exactly as the supersession note below prescribed. The
grid model (T1–T5) first gave every map a scale worth converting into;
measurement was then rebuilt as `MapMeasureTool` on `measureDistanceInMeters` —
Euclidean in the map's own pixel space, then squares, then the scale's metres —
with the DM's click–track–click interaction. The vendored
`MapMeasurementPanel`/`useMeasurement` pair (the haversine path, plus an area
mode computing shoelace on pixel coordinates — the same disease) was deleted;
`calculateDistance` in `coordinates.ts` is untouched, per the write-up's own
"leave it alone" half — it is correct for real geography. The regression test
lives in `MapMeasureTool.test.tsx`: the point pair the old path read as
~33,000 km of longitude now labels as 27 km, from the grid. Without a configured
grid, measurement refuses with a one-line explanation rather than guessing.

The original description follows.

---

### TD-94 (original) 🟠 The measurement tool reports haversine metres on a pixel-space map, so every distance it gives is meaningless

> **Superseded 2026-08-18 by [SPEC-015](../specs/015-map-grid-and-scale.md) — do not
> patch this in isolation.** The bug is real and the diagnosis below stands, but the
> fix is not "swap haversine for a pixel distance": a pixel distance is still not a
> distance until the map carries a scale. SPEC-015 gives every map a grid and four
> named scales, and rebuilds measurement on top of that (its T7 carries this
> regression test). Fixing the formula alone would produce a confident number in
> pixels, which is the same class of wrong.

**Severity:** 🟠 High · **Effort:** M · **Found:** 2026-08-18, reported by the DM as "Misura seems not to work, or I have not understood it"

The DM could not tell whether the tool is broken or just opaque. It is broken,
and the mechanism is exact.

`LeafletMap` builds the map with `crs: L.CRS.Simple` (`LeafletMap.tsx:109`) —
the flat, unprojected coordinate system, correct for a hand-drawn fantasy map,
in which a coordinate pair is **a pixel position, not a place on a globe**.
`useMeasurement` then hands those pairs to `calculateDistance`
(`app/modules/maps/lib/utils/coordinates.ts:140`), which is the **haversine
formula on a sphere of radius 6371 km**: it reads `lat` as degrees of latitude,
`lng` as degrees of longitude, and returns metres.

So a click at pixel row 1200 is interpreted as latitude 1200°. The trigonometry
does not error — it wraps, repeatedly — and returns a confident number with no
relationship to anything on the map. This is not a precision problem to tune; the
formula is answering a different question from the one being asked.

**The two halves of a real fix:**

1. **Measure in the map's own space.** With `CRS.Simple` the honest primitive is
   Euclidean pixel distance (`map.distance()` already does the right thing under
   this CRS). Leave `calculateDistance` alone — it is correct for real geography
   and may have other callers — and give this path its own function rather than
   bending that one.
2. **Convert pixels into campaign units**, which is the DM's separate request for
   a map scale ("50 pixel = 4.5 km"). Without it the tool can only ever say "312
   pixels", which is honest but useless at the table. **That needs a per-map
   scale stored alongside the map**, so it is a data-model change and lives in a
   spec — see `ROADMAP.md`.

**Depends on TD-81.** Pixel distances only mean something if the map's bounds
actually match the image's pixels, which today they do not.

**The DM also proposed a clearer interaction** — click to start, the track draws
in red as the mouse moves, a second click ends it and drops a marker showing the
distance. Worth adopting; it is recorded with the scale work rather than here,
since this item is about the number being wrong, not about how it is collected.

---

### TD-85 ✅ The POI panel's list mode has no entry point, so positioning places and editing POIs are unreachable — **DONE (2026-08-27)**

**Outcome:** closed in two shipments, the split this item's own write-up asked for. [PR #190](https://github.com/pastorello/nextjs-campaign-settings/pull/190) (2026-08-19) put positioning where the DM already is — the "Posiziona luogo" right-click entry, its unpositioned count, disabled-not-hidden at zero — and took the count out of the header (TD-79). The remainder, POI edit and delete reachability, was deliberately deferred to the popover and shipped as [SPEC-016](./specs/016-place-popover.md): **T7** ([PR #223](https://github.com/pastorello/nextjs-campaign-settings/pull/223)) widened `PlacePopover` to a landmark variant whose "Modifica"/"Elimina" reach `MapPOIPanel`'s existing edit/delete machinery — the machinery was never the gap, the entry point was — with a new `editTarget` prop seeding the edit form from outside a list row for the first time.

**The "may end up with no callers at all" question was answered with evidence, not a guess (T9).** The list view stays: nothing _opens_ the panel in list mode, but the panel transitions there itself on save (`resetFormAfterSave`) and on backing out of the add form, and `e2e/map-poi-crud.spec.ts` had been walking that path since before this item was written. The popover duplicates the row's edit and delete, not Import, Export, Clear all or fly-to — and the add form needs somewhere to return to.

**The withdrawal this item ordered did happen**, in T9's second commit, once its stated condition ("the menu entry demonstrably works") was met by PR #190 plus T5's `map-unplace.spec.ts` driving the dropdown and its count end to end. Gone: the unplaced-children picker, its three props, `WorldMap`'s `handlePositionPlace`/`positioningPlace` crosshair-arming flow and the `handleMapClick` branch behind it, and the `geography.poiPanel.unplacedCount` key in both catalogues — with one guard test left behind so a second positioning affordance cannot grow back there.

**The "check while implementing" note is discharged too:** `handlePOIModeChange`'s `mode as "list" | "add"` cast is gone, and `poiPanelMode` is typed `ViewMode` — the state widened rather than the compiler lied to.

The original description follows, with the progress notes it accumulated while open.

---

### TD-85 (original) 🟠 The POI panel's list mode has no entry point, so positioning places and editing POIs are unreachable

**Severity:** 🟠 High · **Effort:** M · **Found:** 2026-08-18, from three separate DM reports that turned out to be one defect

**Shipped 2026-08-19 (PR #190), partially.** The "Posiziona luogo" context-menu
entry, its unpositioned count, and the disabled-not-hidden-at-zero behaviour are
all in. POI edit/delete reachability is deliberately still open — the write-up
below already says to decide that once TD-93's popover exists, not before, and
that stands.

Reported as three things: the DM cannot find the unpositioned places, cannot
position "Paradiso (Sole)" on the root map, and cannot edit or delete a POI once
created. All three are the same gap.

`MapPOIPanel` has two views. Its `"list"` view renders the POI list — each row
with its own edit and delete buttons (`MapPOIPanel.tsx:187` and `:197`) — and the
unplaced-children list with `onPositionPlace`, which is the entire TD-71 /
SPEC-005 positioning flow. Its `"add"` view renders the creation form.
**Only two things in the app open the panel, and both force `"add"` first:**
`handleContextMenuAddPOI` and `handleAreaDrawn` (`WorldMap.tsx:258` and `:379`)
each call `setPOIPanelMode("add")` immediately before `setIsPOIPanelOpen(true)`.
Nothing anywhere sets the panel open in `"list"` mode.

**So the feature is built, wired, unit-tested and unreachable.** Every prop the
list view needs is already passed from `WorldMap` — `pois`, `unplacedChildren`,
`onPositionPlace`, `onUpdatePOI`, `onDeletePOI`. What is missing is a button.

**The fix, decided with the DM on 2026-08-18** — and it is not the panel:

- **The unpositioned-places count comes out of the header.** The DM's reasoning:
  a label that reports a number without offering an action on it is noise. It
  goes, rather than becoming the button (which was this item's original
  counter-proposal, now rejected).
- **Positioning gets its own right-click entry, "Posiziona luogo."** Clicking it
  opens a dropdown of the places that are still unpositioned; picking one arms
  the existing positioning flow at the clicked point. **The count goes here**
  (DM, 2026-08-18) — beside the entry, as "how many are waiting", shown where the
  DM can act on it and nowhere else. That is the whole of what the removed header
  label was for; see TD-79. **When every place is
  already positioned the entry stays visible but disabled** — the DM asked for
  this explicitly, so that the absence of work is legible rather than the menu
  item silently disappearing.

That puts the action where the DM already is (right-clicking the spot they want
to fill), instead of behind a panel they have to open, read and then aim from.
**The DM confirmed on 2026-08-18 that this is the _single_ method.** The
unplaced-children list inside `MapPOIPanel` is therefore withdrawn with it, not
kept alongside — SPEC-005 §4 carries the matching note. Remove it in a follow-up
commit once the menu entry demonstrably works, not in the same one, so the
deletion is separable if the new path disappoints.

**POI edit and delete are a separate answer, and it is TD-93's popover** — the
DM's decision that clicking a place opens a popover carrying its description and
its actions. Which means the panel's list view may end up with no callers at
all; decide that at the end of both items, not now.

**Decided 2026-08-27 (SPEC-016 T9): the list view stays, and it never was
unreachable.** This item's own "no entry point" finding was about _opening_ the
panel in list mode, which nothing still does — but the panel transitions there
itself once open, on save (`resetFormAfterSave`) and on backing out of the add
form, and `WorldMap`'s controlled `mode`/`onModeChange` pair follows it.
`e2e/map-poi-crud.spec.ts` has been exercising that path since before this item
was written. The popover (SPEC-016 T7) duplicates the row's edit and delete, not
the rest of the view: Import, Export, Clear all and fly-to have no other home,
and the add form needs somewhere to return to.

**The withdrawal this item ordered is done (SPEC-016 T9, second commit).** The
condition was "once the menu entry demonstrably works" — PR #190 shipped it, and
SPEC-016 T5's `map-unplace.spec.ts` drives the dropdown and its count end to end,
so it has. Gone with the panel section: its three props, `WorldMap`'s
`handlePositionPlace` / `positioningPlace` crosshair-arming flow and the
`handleMapClick` branch behind it, the `geography.poiPanel.unplacedCount` key in
both catalogues, and the unit blocks that covered them (one guard test left in
`MapPOIPanel.test.tsx` so a second positioning affordance cannot grow back
there). `useUnplacedChildren` is untouched — "Posiziona luogo" is its only
reader now.

**Check while implementing:** `handlePOIModeChange` (`WorldMap.tsx:423`) takes
`"list" | "add" | "edit"` and stores it with `setPOIPanelMode(mode as "list" | "add")`.
The runtime value passes through intact, so this is not believed to be the cause
of anything the DM sees — but the cast is a lie to the compiler of exactly the
kind `CLAUDE.md`'s rule 3 exists to prevent, and it sits in the middle of the
code this item touches. Widen the state's type instead of casting.

---

### TD-96 ✅ The map's right-click menu carries two entries the model has outgrown — **DONE (2026-08-27)**

**Outcome:** closed in two halves, for exactly the reason this item gave. "Copia coordinate" was unblocked and went with [PR #190](https://github.com/pastorello/nextjs-campaign-settings/pull/190) (2026-08-19). "Collega un personaggio esistente" waited for its replacement to exist and went with [SPEC-016](./specs/016-place-popover.md) T8 ([PR #224](https://github.com/pastorello/nextjs-campaign-settings/pull/224)), once `PlacePopover` was mounting its own `AttachEntityButton` pre-filled with the _clicked_ place (T4) or landmark (T7) rather than the currently-viewed parent. `WorldMap`'s own instance and its `isAttachEntityOpen` state went with the entry — the entry was that instance's only trigger.

**The pre-removal check this item prescribed is what made the removal correct, and it overturned the item's own expectation.** No e2e spec drove the menu through either entry, and **no message key was orphaned**: the attach entry never had a label key of its own — `WorldMap` passed it `geography.attachEntity.trigger`, which `AttachEntityButton` also reads as its modal's title. Both catalogues are untouched, deliberately; removing that key would have blanked the modal heading rather than cleaned up drift.

**Consequence worth stating:** the place _currently being viewed_ can no longer be attached to from its own map — only from its marker's popover one level up, or from the admin list's per-row button. That is this item's stated intent (no attaching to "a location you cannot see the contents of"), and it makes the root unattachable from the map entirely, consistent with SPEC-016 §5's edge case that the root never gets a popover.

The original description follows, with the progress note it accumulated while open.

---

### TD-96 (original) 🟢 The map's right-click menu carries two entries the model has outgrown

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18, reported by the DM

**Shipped 2026-08-19 (PR #190), partially.** "Copia coordinate" is gone.
"Collega un personaggio esistente" is untouched, on purpose — removing it now
would make attaching an entity unreachable until TD-93's popover exists to
replace it.

Two entries the DM wants gone, for two different reasons:

- **"Collega un personaggio esistente."** Attaching an NPC or deity becomes an
  action inside the place's own popover (TD-93), where the DM can see what is
  already there. Doing it from a right-click on empty map space asks them to
  attach an entity to a location they cannot see the contents of. **Blocked on
  the popover shipping** — remove the entry when its replacement exists, not
  before, or the operation becomes unreachable in between.
- **"Copia coordinate."** The DM sees no purpose for it. Given `CRS.Simple`, what
  it copies is a raw pixel pair meaningful only to someone debugging the map, and
  nothing in the app asks the DM to paste coordinates anywhere. **Not blocked on
  anything** — it can go on its own.

**Check before removing either:** whether an e2e spec drives the menu through
these entries, and whether their message keys are referenced anywhere else. Keys
left behind in the catalogues after the JSX goes are exactly the kind of drift
this register exists to prevent — remove them from **both** `it.json` and
`en.json` in the same commit.

---

### TD-93 ✅ An already-positioned place or attached entity can be positioned again elsewhere — **DONE (2026-08-27)**

**Outcome:** the invariant is enforced by the database, in the only form the database can actually enforce it — a guarded write, not a constraint and not a trigger. The pre-state travels inside `updateMany`'s `where` (`{ id, zoneId: null, poiId: null }` for an entity, `{ id, lat: null }` for a place), so Postgres itself is what refuses the second placement and nothing can interleave between a check and an update. Three mutations carry it: `npc/assignLocation`, `deities/assignLocation` and `updateZonePosition`. Refusals return a typed `code: "alreadyPlaced"` beside the field errors (`MutationRefusalCode`), and the caller renders the message from both catalogues (ADR-0007) rather than showing the data layer's English prose.

**Why not a trigger, which is what "the database half" first suggests.** The invariant is about a _transition_ (`null` → non-null is fine, non-null → non-null is not), and a `CHECK` constraint cannot see the old row — so the only true schema-level version is a trigger. A trigger would refuse writes that must be allowed: `deletePlace` reparents an attached entity with `zoneId: grandparentId` while its `zoneId` is already non-null (rule 3, SPEC-010), and every SPEC-005 drag rewrites `lat`/`lng` on a row that already has them. Neither is distinguishable from a second placement at the row level. The guard therefore lives where the intent is known, and stays atomic by putting the predicate in the statement.

**`updateZonePosition` had to learn the difference between placing and moving**, which it never carried: `{ id, lat, lng }` served both the "Posiziona luogo" flow and marker drags. It now takes a required `intent: "place" | "reposition"` — required, not defaulted, so every call site is a compiler error until it says which it means. Only `"place"` is guarded; repositioning stays free, as SPEC-016 §6 said it would.

**One addition beyond the item, for the reason the item itself gives** ("the constraint needs the un-place action to exist, or it turns a recoverable mistake into a dead end"): `AssignLocationModal`'s zone select had no "none" entry, so on the NPC and deity pages an entity could be given a location but never relieved of one — the only removal was the map popover's X (SPEC-016 T4). The refusal would have been a dead end on those two surfaces. The entry is `common.locationModal.zoneNoneOption` in both catalogues.

**Verification:** unit tests on all three mutations assert the guard is in the `where` rather than in a preceding read, and that clearing is never guarded. `e2e/entity-location-invariant.spec.ts` proves it against a real Postgres — attach an NPC, then save the same modal unchanged and watch the database refuse it — which is the distinction TD-69's entry insists on: a mock proves our error handling, not the database's behaviour. A missing row is reported as missing rather than as "already placed", at the cost of one read on the failure path only.

**Found while doing it, not caused by it: [TD-102](./TECH_DEBT.md).** An unplaced landmark passes `useUnplacedChildren`'s kind filter and reaches `updateZonePosition`, which writes to `zone` — a cross-table id confusion this item's guard narrows but does not close.

The original description follows.

---

### TD-93 (original) 🟠 An already-positioned place or attached entity can be positioned again elsewhere

**Severity:** 🟠 High · **Effort:** M · **Found:** 2026-08-18, reported by the DM

The DM's rule: something already placed somewhere must be removed from there
before it can be placed anywhere else. Today nothing enforces that. Positioning
writes `lat`/`lng` onto the place, and attaching an entity writes its location
reference; neither checks whether the thing already has one, so the second
placement silently wins and the first is lost with no warning and no record.

**This is the same class of defect as TD-69**, which added a unique constraint on
`poi.linkedType`/`linkedId` after finding that a second pin per NPC was silently
possible — and it is worth reading that item's archive entry before designing
this one, because the shape of the answer is likely the same.

**Both open questions were answered by the DM on 2026-08-18, and the answer
arrived as an interaction design rather than a rule.** Clicking a place opens a
popover showing its description and, from there:

- **"Rimuovi definitivamente"** and **"Sposta nei luoghi non posizionati"** —
  two distinct destructive-ish actions, deletion versus un-placing.
- **The entities present at that place** (NPCs and deities), each with an **X**
  that sends it back to the pool of unattached entities.
- **A control to attach an NPC or deity to this place**, which is where that
  operation lives from now on — not in the map's right-click menu (see TD-96).

**This answers question 1 as "refuse, and provide the removal":** placement of an
already-placed thing is blocked, and un-placing is a first-class action one click
away rather than a thing the DM has to reverse-engineer. **It answers question 2
as "both"**, while confirming they stay two mechanisms — the place's own
`lat`/`lng` for "sposta nei luoghi non posizionati", the entity's location
reference for the per-entity X.

**The popover itself is a feature, not this item.** It is recorded in
`ROADMAP.md` as a spec candidate, because it also absorbs two earlier reports
(attaching entities from the place rather than the map, and seeing what lives at
a place) and because designing a destructive-action surface deserves the spec
template's edge-case section. **What stays here is the invariant**: the database
half, so that "already placed" cannot be violated by whichever code path writes
next, and a message in both catalogues explaining the refusal.

**Sized M, not S,** because a UI-only check is not worth doing: the UI is the
path that has already failed here once. **Sequence it after the popover spec** —
the constraint needs the un-place action to exist, or it turns a recoverable
mistake into a dead end.
