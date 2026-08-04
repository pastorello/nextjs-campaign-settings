# Technical Debt Register

**Last updated:** 2026-08-04
**Scope:** TD-01 – TD-22 came out of the 2026-07-22 audit; TD-23 onward were found while doing the work, which is why their numbering is chronological rather than thematic. Each item is independently actionable and sized to be completable in one focused session.
**Open items:** TD-46 only. TD-44 (2026-08-02) found `coverage.all: true` changed nothing, confirming the 50.68%-lines baseline rather than correcting it, and produced two properly scoped gaps: TD-45 (page-level route components) and TD-46 (`app/modules/maps/components/**` Leaflet rendering, routed through e2e by design). TD-45 closed 2026-08-04: 10 new test files, one per repeated shape rather than per domain, brought the suite to 54.51% lines / 48.92% branches (682 → 709 tests). Every correctness/security item from the original audit is done, and the TD-37–TD-43 coverage sweep's own per-tier targets are all met — the suite as a whole is still short of Phase 2's 70% exit criterion (`docs/ROADMAP.md`); TD-46 is what is left to close that gap, and is itself a multi-session e2e effort. Sub-slices closed 2026-08-04: POI panel CRUD, measurement (distance mode). Search/filtering turned out to target unreachable UI (`MapSearchBar` is commented out of `WorldMap.tsx`) and is blocked on a product decision rather than scheduled.

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

