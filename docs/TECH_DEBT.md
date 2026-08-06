# Technical Debt Register

**Last updated:** 2026-08-06
**Scope:** TD-01 – TD-22 came out of the 2026-07-22 audit; TD-23 onward were found while doing the work, which is why their numbering is chronological rather than thematic. Each item is independently actionable and sized to be completable in one focused session.
**Open items:** TD-61 (option-backed `Int` fields accept any number) and TD-62 (POI category labels hardcoded in English) — both opened 2026-08-06, both independent of the world-model design in [SPEC-004](./specs/004-world-model.md). TD-44 (2026-08-02) found `coverage.all: true` changed nothing, confirming the 50.68%-lines baseline rather than correcting it, and produced two properly scoped gaps: TD-45 (page-level route components) and TD-46 (`app/modules/maps/components/**` Leaflet rendering). TD-45 closed 2026-08-04: 10 new test files brought the suite to 54.51% lines / 48.92% branches (682 → 709 tests). TD-46's e2e sub-slices (POI CRUD, measurement) verified real flows but — `vitest.config.ts` excludes `e2e/**` from coverage — never moved that number, so the item pivoted to Vitest, tiered by whether `WorldMap.tsx` actually renders the component. **Tier 1 closed 2026-08-04:** five new suites (`LeafletMap`, `MapContextMenu`, `MapMeasurementPanel`, `MapControls`, `MapPOIPanel`) brought the suite to 63.81% lines / 60.89% branches (709 → 755 tests). **Tier 2 closed the same day:** the remaining eight components (`MapSearchBar`, `MapTopBar`, `MapTileSwitcher`, `MapThemeSwitcher`, `MapUser`, `LeafletGeoJSON`, `LeafletTileLayer`, `MapDetailsPanel`) — reachable only through `MapMain.tsx`, which has no importer outside its own directory — were tested as-is per the user's cable-or-delete call, bringing the suite to **70.09% lines / 69.66% branches (755 → 807 tests)**. **This crosses Phase 2's 70% exit criterion** — see `docs/ROADMAP.md`. TD-58/TD-59 (2026-08-06) closed a Dependabot config gap that broke CI twice on the same day (an ungrouped ESLint major bump, then a `prisma` CLI/client version split); see their write-ups below.

