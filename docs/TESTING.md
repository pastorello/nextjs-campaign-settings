# Testing Strategy

**Last updated:** 2026-08-01
**Stack:** Vitest + Testing Library (unit/integration) · Playwright (E2E) · MSW where network mocking is needed
**Decision record:** [ADR-0002](./adr/0002-testing-stack.md)

---

## 1. Where we are

**Migrated to Vitest on 2026-07-22 (TD-03).** `pnpm test` runs 807 tests across 116 files. Coverage is **70.09% lines / 69.66% branches** (2026-08-04 figure, after TD-46's Tier 2 maps suites), enforced in CI as a ratchet — see §2. This crosses the 70% Phase 2 exit criterion — see [`docs/ROADMAP.md`](./ROADMAP.md).

**TD-46 Tier 1 done (2026-08-04):** `LeafletMap.test.tsx`, `MapContextMenu.test.tsx`, `MapMeasurementPanel.test.tsx`, `MapControls.test.tsx`, `MapPOIPanel.test.tsx` — the five `app/modules/maps/components/map/**` components `WorldMap.tsx` actually renders, previously all at 0%. 46 new tests; suite grew 709 → 755; lines 54.51% → 63.81%. `LeafletMap`'s own suite mocks the `leaflet` module directly (`L.map()`, event wiring) rather than stubbing a wrapper hook, and along the way found that its `onClick`/`cursorStyle` effects key off prop identity, not map readiness — documented in the test file rather than "fixed", since it's how `WorldMap.tsx`'s real usage already works (a `useCallback` whose identity changes on the relevant state change).

**TD-46 Tier 2 done (2026-08-04):** the remaining `app/modules/maps/components/map/**` components — `MapSearchBar`, `MapTopBar`, `MapTileSwitcher`, `MapThemeSwitcher`, `MapUser`, `LeafletGeoJSON`, `LeafletTileLayer`, `MapDetailsPanel` — reachable only through `MapMain.tsx`, which itself has no importer outside its own directory. Asked the user for a cable-or-delete decision per CLAUDE.md's "vendored library stays as inventory" rule; the answer was to test them as-is, in isolation, without wiring `MapMain` into `WorldMap.tsx`. 52 new tests across 8 files; suite grew 755 → 807; lines 63.81% → 70.09%, branches 60.89% → 69.66%. `MapSearchBar.test.tsx` and `MapDetailsPanel.test.tsx` are the two substantial suites (14 and 7 tests): search debounce via `vi.useFakeTimers`/`advanceTimersByTimeAsync`, keyboard navigation, and — since the dropdown panel is CSS-collapsed rather than unmounted (`max-h-0`/`opacity-0`) — assertions check the panel's class list rather than the absence of result text. `MapUser.test.tsx` opens its Radix `DropdownMenu` in jsdom with a plain `fireEvent.pointerDown` + `fireEvent.click` on the trigger, no `user-event` dependency needed. `MapDetailsPanel` is tested on its desktop-panel branch only (jsdom's default `window.innerWidth` already reads as desktop), matching `MapPOIPanel.test.tsx`'s existing convention of not exercising the mobile `Drawer` branch.

**TD-45 done (2026-08-04):** page-level route components (`app/[locale]/dashboard/**`, `app/ui/geography/WorldMap.tsx`) had no coverage target and 0% coverage. 10 new test files cover the repeated shapes once each rather than per domain — `error.tsx`/`not-found.tsx`/`loading.tsx`/`layout.tsx`, the overview page, the public list-page pattern (`spells/page.tsx` stands in for `deities`/`magicitems`/`npc`), the admin list-page pattern (`admin/spells/page.tsx`), the admin "new item" pattern (`admin/spells/new/page.tsx`), `geography/page.tsx`'s map-switcher state, and `WorldMap.tsx`'s own bootstrap effect and POI-selection flow (its child components and hooks are stubbed — each already has its own suite; five components and four hooks after TD-46's cleanup removed two that were dead, not unwired). 27 new tests; suite grew 682 → 709.

**`coverage.all` investigated, found moot (TD-44, 2026-08-02):** the plan was to flip `coverage.all: true` to remove the v8 provider's suspected blind spot — without it, a file no test ever imports doesn't appear in the report at all, so the denominator could in principle be silently undercounting the codebase. Trying it on Vitest 3 first produced byte-identical totals (3289 lines) with the flag on or off; on this repo's Vitest 4.1.10 the option doesn't even compile anymore, because `CoverageOptions` dropped it — "instrument every `include`d file regardless of import" is now unconditional default behaviour, not an opt-in. So there was no blind spot to remove and nothing to set in `vitest.config.ts`. What the full picture _did_ surface, cleanly, is two directories nothing has a target for: page-level route components and `app/modules/maps/components/**` (Leaflet rendering) — filed as TD-45 and TD-46.

**Playwright landed 2026-07-25 (TD-24).** `pnpm test:e2e` runs **40 tests across 10 files** against a real database and a dev server it starts itself — about 1.2 minutes in CI, quicker locally once the dev server is warm. Nothing is skipped. (`pnpm test:e2e --list` enumerates them without running anything, and without needing a database — the honest way to check this number.)

> **Two warnings before you run either suite.**
>
> **`pnpm test:e2e` writes to a dedicated `.env.test` database, never `.env`'s (TD-65).** The CRUD specs create, edit and delete real records, and `.env`'s database is the real one you develop against — a 2026-08-06 incident found e2e debris (`"E2E World …"`, `"E2E POI …"` rows) sitting in it, undetected, because nothing enforced the separation `docs/TESTING.md` only used to _ask_ for. `playwright.config.ts` now enforces it structurally instead:
>
> 1. Copy `.env.test.example` to `.env.test` and create a second database inside the same Postgres container — same credentials as `.env`, a different name (the file has the exact commands).
> 2. Apply migrations to it: `DATABASE_URL="<.env.test's URL>" pnpm prisma migrate deploy`. Not `db push` — `db push` only diffs the schema shape, so it skips migration files entirely; `add_faction_table_and_fk` seeds the `faction` table with a raw-SQL `INSERT`, and `db push` leaves that table empty, which then fails `pnpm db:seed` on `npc`'s foreign key to it (TD-73).
> 3. `pnpm test:e2e` reads `.env.test`'s `DATABASE_URL` and passes it explicitly to the dev server it spawns — `.env`'s value is never used for this. It refuses to start if `.env.test` is missing, has no `DATABASE_URL`, or that value is identical to `.env`'s.
> 4. It also never reuses an already-running `pnpm dev` on `:3000` (`reuseExistingServer: false`, unconditionally) — that was the actual mechanism behind the 2026-08-06 incident: a manually-started dev server against the real `.env` got silently attached to instead of the e2e-configured one. A stray server on `:3000` now makes the suite fail on a port conflict instead of writing to the wrong place.
>
> In CI none of this applies: the `e2e` job provisions its own disposable Postgres service and sets `DATABASE_URL` directly as a job env var, so `playwright.config.ts` skips the `.env.test` check there entirely (see `.github/workflows/ci.yml`).
>
> **No spec may assume how much data exists.** Every count is read off the page and every assertion is relative to it, because the same suite runs against a 4-row seed and against a 361-spell library. Two rules follow from getting this wrong once: a record a spec creates is _not_ on page 1 of a real list, so look it up with `?query=`; and a click on a filter must wait for hydration, or it lands on server-rendered markup with no handler attached and is silently swallowed.
>
> **Anything under `.claude/worktrees/` is a second checkout of this repo.** Both runners walk the filesystem, so a leftover agent worktree makes Vitest collect every suite twice (117 tests read as 228, coverage as 30%) and makes ESLint report thousands of duplicate findings. Both configs now ignore `.claude/**`.

What exists today — 267 unit tests across 35 files. The largest suites (this table is not exhaustive; the error-handling and skeleton suites added by TD-13/TD-25/TD-29, and the maps/POI/proxy suites added by TD-14/TD-36, are not listed):

| Suite                                               | Tests | Notes                                                                      |
| --------------------------------------------------- | ----- | -------------------------------------------------------------------------- |
| `app/lib/data/getQuery.test.ts`                     | 18    | Query construction — the highest-value unit tests in the project, per §3   |
| `__test__/api/deleteEndpoints.test.ts`              | 32    | TD-01/TD-02 — 401, malformed `:id` → 400, and the authed path              |
| `__test__/data/mutationValidation.test.ts`          | 20    | TD-02 — valid writes, invalid rejected, field-keyed errors, partial update |
| `app/lib/data/validation/buildEntitySchema.test.ts` | 19    | TD-02 — every declared default passes its domain's schema                  |
| `__test__/data/mutationGuards.test.ts`              | 8     | TD-01 — each mutation throws and never writes without a session            |
| `__test__/auth/session-guards.test.ts`              | 5     | TD-01 — the `requireSession` / `requireApiSession` helpers directly        |
| `__test__/utils/generatePwdHash.test.ts`            | 4     | Rewritten; the old version could never pass                                |
| `app/lib/utils/data/sortByField/index.test.ts`      | 2     | Carried over                                                               |
| `__test__/utils/parseSerializedArray.test.ts`       | 1     | Carried over                                                               |
| `__test__/utils/createEmptyArray.test.ts`           | 1     | Carried over — was never collected before, the filename was malformed      |
| `app/ui/forms/inputs/Select/Select.test.tsx`        | 2     | Carried over                                                               |

Plus **40 Playwright tests** in `e2e/`, listed in §3.

**Still missing, and deliberately so:** integration tests against a real Postgres. Described below, not started. (The Playwright layer that used to be listed here landed with TD-24 on 2026-07-25.)

---

## 2. Target: what we test and why

Not "100% coverage". Coverage is a diagnostic, not a goal. What matters for this project is that the four things a reviewer would poke at are provably correct:

1. **Nobody can write to the database without a session.** (TD-01)
2. **Invalid input never reaches Prisma.** (TD-02)
3. **The metadata layer produces the right query for a given set of filters.** (the core abstraction)
4. **A user can complete each CRUD flow end to end.**

Everything else is supporting cast.

### The pyramid, sized for this project

```
        ╱  E2E — Playwright  ╲            ~8 specs
       ╱   critical user flows ╲
      ╱─────────────────────────╲
     ╱  Integration — Vitest     ╲        ~30 tests
    ╱   data layer + Server        ╲
   ╱    Actions against a real DB   ╲
  ╱───────────────────────────────────╲
 ╱   Unit — Vitest                     ╲  ~60 tests
╱    pure functions, hooks, components  ╲
─────────────────────────────────────────
```

### Coverage targets

| Area                  | Target  | Rationale                                                                |
| --------------------- | ------- | ------------------------------------------------------------------------ |
| `app/lib/data/**`     | 90%     | Query construction and mutations — the risky part                        |
| `app/lib/utils/**`    | 95%     | Pure functions, trivial to cover                                         |
| `app/lib/config/**`   | 80%     | Metadata correctness is load-bearing                                     |
| `app/lib/hooks/**`    | 70%     | State logic                                                              |
| `app/ui/**`           | 60%     | Behaviour, not markup                                                    |
| `app/modules/maps/**` | 50%     | Leaflet is hard to test headlessly; cover hooks and utils, not rendering |
| **Overall gate**      | **70%** | Enforced in CI, ratcheted upward over time                               |

**No row exists for `app/modules/maps/components/**` rendering** (737 lines; both TD-46 tiers now covered — Tier 1 on 2026-08-04, Tier 2 on 2026-08-04). Scoped as TD-46 rather than given a target here, since a target with nothing behind it invites the same drift TD-44 was opened to fix. The sibling gap this row used to cover — page-level Next.js route components (`app/[locale]/dashboard/**`, `app/ui/geography`) — was closed by TD-45. **Not e2e-only, unlike the raw Leaflet canvas itself** (jsdom genuinely can't render that, see "Explicitly out of scope" below): TD-46 found most of this tree — panels, forms, lists — is regular React UI, testable in Vitest with the Leaflet/map hooks and the `leaflet` module itself stubbed, the same pattern `WorldMap.test.tsx` already used.

Set the CI threshold to whatever you actually achieve at the end of Phase 1, then never let it drop. A threshold you have to disable to merge is worse than no threshold.

**Current thresholds are 70/71/69/69 (lines/functions/branches/statements)**, raised 2026-08-04 (TD-46 Tier 2) to match what the suite actually achieves — what the suite achieves today, not the targets above. They are a ratchet: raise them whenever a change adds real coverage, never lower them. The table stays the destination.

---

## 3. What each layer covers

### Unit — Vitest + Testing Library

Fast, no I/O, no database.

**Pure functions** (`app/lib/utils/`) — the easiest wins, and they already have a partial suite worth keeping:

- `validators/*` — `isValidString`, `isNumberArray`, `isObjectArray`, `isValidDataArray`, `isKeyOfItem`, … Table-driven tests with `it.each`.
- `data/parseSerializedArray` — malformed JSON, empty string, nested arrays.
- `data/sortByField` — already tested; extend with nulls, mixed types, stable-sort behaviour.
- `data/getDataLabel` — missing value, `shortLabel` fallback.
- `data/getSearchParam`. (The old `setSearchParams` helper was deleted in TD-05 — it was dead and broke `rules-of-hooks`.)

**Query construction** (`app/lib/data/getQuery.ts`) — the highest-value unit tests in the project. `getQuery` is a pure function from `(searchParams, enabledMeta)` to a Prisma query object, so it can be tested exhaustively with no database:

```ts
describe("getQuery", () => {
  it("builds a case-insensitive contains filter from `query`", () => {
    expect(getQuery({ query: "fire" }, [SpellMetaField.name]).where)
      .toEqual({ name: { contains: "fire", mode: "insensitive" } });
  });

  it("uses hasSome for array fields", () => { … });
  it("ignores params that fail their field-type validator", () => { … });
  it("computes skip from page and itemsPerPage", () => { … });
  it("falls back to ascending name ordering", () => { … });
});
```

**Hooks** — `renderHook` from Testing Library for `usePageManager`, `useFilterController`, `useMapControls`, `useMeasurement`, `usePOIManager`.

**Components** — behaviour, not snapshots. Delete `dashboard-snapshot.tsx`: snapshot tests of markup break on every styling change and assert nothing meaningful. Test instead: `Select` opens and reports the chosen value; `PageForm` renders the controls its metadata declares; `pagination` disables at boundaries; `BaseButton` applies the right variant and disabled state.

### Integration — Vitest against a real Postgres

Run against a disposable Postgres (Testcontainers, or a `docker-compose.test.yaml` service) — **not** a mocked Prisma client. Mocking Prisma tests your mock, not your query.

- Each `create*` / `update*` / `delete*` function: happy path, not-found, constraint violation.
- Each `fetchFiltered*`: filtering, sorting, pagination boundaries, empty result.
- `getXCount` agrees with `fetchFilteredX` for the same filter (this is TD-12's regression test).
- **Auth guards** ✅ done in TD-01: every DELETE handler returns 401 and every `create*`/`update*` mutation throws without a session, each with a test (`__test__/api/`, `__test__/data/mutationGuards.test.ts`, `__test__/auth/`). These run without a database — the guard rejects before any query — so they live in the unit suite, not the integration one.
- **Validation** ✅ done in TD-02: every mutation rejects a malformed payload with field-keyed errors and writes nothing, and a malformed route `:id` returns 400. Like the auth guards, these need no database and live in the unit suite.

Each test seeds and truncates its own fixtures. No shared mutable state between tests.

### E2E — Playwright

Chromium in CI; add Firefox and WebKit once the suite is stable. Roughly eight specs, no more — E2E is expensive and each one must earn its place.

| Spec                      | Flow                                                                                                                                 | Built as                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `auth.spec.ts`            | Log in with valid credentials → dashboard. Invalid credentials → error, no redirect. Unauthenticated `/dashboard/spells` → `/login`. | ✅ as planned, plus the 401 on a DELETE route                                                               |
| `spells-crud.spec.ts`     | Create a spell → appears in list → edit → delete → gone.                                                                             | ✅ as planned, plus a cancel-the-delete case                                                                |
| `npc-crud.spec.ts`        | Same for NPCs (the domain with the most fields).                                                                                     | ✅ as planned (was `png-crud.spec.ts` until TD-19)                                                          |
| `filtering.spec.ts`       | Apply filter → list narrows → filters survive reload → reset clears them.                                                            | ✅ its skipped case found TD-27; fixed, `fixme` gone                                                        |
| `pagination.spec.ts`      | Navigate pages, verify the count matches the rows.                                                                                   | ◑ count-vs-rows only; 30/page against 4 seeded rows is one page                                             |
| `map.spec.ts`             | Map loads, tile/world switching works, right-click opens the context menu.                                                           | ✅ mount + world switching + context menu; POI/marker/measurement CRUD split out to their own specs (TD-46) |
| `map-poi-crud.spec.ts`    | "My Places" POI panel: add → appears in list → edit → delete → gone.                                                                 | ✅ TD-46 sub-slice (2026-08-04)                                                                             |
| `map-poi-link.spec.ts`    | A POI linked to an NPC gets a working "View NPC" popup link.                                                                         | ✅ pre-existing, not previously listed here                                                                 |
| `map-measurement.spec.ts` | Context menu "Measure" → distance mode → place points → running distance updates → finish → close.                                   | ✅ TD-46 sub-slice (2026-08-04); area mode not covered, same UI shape                                       |
| `validation.spec.ts`      | Submit an empty required field → inline error, nothing written.                                                                      | ✗ not writable — see below; covers `:id` → 400 instead                                                      |
| `a11y.spec.ts`            | `@axe-core/playwright` over each main page (supports TD-15).                                                                         | ✅ **zero**-violation gate, eleven pages, plus a keyboard focus test                                        |

**Where they differ from this plan, and why** (full detail in TECH_DEBT.md TD-24):

- **`validation.spec.ts`** — every string field's validator is a bare `z.string()`, so an empty `nome` is valid and saving it is correct. There is no required-field error to assert until TD-02's open product decision is made.
- **`pagination.spec.ts`** — `DEFAULT_ITEMS_PER_PAGE` is 30 and the seed inserts 4–5 rows per domain, so every list is one page. This is a limitation of the _seed_, not of the app: the DM holds a real dataset (361 spells, 119 NPCs, 62 magic items) which at 30 per page is 13 pages of spells. Turning that into an E2E fixture — or into the seed itself — is what unlocks the multi-page assertions this spec currently cannot make, and would make every other spec exercise realistic volumes.
- **`a11y.spec.ts`** — no longer differs. It shipped under TD-24 as a known-violations allowlist because a zero gate would have been red on arrival; **TD-15 then closed the violations and made it a zero gate** (`expect(summary).toEqual([])`). What the allowlist contained: `color-contrast` on every primary button — white on `violet-500` measured 4.4:1 against the 4.5:1 that 14px text needs, missing by a tenth — plus `link-name` on the icon-only sidebar and pagination links, and `button-name` on the sort controls. One entry, `aria-toggle-field-name`, had already been fixed before the pass began, which is exactly the failure mode an allowlist has.

**Two selector traps.** The `role="dialog"` element has no bounding box (its children are `fixed`), so Playwright reports it hidden — assert on something inside it. And each dialog renders its title twice, so a heading query inside one is a strict-mode violation.

Use `page.getByRole` / `getByLabel`, not CSS selectors — role-based queries double as accessibility assertions.

### Explicitly out of scope

- Visual regression testing (Percy/Chromatic) — nice, not worth the setup cost yet.
- Load testing — single-user tool.
- Testing Leaflet's own rendering — test our hooks around it.
- Snapshot tests of markup.

---

## 4. Migration from Jest to Vitest — ✅ DONE (2026-07-22)

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

## 5. Conventions

**Location.** Unit tests sit beside their subject (`sortByField/index.test.ts` — the pattern already in use). Integration tests in `__test__/integration/`. E2E in `e2e/`.

**Naming.** Describe behaviour, not implementation:

```ts
// ✅ it("returns 401 when no session is present")
// ❌ it("calls auth")
```

**Structure.** Arrange–Act–Assert, with blank lines between the three.

**Fixtures.** Factory functions in `__test__/factories/`, with overridable defaults:

```ts
export const makeSpell = (overrides: Partial<Spell> = {}): Spell => ({
  name: "Palla di Fuoco", level: 3, circle: [Subclass.BardoSapienza], …overrides,
});
```

**No conditional logic in tests.** If a test needs an `if`, it should be two tests.

**One reason to fail.** A test asserting five unrelated things tells you nothing when it goes red.

---

## 6. Definition of done for any change

A change is not complete until:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes and coverage has not dropped
- [ ] New behaviour has a test that fails without the change
- [ ] Bug fixes have a regression test reproducing the bug
- [ ] Any change to a user-facing flow has an E2E assertion or an explicit note of why not

---

## 7. Related documents

- [`TECH_DEBT.md`](./TECH_DEBT.md) — TD-03 (broken suite), TD-01/TD-02 (what to test first)
- [`adr/0002-testing-stack.md`](./adr/0002-testing-stack.md) — why Vitest over Jest
- [`../CLAUDE.md`](../CLAUDE.md) — how to ask for tests in AI-assisted sessions