| ID    | Title                                                                                                  | Severity             | Effort | Phase |
| ----- | ------------------------------------------------------------------------------------------------------ | -------------------- | ------ | ----- |
| TD-01 | ✅ Unauthenticated delete endpoints and Server Actions                                                 | ~~🔴 Critical~~ done | M      | 1     |
| TD-02 | ✅ No input validation, incl. TD-02b's remaining boundaries                                            | ~~🔴 Critical~~ done | M      | 1–2   |
| TD-03 | ✅ Test suite does not run                                                                             | ~~🔴 Critical~~ done | M      | 1     |
| TD-04 | ✅ TypeScript errors on `tsc --noEmit`                                                                 | ~~🔴 Critical~~ done | S      | 1     |
| TD-05 | ✅ No ESLint config, no Prettier, no CI                                                                | ~~🟠 High~~ done     | S      | 1     |
| TD-06 | ✅ Dead code and tutorial leftovers                                                                    | ~~🟠 High~~ done     | S      | 1     |
| TD-07 | ✅ `next`/`react` pinned; single lockfile                                                              | ~~🟠 High~~ done     | S      | 1     |
| TD-08 | ✅ Metadata and query layer typed; zero `any`, rule is an error                                        | ~~🟠 High~~ done     | M      | 2     |
| TD-09 | ✅ Quartets collapsed into EntityList / EntityLibrary / EntityForm                                     | ~~🟠 High~~ done     | L      | 2     |
| TD-10 | ✅ Toasts (client) vs `logServerIssue` (server) replace the stub                                       | ~~🟠 High~~ done     | M      | 2     |
| TD-11 | ✅ Timestamps + `@@index([nome])`; relations still deferred                                            | ~~🟡 Medium~~ part   | M      | 2     |
| TD-12 | ✅ Filter list declared once; count and rows can no longer diverge                                     | ~~🟡 Medium~~ done   | S      | 2     |
| TD-13 | ✅ Typed errors with `cause`; 404 vs 500; toasts via TD-10                                             | ~~🟡 Medium~~ done   | M      | 2     |
| TD-14 | ✅ Map POIs persisted only to `localStorage`                                                           | ~~🟡 Medium~~ done   | M      | 3     |
| TD-15 | ✅ `e2e/a11y.spec.ts` — zero axe violations, keyboard focus ring                                       | ~~🟡 Medium~~ done   | M      | 2     |
| TD-16 | ✅ Inconsistent formatting                                                                             | ~~🟢 Low~~ done      | S      | 1     |
| TD-17 | ✅ README does not match reality                                                                       | ~~🟢 Low~~ done      | S      | 1     |
| TD-18 | ✅ `copy-webpack-plugin` forces webpack over Turbopack                                                 | ~~🟢 Low~~ done      | S      | 3     |
| TD-19 | ✅ Mixed Italian/English identifiers (residual set → TD-33)                                            | ~~🟠 High~~ done     | L      | 2     |
| TD-20 | ✅ Every flag on, incl. `noUncheckedIndexedAccess` (`noUnusedLocals` rejected)                         | ~~🟡 Medium~~ done   | M      | 2     |
| TD-21 | ✅ UI strings hardcoded; app must ship in it + en                                                      | ~~🟠 High~~ done     | L      | 2     |
| TD-22 | ✅ Lint warnings 293 → 0; every rule back to `error`                                                   | ~~🟠 High~~ done     | M      | 2     |
| TD-23 | ✅ Migration drift patched forward; migrations match the schema                                        | ~~🟠 High~~ done     | S      | 1     |
| TD-24 | ✅ Playwright harness + specs; `e2e` job blocking in CI                                                | ~~🟠 High~~ done     | M      | 1     |
| TD-25 | ✅ Startup reachability check; 503 distinct from 500                                                   | ~~🟡 Medium~~ done   | S      | 2     |
| TD-26 | ✅ `sottoclassi` / `circolo` duplication resolved                                                      | ~~🟡 Medium~~ done   | S      | 2     |
| TD-27 | ✅ Hidden `classi=0` filter on the spells list removed                                                 | ~~🟠 High~~ done     | S      | 2     |
| TD-28 | ✅ Seed ids removed; the database assigns them, as the UI does                                         | ~~🟠 High~~ done     | S      | 2     |
| TD-29 | ✅ Loading skeleton was the tutorial's invoices table                                                  | ~~🟡 Medium~~ done   | S      | 2     |
| TD-30 | ✅ Public list pages actually stream; skeleton matches the content                                     | ~~🟡 Medium~~ done   | S      | 2     |
| TD-31 | ✅ `sortSelectOptions` mutated shared `PageMeta.options` in place                                      | ~~🟡 Medium~~ done   | S      | 2     |
| TD-32 | ✅ E2E job spent 9m a run on `playwright install-deps`                                                 | ~~🟠 High~~ done     | S      | 1     |
| TD-33 | ✅ Italian identifiers TD-19 missed — 16 across 14 files + a directory                                 | ~~🟡 Medium~~ done   | S      | 2     |
| TD-34 | ✅ CI actions pinned to a deprecated Node 20 runtime; Node 22 → 24                                     | ~~🟢 Low~~ done      | S      | 2     |
| TD-35 | ✅ E2E specs assert hardcoded Italian copy instead of reading the catalogue                            | ~~🟡 Medium~~ done   | M      | 2     |
| TD-36 | ✅ `proxy.ts` matcher let `.jpg` through the auth/i18n gate, breaking map tiles                        | ~~🟠 High~~ done     | S      | 2     |
| TD-37 | ✅ `authenticate()` and `app/lib/connections/**` are 0% covered — the login and DB-bootstrap path      | ~~🟠 High~~ done     | S      | 2     |
| TD-38 | ✅ `fetch*`/`get*Count` untested for deities, magicitems, npc — data layer at 51%, target 90%          | ~~🟠 High~~ done     | S      | 2     |
| TD-39 | ✅ Pure functions in `app/lib/utils/**` at 51%, target 95% — cheapest real coverage in the project     | ~~🟡 Medium~~ done   | S      | 2     |
| TD-40 | ✅ Metadata correctness untested — `npcMeta`/`deityMeta` at 14%/25%, target 80%                        | ~~🟡 Medium~~ done   | S      | 2     |
| TD-41 | ✅ `app/lib/hooks/**` at 52%, target 70% — `useFilterController` entirely untested                     | ~~🟡 Medium~~ done   | S      | 2     |
| TD-42 | ✅ `app/ui/**` behaviour untested — domain forms/cards/libraries at ~0%, target 60%                    | ~~🟢 Low~~ done      | L      | 2     |
| TD-43 | ✅ `app/modules/maps/**` geometry and hooks near 0%, target 50%                                        | ~~🟢 Low~~ done      | M      | 2     |
| TD-44 | ✅ Re-measured coverage with `coverage.all: true`; re-scoped the 70% gap as TD-45/TD-46                | ~~🟡 Medium~~ done   | S      | 2     |
| TD-45 | ✅ Page-level route components (`app/[locale]/dashboard/**`, `app/ui/geography`) covered               | ~~🟡 Medium~~ done   | M      | 2     |
| TD-46 | `app/modules/maps/components/**` (Leaflet rendering, 737 lines) — e2e, not Vitest; 2/4 sub-slices done | 🟡 Medium            | L      | 2     |

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
- `WorldMap.test.tsx` — the component's own state machine (image-overlay bootstrap effect, POI-location-selection flow, export/import), with its six child map components and five hooks stubbed since each already has its own suite (`app/modules/maps/hooks/*.test.ts`). Not exhaustive — several props (`selectedCountry`, the measurement panel) have no wired UI trigger yet per the "unused is not dead" note in `CLAUDE.md`, and stayed untested for the same reason.

