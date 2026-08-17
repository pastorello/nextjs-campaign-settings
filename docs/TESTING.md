# Testing Strategy

**Last updated:** 2026-08-08
**Stack:** Vitest + Testing Library (unit/integration) · Playwright (E2E) · MSW where network mocking is needed
**Decision record:** [ADR-0002](./adr/0002-testing-stack.md)

---

## 1. Where we are

**Migrated to Vitest on 2026-07-22 (TD-03).** Coverage crossed the 70% Phase 2 exit criterion on 2026-08-04 with TD-46's Tier 2 maps suites, and is enforced in CI as a ratchet — see §2.

> **Do not read a test count out of this file.** Until 2026-08-08 this paragraph said "807 tests across 116 files" while §1's own table thirty lines below said "267 unit tests across 35 files" — the same document, disagreeing with itself by a factor of three, and both figures wrong. Neither is recorded here any more. Run the command:
>
> ```bash
> pnpm test 2>&1 | tail -4          # unit tests and files
> pnpm test:e2e --list | tail -1    # E2E tests and files (needs .env.test, see §2)
> ```
>
> This is [`docs/README.md`](./README.md#keeping-them-honest)'s rule applied to the file that had broken it worst: _counts and statuses rot; prose about why does not._

**How the 70% gate was reached (2026-08-02 → 2026-08-04).** TD-44 checked whether the coverage denominator was undercounting (it was not — `coverage.all` is unconditional default behaviour on Vitest 4), then re-scoped the remaining gap into TD-45 (page-level route components) and TD-46 (`app/modules/maps/components/**`), both closed 2026-08-04. **The per-item narrative moved to [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md) on 2026-08-08**; what was worth keeping here is the technique, below.

### Techniques that took a while to work out

Reach for these before rediscovering them. All are in use in the suites named.

- **Leaflet** — mock the `leaflet` module itself (`L.map()`, event wiring), not a wrapper hook around it. `LeafletMap.test.tsx`. The raw canvas is the only genuinely untestable part (see "Explicitly out of scope"); everything above it is ordinary React.
- **A panel that is CSS-collapsed rather than unmounted** (`max-h-0`/`opacity-0`) — assert on the element's class list, not on the absence of its text, which is still in the DOM. `MapSearchBar.test.tsx`, `MapDetailsPanel.test.tsx`.
- **Debounced input** — `vi.useFakeTimers()` with `advanceTimersByTimeAsync`. `MapSearchBar.test.tsx`.
- **A Radix `DropdownMenu` in jsdom** — `fireEvent.pointerDown` then `fireEvent.click` on the trigger opens it. No `user-event` dependency needed. `MapUser.test.tsx`.
- **Responsive components** — test the desktop branch only; jsdom's default `window.innerWidth` already reads as desktop, and the mobile `Drawer` branch is deliberately not exercised. `MapPOIPanel.test.tsx` set this convention.
- **Repeated page shapes** — cover each shape once, not once per domain. `spells/page.tsx` stands in for `deities`/`magicitems`/`npc`; the same for the admin list and "new item" patterns. TD-45's ten files.
- **A component whose children each have their own suite** — stub the children and test only this component's own logic. `WorldMap.test.tsx`.
- **A hoisted mock reference, not `vi.mocked(prisma.x.y)`** — the latter trips `unbound-method` outside `__test__/**`, where the rule is off. `createPoi.test.ts` documents why; `fetchDerivedAncestry.test.ts` follows it.
  **Playwright landed 2026-07-25 (TD-24).** `pnpm test:e2e` runs against a real database and a dev server it starts itself — a couple of minutes in CI, quicker locally once the dev server is warm. Nothing is skipped. The suite has grown steadily with the SPEC-004 map work; `pnpm test:e2e --list` is the honest way to see its current size (requires `.env.test`, see §2).

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

**The load-bearing suites**, listed because they are the ones §2 says must be right — not as an inventory, which would rot. Counts are omitted for the same reason; run the suite:

| Suite                                               | Notes                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `app/lib/data/getQuery.test.ts`                     | Query construction — the highest-value unit tests in the project, per §3   |
| `__test__/api/deleteEndpoints.test.ts`              | TD-01/TD-02 — 401, malformed `:id` → 400, and the authed path              |
| `__test__/data/mutationValidation.test.ts`          | TD-02 — valid writes, invalid rejected, field-keyed errors, partial update |
| `app/lib/data/validation/buildEntitySchema.test.ts` | TD-02 — every declared default passes its domain's schema                  |
| `__test__/data/mutationGuards.test.ts`              | TD-01 — each mutation throws and never writes without a session            |
| `__test__/auth/session-guards.test.ts`              | TD-01 — the `requireSession` / `requireApiSession` helpers directly        |
| `__test__/utils/generatePwdHash.test.ts`            | Rewritten; the old version could never pass                                |
| `app/lib/utils/data/sortByField/index.test.ts`      | Carried over                                                               |
| `__test__/utils/parseSerializedArray.test.ts`       | Carried over                                                               |
| `__test__/utils/createEmptyArray.test.ts`           | Carried over — was never collected before, the filename was malformed      |
| `app/ui/forms/inputs/Select/Select.test.tsx`        | Carried over                                                               |

The E2E specs are listed in §3.

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
        ╱  E2E — Playwright  ╲            one spec per critical flow
       ╱   critical user flows ╲
      ╱─────────────────────────╲
     ╱  Integration — Vitest     ╲        not started — see below
    ╱   data layer + Server        ╲
   ╱    Actions against a real DB   ╲
  ╱───────────────────────────────────╲
 ╱   Unit — Vitest                     ╲  the bulk of the suite
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

**Current thresholds are 74/75/73/73 (lines/functions/branches/statements)**, raised 2026-08-13 after an audit found the gate had grown slack relative to the suite's actual coverage. They are a ratchet: raise them whenever a change adds real coverage, never lower them. The table stays the destination.

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

Chromium in CI; add Firefox and WebKit once the suite is stable. E2E is expensive and each spec must earn its place — but the ceiling this line used to set ("roughly eight specs, no more") was passed deliberately during the SPEC-004 map work, where the flows genuinely are end-to-end. The rule is that each one earns its place, not that there are eight.

| Spec                      | Flow                                                                                                                                 | Built as                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `auth.spec.ts`            | Log in with valid credentials → dashboard. Invalid credentials → error, no redirect. Unauthenticated `/dashboard/spells` → `/login`. | ✅ as planned, plus the 401 on a DELETE route                                                               |
| `spells-crud.spec.ts`     | Create a spell → appears in list → edit → delete → gone.                                                                             | ✅ as planned, plus a cancel-the-delete case                                                                |
| `npc-crud.spec.ts`        | Same for NPCs (the domain with the most fields).                                                                                     | ✅ as planned (was `png-crud.spec.ts` until TD-19)                                                          |
| `filtering.spec.ts`       | Apply filter → list narrows → filters survive reload → reset clears them.                                                            | ✅ its skipped case found TD-27; fixed, `fixme` gone                                                        |
| `pagination.spec.ts`      | Navigate pages, verify the count matches the rows.                                                                                   | ◑ count-vs-rows only; 30/page against 4 seeded rows is one page                                             |
| `map.spec.ts`             | Map loads, tile/world switching works, right-click opens the context menu.                                                           | ✅ mount + world switching + context menu; POI/marker/measurement CRUD split out to their own specs (TD-46) |
| `map-poi-crud.spec.ts`    | "My Places" POI panel: add → appears in list → edit → delete → gone.                                                                 | ✅ TD-46 sub-slice (2026-08-04)                                                                             |
| `map-measurement.spec.ts` | Context menu "Measure" → distance mode → place points → running distance updates → finish → close.                                   | ✅ TD-46 sub-slice (2026-08-04); area mode not covered, same UI shape                                       |
| `validation.spec.ts`      | Submit an empty required field → inline error, nothing written.                                                                      | ✗ not writable — see below; covers `:id` → 400 instead                                                      |
| `a11y.spec.ts`            | `@axe-core/playwright` over each main page (supports TD-15).                                                                         | ✅ **zero**-violation gate, eleven pages, plus a keyboard focus test                                        |

**Where they differ from this plan, and why** (full detail in TECH_DEBT.md TD-24):

- **`validation.spec.ts`** — every string field's validator is a bare `z.string()`, so an empty `nome` is valid and saving it is correct. There is no required-field error to assert until TD-02's open product decision is made.
- **`pagination.spec.ts`** — `DEFAULT_ITEMS_PER_PAGE` is 30 and the seed inserts 4–5 rows per domain, so every list is one page. This is a limitation of the _seed_, not of the app: the DM holds a real dataset (361 spells, 119 NPCs, 62 magic items) which at 30 per page is 13 pages of spells. Turning that into an E2E fixture — or into the seed itself — is what unlocks the multi-page assertions this spec currently cannot make, and would make every other spec exercise realistic volumes.
- **`map-poi-link.spec.ts`** — removed (SPEC-008 T8). It tested TD-14's "a landmark POI optionally links to an NPC/deity" popup, a feature dropped when `poi`'s reshape into the landmark-only table left no `linkedType`/`linkedId` columns for it — superseded by `npc`/`deities`' own `zoneId`/`poiId` pointing the other way.
- **`a11y.spec.ts`** — no longer differs. It shipped under TD-24 as a known-violations allowlist because a zero gate would have been red on arrival; **TD-15 then closed the violations and made it a zero gate** (`expect(summary).toEqual([])`). What the allowlist contained: `color-contrast` on every primary button — white on `violet-500` measured 4.4:1 against the 4.5:1 that 14px text needs, missing by a tenth — plus `link-name` on the icon-only sidebar and pagination links, and `button-name` on the sort controls. One entry, `aria-toggle-field-name`, had already been fixed before the pass began, which is exactly the failure mode an allowlist has.

**Two selector traps.** The `role="dialog"` element has no bounding box (its children are `fixed`), so Playwright reports it hidden — assert on something inside it. And each dialog renders its title twice, so a heading query inside one is a strict-mode violation.

Use `page.getByRole` / `getByLabel`, not CSS selectors — role-based queries double as accessibility assertions.

### Explicitly out of scope

- Visual regression testing (Percy/Chromatic) — nice, not worth the setup cost yet.
- Load testing — single-user tool.
- Testing Leaflet's own rendering — test our hooks around it.
- Snapshot tests of markup.

---

## 4. Migration from Jest to Vitest

**Done 2026-07-22 (TD-03).** The plan, and the four steps that went differently from it, are in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md) — moved there on 2026-08-08 because 88 lines of a finished migration, install commands and all, is not what someone opening this file to write a test needs to scroll past.

The one deviation still worth knowing while writing tests: **tests import `describe`/`it`/`expect` from `vitest` explicitly** rather than relying on `globals: true`. Dropping `@types/jest` left them untyped under `tsc`, and explicit imports fix that without a `types` array in tsconfig, which would have overridden the default and pulled the rug on `@types/node`.

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