**TD-47 – TD-55 do not exist in this document, and that is not an oversight to fix.** A 2026-08-06 merge commit ("docs: record TD-47 – TD-57 from the 2026-08-04 audit pass", PR #80) claimed to record all nine, but its actual diff only ever added `.env.example` and `dependabot.yml` — TD-56 and TD-57's fixes, still themselves undocumented here until this pass added TD-58/TD-59 alongside them. No PR, commit, or doc anywhere in this repo's history contains what TD-47–TD-55 were about; they were most likely identified in an external audit session (a Cowork pass, per `CLAUDE.md`'s "Bringing research into the codebase" section) whose findings were never committed. **Do not re-litigate this as a documentation bug to fix by writing entries** — there is nothing to transcribe, only a merge-commit message that overclaimed. Do not reuse IDs 47–55 for new items; skip to the next free number instead, so a rediscovered original write-up (if one ever surfaces) has an unambiguous home.

## Legend

| Severity    | Meaning                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| 🔴 Critical | Security hole, data loss risk, or the project does not build/run correctly |
| 🟠 High     | Breaks something a normal five-minute walkthrough of the app would hit     |
| 🟡 Medium   | Real quality problem, not immediately visible                              |
| 🟢 Low      | Polish                                                                     |

Effort: **S** ≈ under 1h · **M** ≈ 1–3h · **L** ≈ half a day or more.

---

## Summary

| ID    | Title                                                                                                       | Severity             | Effort | Phase |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------------------- | ------ | ----- |
| TD-01 | ✅ Unauthenticated delete endpoints and Server Actions                                                      | ~~🔴 Critical~~ done | M      | 1     |
| TD-02 | ✅ No input validation, incl. TD-02b's remaining boundaries                                                 | ~~🔴 Critical~~ done | M      | 1–2   |
| TD-03 | ✅ Test suite does not run                                                                                  | ~~🔴 Critical~~ done | M      | 1     |
| TD-04 | ✅ TypeScript errors on `tsc --noEmit`                                                                      | ~~🔴 Critical~~ done | S      | 1     |
| TD-05 | ✅ No ESLint config, no Prettier, no CI                                                                     | ~~🟠 High~~ done     | S      | 1     |
| TD-06 | ✅ Dead code and tutorial leftovers                                                                         | ~~🟠 High~~ done     | S      | 1     |
| TD-07 | ✅ `next`/`react` pinned; single lockfile                                                                   | ~~🟠 High~~ done     | S      | 1     |
| TD-08 | ✅ Metadata and query layer typed; zero `any`, rule is an error                                             | ~~🟠 High~~ done     | M      | 2     |
| TD-09 | ✅ Quartets collapsed into EntityList / EntityLibrary / EntityForm                                          | ~~🟠 High~~ done     | L      | 2     |
| TD-10 | ✅ Toasts (client) vs `logServerIssue` (server) replace the stub                                            | ~~🟠 High~~ done     | M      | 2     |
| TD-11 | ✅ Timestamps + `@@index([nome])`; relations still deferred                                                 | ~~🟡 Medium~~ part   | M      | 2     |
| TD-12 | ✅ Filter list declared once; count and rows can no longer diverge                                          | ~~🟡 Medium~~ done   | S      | 2     |
| TD-13 | ✅ Typed errors with `cause`; 404 vs 500; toasts via TD-10                                                  | ~~🟡 Medium~~ done   | M      | 2     |
| TD-14 | ✅ Map POIs persisted only to `localStorage`                                                                | ~~🟡 Medium~~ done   | M      | 3     |
| TD-15 | ✅ `e2e/a11y.spec.ts` — zero axe violations, keyboard focus ring                                            | ~~🟡 Medium~~ done   | M      | 2     |
| TD-16 | ✅ Inconsistent formatting                                                                                  | ~~🟢 Low~~ done      | S      | 1     |
| TD-17 | ✅ README does not match reality                                                                            | ~~🟢 Low~~ done      | S      | 1     |
| TD-18 | ✅ `copy-webpack-plugin` forces webpack over Turbopack                                                      | ~~🟢 Low~~ done      | S      | 3     |
| TD-19 | ✅ Mixed Italian/English identifiers (residual set → TD-33)                                                 | ~~🟠 High~~ done     | L      | 2     |
| TD-20 | ✅ Every flag on, incl. `noUncheckedIndexedAccess` (`noUnusedLocals` rejected)                              | ~~🟡 Medium~~ done   | M      | 2     |
| TD-21 | ✅ UI strings hardcoded; app must ship in it + en                                                           | ~~🟠 High~~ done     | L      | 2     |
| TD-22 | ✅ Lint warnings 293 → 0; every rule back to `error`                                                        | ~~🟠 High~~ done     | M      | 2     |
| TD-23 | ✅ Migration drift patched forward; migrations match the schema                                             | ~~🟠 High~~ done     | S      | 1     |
| TD-24 | ✅ Playwright harness + specs; `e2e` job blocking in CI                                                     | ~~🟠 High~~ done     | M      | 1     |
| TD-25 | ✅ Startup reachability check; 503 distinct from 500                                                        | ~~🟡 Medium~~ done   | S      | 2     |
| TD-26 | ✅ `sottoclassi` / `circolo` duplication resolved                                                           | ~~🟡 Medium~~ done   | S      | 2     |
| TD-27 | ✅ Hidden `classi=0` filter on the spells list removed                                                      | ~~🟠 High~~ done     | S      | 2     |
| TD-28 | ✅ Seed ids removed; the database assigns them, as the UI does                                              | ~~🟠 High~~ done     | S      | 2     |
| TD-29 | ✅ Loading skeleton was the tutorial's invoices table                                                       | ~~🟡 Medium~~ done   | S      | 2     |
| TD-30 | ✅ Public list pages actually stream; skeleton matches the content                                          | ~~🟡 Medium~~ done   | S      | 2     |
| TD-31 | ✅ `sortSelectOptions` mutated shared `PageMeta.options` in place                                           | ~~🟡 Medium~~ done   | S      | 2     |
| TD-32 | ✅ E2E job spent 9m a run on `playwright install-deps`                                                      | ~~🟠 High~~ done     | S      | 1     |
| TD-33 | ✅ Italian identifiers TD-19 missed — 16 across 14 files + a directory                                      | ~~🟡 Medium~~ done   | S      | 2     |
| TD-34 | ✅ CI actions pinned to a deprecated Node 20 runtime; Node 22 → 24                                          | ~~🟢 Low~~ done      | S      | 2     |
| TD-35 | ✅ E2E specs assert hardcoded Italian copy instead of reading the catalogue                                 | ~~🟡 Medium~~ done   | M      | 2     |
| TD-36 | ✅ `proxy.ts` matcher let `.jpg` through the auth/i18n gate, breaking map tiles                             | ~~🟠 High~~ done     | S      | 2     |
| TD-37 | ✅ `authenticate()` and `app/lib/connections/**` are 0% covered — the login and DB-bootstrap path           | ~~🟠 High~~ done     | S      | 2     |
| TD-38 | ✅ `fetch*`/`get*Count` untested for deities, magicitems, npc — data layer at 51%, target 90%               | ~~🟠 High~~ done     | S      | 2     |
| TD-39 | ✅ Pure functions in `app/lib/utils/**` at 51%, target 95% — cheapest real coverage in the project          | ~~🟡 Medium~~ done   | S      | 2     |
| TD-40 | ✅ Metadata correctness untested — `npcMeta`/`deityMeta` at 14%/25%, target 80%                             | ~~🟡 Medium~~ done   | S      | 2     |
| TD-41 | ✅ `app/lib/hooks/**` at 52%, target 70% — `useFilterController` entirely untested                          | ~~🟡 Medium~~ done   | S      | 2     |
| TD-42 | ✅ `app/ui/**` behaviour untested — domain forms/cards/libraries at ~0%, target 60%                         | ~~🟢 Low~~ done      | L      | 2     |
| TD-43 | ✅ `app/modules/maps/**` geometry and hooks near 0%, target 50%                                             | ~~🟢 Low~~ done      | M      | 2     |
| TD-44 | ✅ Re-measured coverage with `coverage.all: true`; re-scoped the 70% gap as TD-45/TD-46                     | ~~🟡 Medium~~ done   | S      | 2     |
| TD-45 | ✅ Page-level route components (`app/[locale]/dashboard/**`, `app/ui/geography`) covered                    | ~~🟡 Medium~~ done   | M      | 2     |
| TD-46 | ✅ `app/modules/maps/components/**` (Leaflet rendering, 737 lines) Vitest coverage — Tier 1 and Tier 2 done | ~~🟡 Medium~~ done   | L      | 2     |
| TD-58 | ✅ Dependabot grouped a major ESLint bump into the dev-dependencies group, breaking CI                      | ~~🟠 High~~ done     | S      | 3     |
| TD-59 | ✅ `prisma` CLI and `@prisma/client`/`@prisma/adapter-pg` could bump independently, breaking the build      | ~~🟠 High~~ done     | S      | 3     |
| TD-61 | Option-backed `Int` fields accept any number; an out-of-list value renders as a blank cell                  | 🟠 High              | S      | 3     |
| TD-62 | POI category names are hardcoded English and reach the UI — a TD-21 leftover                                | 🟢 Low               | S      | 3     |
| TD-64 | `WorldMap.tsx`'s async-effect map-loading pattern trips `react-hooks/set-state-in-effect`                   | 🟢 Low               | S      | 3     |
| TD-65 | `DATABASE_URL` in this dev environment isn't a throwaway DB — e2e debris landed in real data                | 🟡 Medium            | S      | 3     |
| TD-66 | `UPLOAD_DIR`'s relative default silently splits map-image files from the DB rows referencing them           | 🟡 Medium            | S      | 3     |
| TD-67 | "Add to My Places" context-menu label is misleading — it creates any kind, not just a POI                   | 🟢 Low               | S      | 3     |
| TD-68 | `MapPOIPanel`'s Close button is unclickable — a same-`z-index` overlay intercepts the click                 | 🟠 High              | S      | 3     |
| TD-69 | `poi.linkedType`/`linkedId` has no unique constraint — a second pin per NPC/deity is silently possible      | 🟠 High              | S      | 3     |
| TD-70 | No rendering path exists for `deity`/`npc` pins on the map, even once positioned                            | 🟡 Medium            | M      | 3     |
| TD-71 | No way to position or edit a place that already exists — only newly-created ones get coordinates            | 🟠 High              | L      | 3     |

---

## Closed items — TD-01 through TD-36

Every item the 2026-07-22 audit found, plus everything found while doing the work through 2026-08-01, is closed. Correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness — all done, with tests. The summary table above is the current status of each.

**The full write-up for each — what was found, why, the fix — moved to [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)** on 2026-08-01, so this file stays what it's for: deciding what to work on next. Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

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

**A display bug found on the way, not fixed here.** `app/lib/actions.ts` (a flat file) sits beside `app/lib/actions/` (a directory) — the exact "flat file beside a directory of the same name" pattern `CLAUDE.md`'s decision log already forbids. It doesn't break anything at runtime, but it breaks `pnpm test:coverage`'s human-readable table: the row for `app/lib/actions.ts` is silently dropped from the printed output entirely (confirmed present and at 100% in `coverage/coverage-summary.json`, just never rendered in the text table). Filed as a follow-up rather than fixed here, since a rename is a mechanical, unrelated change that belongs in its own commit.

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

## TD-61 🟠 Option-backed `Int` fields accept any number; an out-of-list value renders as a blank cell

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

## TD-62 🟢 POI category names are hardcoded English and reach the UI

**Where:** `app/modules/maps/constants/poi-categories.ts` — the `name` field of all 14 `POI_CATEGORIES` entries (`"Food & Drink"`, `"Shopping"`, `"Transport"`, …). Rendered at [`MapPOIPanel.tsx:330`](../app/modules/maps/components/map/MapPOIPanel.tsx).

**Why:** TD-21 extracted every user-facing string into `messages/{it,en}.json` and the app ships bilingual, but this list was missed — it declares its labels inline, in English, and the panel renders them directly. An Italian user filtering POIs by category sees English labels. `CLAUDE.md`'s rule is explicit: no new hardcoded UI strings, and these are old ones that survived the sweep.

Found on 2026-08-06 while drafting [SPEC-004](./specs/004-world-model.md), which turns `category` into the world model's `kind` and re-themes these values for the setting (an inn, a temple, a boat in the harbour) — so the strings are going to be rewritten anyway.

**Plan:** replace `name: "Food & Drink"` with a `labelKey`, resolved at the render boundary per [ADR-0007](./adr/0007-message-key-resolution-boundary.md), the way every option list in `app/lib/config/**` already does. Add the 14 keys to both catalogues so TD-21's CI key-set check stays green.

**Sequencing:** cheap and self-contained, so it can ship now. But if SPEC-004 is built soon it will rewrite this list wholesale, and doing both means translating strings twice — worth checking which is closer before starting.

**Done when:** no `POI_CATEGORIES` entry carries a hardcoded display string, and switching locale changes the category labels in `MapPOIPanel`.

---

## TD-63 🟡 Local dev DB's migration history has a gap `migrate dev`/`migrate deploy` cannot get past

**Where:** `my-database-container` (the maintainer's local dev Postgres, `DATABASE_URL` in `.env`). `_prisma_migrations` there.

**Why:** the dev database was originally built with `db push`, and only some migrations were ever recorded as applied against it — `20260730020000_rename_png_table_to_npc` and `20260731120000_add_poi_table` (both hand-applied via `docker exec … psql` then marked with `prisma migrate resolve --applied`, per that migration's own header comment). The three migrations before them (`20251126152855_resetio`, `20260726093000_add_spells_nome_drop_tutorial_tables`, `20260726100000_add_timestamps_and_name_indexes`) were never recorded, even though the schema they describe is already live — the DB's actual shape and its tracked history disagree.

This blocks both commands that assume a clean history:

- `prisma migrate dev` builds a shadow database and replays every migration file from empty; the replay dies partway through with `relation "png" does not exist` (a step assumes state the shadow DB never had, because the real DB got there by a different path).
- `prisma migrate deploy` tries to apply the DB's actual pending list in order and dies the same way, now with `relation "deities" already exists` — the SQL is trying to create a table the live DB already has.

Surfaced again on 2026-08-06 while shipping SPEC-004 M2's migration, which had to be applied the same workaround way as M1: hand-write the SQL (via `prisma migrate diff --from-config-datasource --to-schema` against the live DB, which needs no shadow database), apply it directly with `docker exec … psql`, then `prisma migrate resolve --applied` to record it. Attempting `migrate deploy` first left a **failed** `20251126152855_resetio` row in `_prisma_migrations` (`finished_at` null) — worth checking before the next migration attempt, since a failed row there can itself block `migrate deploy`.

**Plan:** for each of the 3 untracked migrations, confirm the schema they describe genuinely already matches the live DB (diff, don't assume), then `prisma migrate resolve --applied` each one in order. After that, `migrate dev`/`migrate deploy` should work normally again and this workaround stops being necessary for every future schema change.

**Done when:** `prisma migrate status` on the dev DB reports no pending and no failed migrations, and a throwaway schema change round-trips through `prisma migrate dev` without the hand-apply workaround.

---

## TD-64 🟢 `WorldMap.tsx`'s async-effect map-loading pattern trips `react-hooks/set-state-in-effect`

**Where:** [`app/ui/geography/WorldMap.tsx`](../app/ui/geography/WorldMap.tsx) — the `useEffect` that calls `void initializeMap()`.

**Why:** PR #90 (Dependabot, dev-dependencies group) bumped `eslint-config-next` 16.0.10 → 16.2.12, which pulled in the React Compiler's `react-hooks/set-state-in-effect` and `react-hooks/refs` rules. Three pre-existing patterns started failing `pnpm lint` as a result — unrelated to what that PR actually changed (only `package.json`/lockfile). Two were fixed outright on 2026-08-06: `MapSearchBar.tsx`'s `selectedIndex` reset moved from a `useEffect` to the "adjust state during render" pattern from the React docs, and `usePOIManager.ts`'s `tRef.current = t` moved from the render body into a dependency-less `useEffect`.

`WorldMap.tsx`'s case is different: `initializeMap` is `async`, and the rule appears to flag any function invoked directly in an effect body that transitively calls `setState`, even through an `await` — a known category of false positive for this rule with async local functions. The effect itself is the standard "load an external resource, then set state" pattern effects exist for; rewriting it to satisfy the rule would mean restructuring the map-loading flow, not just moving a line.

**Plan:** re-evaluate once `eslint-plugin-react-hooks`/`eslint-config-next` ships a fixed version of this rule for async functions, or decide deliberately to restructure `initializeMap` (e.g. split the async fetch from the synchronous state commit) if no fix lands. Until then it carries a scoped `eslint-disable-next-line react-hooks/set-state-in-effect` with this TD referenced inline.

**Done when:** the disable comment is removed and `pnpm lint` still passes, either because the upstream rule stopped flagging this pattern or because the effect was restructured to satisfy it.

---

## TD-65 🟡 `DATABASE_URL` in this dev environment isn't a throwaway DB — e2e debris landed in real data

**Where:** `.env`'s `DATABASE_URL`, which `pnpm test:e2e` also writes and deletes real rows against (`CLAUDE.md`'s own warning on the command).

**Why:** found 2026-08-06 while starting SPEC-004 T3 — the `poi` table's only 5 rows were e2e test debris (`"E2E World 1786045869959"`, four `"E2E POI …"` rows linked to `npc` ids 713–716), not a DM-created root. No real world had been created via the M4 UI yet; the debris was masquerading as one, with an arbitrary uploaded test image instead of the real `piani-esistenza.jpg`. Deleted by hand before T3's seed ran (confirmed no live-data references first: nothing had `parentId` pointing at the fake root, `npc` 713–716 weren't otherwise touched).

This means whatever ran `pnpm test:e2e` most recently was pointed at this same dev database rather than a disposable one, contrary to `CLAUDE.md`'s explicit instruction. It is easy to do by accident — nothing enforces `DATABASE_URL` being different for `pnpm dev` vs `pnpm test:e2e`, both read the same `.env`.

**Plan:** either a second env file (`.env.test`) `test:e2e`'s Playwright config loads instead of `.env`, or a runtime guard that refuses to run the e2e suite against whatever `DATABASE_URL` currently resolves to in the shared `.env` (e.g. requiring a `_e2e` suffix in the database name). Whichever is chosen, document it in `docs/TESTING.md` next to the existing warning so it's enforced, not just written down.

**Done when:** running `pnpm test:e2e` locally cannot write to the same database `pnpm dev` uses, either because the config makes it structurally impossible or because a guard refuses to start otherwise.

---

## TD-66 🟡 `UPLOAD_DIR`'s relative default silently splits map-image files from the DB rows referencing them

**Where:** [`app/lib/config/env.ts`](../app/lib/config/env.ts)'s `UPLOAD_DIR` (default `./storage/maps`, per `.env.example`), consumed by [`FilesystemMapImageStore`](../app/lib/storage/FilesystemMapImageStore.ts).

**Why:** `UPLOAD_DIR` is a relative path, resolved against whatever `process.cwd()` happens to be for the process that wrote it — not tied to the repo root or to any other process reading it. `DATABASE_URL` has no such ambiguity (it names a server, not a location on disk), so nothing about running two checkouts of the same repo against one shared Postgres instance warns that map images need the same care.

Hit 2026-08-07: SPEC-004 T3's migration script (`app/seed/migrateWorldTreeT3.ts`) ran from an agent worktree, uploading four map images via `defaultMapImageStore.put()`. The DB rows it created (in the one shared dev database) correctly reference those images' ids — but the actual JPEG bytes landed in the worktree's own `./storage/maps/`, not the maintainer's separate checkout of the same repo. `/dashboard/geography` loaded with no errors (`fetchRootPlace` succeeded — the DB row was fine) but every map image 404'd, because that checkout's `./storage/maps/` was empty. Fixed by hand: copying the four files across.

**Plan:** default `UPLOAD_DIR` to an absolute path outside any checkout (e.g. derived from a fixed location, not `./storage/maps`), so every process on a machine — regardless of which directory it runs from — reads and writes the same files. At minimum, document in `.env.example` that `UPLOAD_DIR` must be identical, and ideally external to, every checkout sharing a `DATABASE_URL`.

**Done when:** running the app (or a migration script) from a second checkout of this repo, pointed at the same `DATABASE_URL`, serves every existing map image with no manual file copy.

---

## TD-67 🟢 "Add to My Places" context-menu label is misleading — it creates any kind, not just a POI

**Where:** [`MapContextMenu.tsx`](../app/modules/maps/components/map/MapContextMenu.tsx)'s `label="Add to My Places"` / `sublabel="Save this location"` menu item — the only entry point into `MapPOIPanel`'s "Add Place" form.

**Why:** found 2026-08-07 verifying SPEC-004 T2/T3's UI end-to-end. Since M5, that one context-menu item opens a form whose first field is a `Kind` selector covering all seven kinds (`region`, `plane`, `city`, `dungeon`, `deity`, `npc`, `poi`) — not just a POI. The label and sublabel both predate M5 and were never updated once the form grew beyond POIs, so a DM reading "Add to My Places / Save this location" has no reason to expect a plane or an NPC pin lives behind it.

**Plan:** rename to something kind-neutral, e.g. "Add Place" / "Create a place here" — matching the form's own heading, which already says "Add Place".

**Done when:** the context-menu item's label and sublabel describe what the form actually does for every kind, not just POI.

---

## TD-68 🟠 `MapPOIPanel`'s Close button is unclickable — a same-`z-index` overlay intercepts the click

**Where:** [`MapPOIPanel.tsx`](../app/modules/maps/components/map/MapPOIPanel.tsx) — the desktop side-panel's close button (`absolute top-4 right-4 z-10`, `aria-label="Close"`) versus the hero-image gradient overlay (`absolute inset-0 bg-gradient-to-t ... z-10`) in the same stacking context.

**Why:** found and reproduced live 2026-08-07. Both elements share `z-10`; per CSS stacking rules a tie resolves by DOM order, and the gradient overlay comes after the button, so it wins and sits on top everywhere the two overlap — including exactly where the close button is. `document.elementFromPoint()` at the button's own center returns the gradient `div`, not the button, confirming every click there is swallowed before it reaches `onClick`. Once open, a DM has no way to close this panel from the button that says "Close" — only navigating away or (on mobile, a separate `Drawer` implementation) swiping down still works.

**Plan:** give the close button a higher `z-index` than the overlay (e.g. `z-20`), or move the overlay behind the button in DOM order. One-line fix; the risk is only in not noticing the _other_ elements sharing `z-10` in this same panel (the "Add"/"Import"/"Export"/"Clear" header buttons, if any share the hero image) — worth a quick pass over the whole header once fixing this.

**Done when:** clicking the visible "Close" (X) button closes the desktop panel every time, verified by a test that simulates a click at the button's actual rendered position (not just calling the handler directly, which would not have caught this).

---

## TD-69 🟠 `poi.linkedType`/`linkedId` has no unique constraint — a second pin per NPC/deity is silently possible

**Where:** [`prisma/schema.prisma`](../prisma/schema.prisma)'s `poi` model — currently `@@index([linkedType, linkedId])`, a plain index.

**Why:** SPEC-004 §6 documents this pair as `@@unique([linkedType, linkedId])` and relies on that guarantee explicitly: "it makes a second pin for the same NPC impossible rather than merely discouraged." The unique constraint was never actually added when M2 built the column — only a lookup index. Found 2026-08-07 by reproducing it directly: creating a `deity` place through `MapPOIPanel` for Elune (already pinned by SPEC-004 T4's migration, `linkedId` 18) succeeded without any error, leaving two `deity` pins for the same record. Deleted by hand after confirming nothing referenced the duplicate.

This is a real data-integrity gap, not just a spec/implementation mismatch on paper: nothing in the app — form validation, the server action, or the database — stops it from recurring for any NPC or deity, silently, indefinitely.

**Plan:** add the unique constraint via a proper migration (`prisma migrate diff` against the live DB per TD-63's hand-apply workaround, or once TD-63 is resolved, a normal `migrate dev`). Audit first: `SELECT "linkedType", "linkedId", count(*) FROM poi WHERE "linkedType" IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1` against the live dev DB, to confirm no other duplicate exists before the constraint would reject one.

**Done when:** the constraint exists in `schema.prisma` and the live DB, and a test proves a second `create` for the same `(linkedType, linkedId)` pair is rejected.

---

## TD-70 🟡 No rendering path exists for `deity`/`npc` pins on the map, even once positioned

**Where:** `app/modules/maps/hooks/` — `usePOIManager.ts` only renders `kind: "poi"` markers (filters `row.kind === "poi"`); `useNavigableChildren.ts` only renders navigable kinds (`region`/`plane`/`city`/`dungeon`) that carry a map. Nothing renders `deity` or `npc` pins.

**Why:** found 2026-08-07 giving Elune (a deity) real coordinates through `MapPOIPanel`'s "Add Place" flow — the row was created successfully (until TD-69's duplicate got cleaned up) with `lat`/`lng` set, but nothing appeared on the map. There is currently no hook, marker layer, or icon set for `deity`/`npc` kinds at all — not a bug in an existing path, an entirely missing one.

This sits next to, but is narrower than, SPEC-004 T4's already-deferred "derive and display location from the tree" (reading a record's place by walking up its pin — see `docs/specs/004-world-model.md` T4). That deferred item is about _computing_ a location to show in the NPC/deity UI; this item is about the map itself never drawing a `deity`/`npc` pin as a marker at all — a DM can give one coordinates (TD-71 aside, once they exist to give), but can never see it on the map to confirm the placement looks right.

**Plan:** a `useLinkedEntityMarkers`-style hook (or extend `useNavigableChildren`'s pattern) that fetches this place's `deity`/`npc` children with non-null coordinates and renders them with their own marker style, distinct from POI category icons and the navigable-kind markers.

**Done when:** a `deity` or `npc` pin with coordinates renders as a clickable marker on its parent's map.

---

## TD-71 🟠 No way to position or edit a place that already exists — only newly-created ones get coordinates

**Where:** `MapPOIPanel.tsx`'s `handleEditMode` (only reachable from `POIListItem`'s `onEdit`, itself only ever fed `kind: "poi"` rows by `usePOIManager`) — the only path in the app that can set or change a place's `lat`/`lng` after creation.

**Why:** found 2026-08-07 while verifying SPEC-004 T3/T4's seeded tree (166 places and pins, all with `null` coordinates by design — "assigned a parent, not yet placed", per §6). There is no UI to give any of them a position: the only way a `region`/`plane`/`city`/`dungeon`/`deity`/`npc` place gets `lat`/`lng` is choosing that kind in "Add Place" _at creation time_, right-clicking the exact spot on the map. Nothing lets a DM select an existing place from the tree and say "place it here" — the closest workaround is deleting and recreating it, which loses everything that made it what it was (a `deity`/`npc`'s `linkedId`, a `region`'s own children underneath it).

This is not a bug introduced by T3/T4 — the gap predates them (M5 was only ever designed around create-time positioning) — but T3/T4 are what expose it: they are the first thing to populate the tree with places nothing can ever position through the UI as it stands today.

**Plan:** a product decision, not just an implementation one — needs deciding where this belongs (a "position" mode reachable from the tree/list view, dragging an existing marker, or something else) before it's built. Flagged in conversation 2026-08-07; not yet designed.

**Done when:** a DM can select any existing place (any kind, not just `poi`) and give it a position on its parent's map, without deleting and recreating it.

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