### TD-46 🟡 `app/modules/maps/components/**` (Leaflet rendering) has 0% Vitest coverage by design — needs e2e instead

**Where:** `app/modules/maps/components/map/` — `LeafletMap.tsx`, `MapMarker.tsx`, `MapContextMenu.tsx`, `MapPOIPanel.tsx`, `MapSearchBar.tsx`, `MapMain.tsx`, `MapControls.tsx`, `MapDetailsPanel.tsx`, `MapMeasurementPanel.tsx`, and smaller supporting components. 19 files, 737 lines, 0% covered.

**Why:** `docs/TESTING.md` already routes Leaflet rendering coverage through `e2e/map.spec.ts` rather than Vitest — jsdom can't meaningfully render a Leaflet map, and TD-36's bug (a middleware routing issue) is the standing example of a rendering assertion in Vitest not being where this class of bug actually shows up. This is by far the largest coverage gap left in the codebase — 737 lines is more than the two other items combined — and closing it is e2e work, a different risk profile and skill from the unit/hook work TD-37–46 have otherwise been.

**Plan:** audit what `e2e/map.spec.ts` currently exercises against this component list; most likely it covers a handful of the top-level interactions (placing a POI, opening a marker) and leaves panels, search, and measurement unexercised. Size this as its own multi-session e2e expansion, not a single item — `CLAUDE.md`'s guidance to keep items completable in one session applies to sub-slices of this (e.g. "POI panel CRUD via e2e", "measurement via e2e"), not to "cover the whole maps module" as one unit.

**Audit and sub-slices (2026-08-04).** What e2e already exercised before this work, against the component list above:

- `map.spec.ts` — map mount/artwork, world switching, and the right-click context menu opening with its three items visible. Doesn't drive any menu item to completion.
- `map-poi-link.spec.ts` (pre-existing, previously missing from `docs/TESTING.md` §"E2E — Playwright") — the "Add to My Places" → linked-entity flow end to end, including the popup's "View NPC" link. Doesn't cover edit, delete, or an unlinked POI.

Sub-slices closed or attempted since:

1. ✅ **POI panel CRUD** — add an unlinked POI → list → edit → delete → gone (`e2e/map-poi-crud.spec.ts`). Complements `map-poi-link.spec.ts`.
2. ❌ **Map search/filtering — abandoned, not a coverage gap.** `MapSearchBar` (country search, the search-triggered "My Places" and "Measure" entry points) is entirely commented out in `app/ui/geography/WorldMap.tsx` — the same "unused is not dead" MVP gap `map-poi-link.spec.ts`'s own comment already documents for the search-bar POI entry point, just not previously generalised to the whole component. A user cannot reach it today, so there is nothing here for an e2e spec to exercise without first wiring the component up — a feature decision, not a test-coverage one, and out of scope for a hardening-phase item. Do not re-attempt this sub-slice until `MapSearchBar` is deliberately wired into `WorldMap.tsx` under its own item.
3. ✅ **Measurement** — distance mode from the context menu's "Measure" item: select the mode, place points, watch the running distance, finish, close (`e2e/map-measurement.spec.ts`). Area mode not covered — same UI, would assert the same shape.
4. Tile/theme switching and remaining controls — also not currently wired into `WorldMap.tsx` (`MapTileSwitcher`/`MapThemeSwitcher` have no importer there; only `MapControls` — zoom/reset/fullscreen — is live). Re-scope or drop once that's confirmed either way; don't file it as before assuming it's reachable.

**Done when:** either a concrete e2e coverage target is set and met for this component tree, or — if headless Leaflet rendering coverage is judged not worth the e2e investment — `docs/TESTING.md` §2 is updated to say so explicitly, so the 0% reads as a documented decision rather than an open gap the next session re-discovers. Sub-slices 1 and 3 are closed; 2 is blocked on a product decision, not scheduled; 4 needs the same reachability check before it's attempted. Do not re-file any of these as new TD numbers.
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
