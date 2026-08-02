# Technical Debt Register

**Last updated:** 2026-08-02
**Scope:** TD-01 – TD-22 came out of the 2026-07-22 audit; TD-23 onward were found while doing the work, which is why their numbering is chronological rather than thematic. Each item is independently actionable and sized to be completable in one focused session.
**Open items:** TD-38 – TD-41, TD-43, opened 2026-08-01. TD-37 closed 2026-08-02; TD-42 partially done the same day. Every correctness/security item from the original audit is done; what is left is coverage — Phase 2's exit criterion (`docs/ROADMAP.md`) has always required 70% and the suite sits at 31.15% lines. TD-37–TD-43 slice that gap by area, ordered by how delicate the area is (auth/DB bootstrap first, presentation-only code last), matching the risk tiers already defined in `docs/TESTING.md` §2. No feature work — every item below adds tests against existing behaviour, nothing more.

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

| ID    | Title                                                                                             | Severity             | Effort | Phase |
| ----- | ------------------------------------------------------------------------------------------------- | -------------------- | ------ | ----- |
| TD-01 | ✅ Unauthenticated delete endpoints and Server Actions                                            | ~~🔴 Critical~~ done | M      | 1     |
| TD-02 | ✅ No input validation, incl. TD-02b's remaining boundaries                                       | ~~🔴 Critical~~ done | M      | 1–2   |
| TD-03 | ✅ Test suite does not run                                                                        | ~~🔴 Critical~~ done | M      | 1     |
| TD-04 | ✅ TypeScript errors on `tsc --noEmit`                                                            | ~~🔴 Critical~~ done | S      | 1     |
| TD-05 | ✅ No ESLint config, no Prettier, no CI                                                           | ~~🟠 High~~ done     | S      | 1     |
| TD-06 | ✅ Dead code and tutorial leftovers                                                               | ~~🟠 High~~ done     | S      | 1     |
| TD-07 | ✅ `next`/`react` pinned; single lockfile                                                         | ~~🟠 High~~ done     | S      | 1     |
| TD-08 | ✅ Metadata and query layer typed; zero `any`, rule is an error                                   | ~~🟠 High~~ done     | M      | 2     |
| TD-09 | ✅ Quartets collapsed into EntityList / EntityLibrary / EntityForm                                | ~~🟠 High~~ done     | L      | 2     |
| TD-10 | ✅ Toasts (client) vs `logServerIssue` (server) replace the stub                                  | ~~🟠 High~~ done     | M      | 2     |
| TD-11 | ✅ Timestamps + `@@index([nome])`; relations still deferred                                       | ~~🟡 Medium~~ part   | M      | 2     |
| TD-12 | ✅ Filter list declared once; count and rows can no longer diverge                                | ~~🟡 Medium~~ done   | S      | 2     |
| TD-13 | ✅ Typed errors with `cause`; 404 vs 500; toasts via TD-10                                        | ~~🟡 Medium~~ done   | M      | 2     |
| TD-14 | ✅ Map POIs persisted only to `localStorage`                                                      | ~~🟡 Medium~~ done   | M      | 3     |
| TD-15 | ✅ `e2e/a11y.spec.ts` — zero axe violations, keyboard focus ring                                  | ~~🟡 Medium~~ done   | M      | 2     |
| TD-16 | ✅ Inconsistent formatting                                                                        | ~~🟢 Low~~ done      | S      | 1     |
| TD-17 | ✅ README does not match reality                                                                  | ~~🟢 Low~~ done      | S      | 1     |
| TD-18 | ✅ `copy-webpack-plugin` forces webpack over Turbopack                                            | ~~🟢 Low~~ done      | S      | 3     |
| TD-19 | ✅ Mixed Italian/English identifiers (residual set → TD-33)                                       | ~~🟠 High~~ done     | L      | 2     |
| TD-20 | ✅ Every flag on, incl. `noUncheckedIndexedAccess` (`noUnusedLocals` rejected)                    | ~~🟡 Medium~~ done   | M      | 2     |
| TD-21 | ✅ UI strings hardcoded; app must ship in it + en                                                 | ~~🟠 High~~ done     | L      | 2     |
| TD-22 | ✅ Lint warnings 293 → 0; every rule back to `error`                                              | ~~🟠 High~~ done     | M      | 2     |
| TD-23 | ✅ Migration drift patched forward; migrations match the schema                                   | ~~🟠 High~~ done     | S      | 1     |
| TD-24 | ✅ Playwright harness + specs; `e2e` job blocking in CI                                           | ~~🟠 High~~ done     | M      | 1     |
| TD-25 | ✅ Startup reachability check; 503 distinct from 500                                              | ~~🟡 Medium~~ done   | S      | 2     |
| TD-26 | ✅ `sottoclassi` / `circolo` duplication resolved                                                 | ~~🟡 Medium~~ done   | S      | 2     |
| TD-27 | ✅ Hidden `classi=0` filter on the spells list removed                                            | ~~🟠 High~~ done     | S      | 2     |
| TD-28 | ✅ Seed ids removed; the database assigns them, as the UI does                                    | ~~🟠 High~~ done     | S      | 2     |
| TD-29 | ✅ Loading skeleton was the tutorial's invoices table                                             | ~~🟡 Medium~~ done   | S      | 2     |
| TD-30 | ✅ Public list pages actually stream; skeleton matches the content                                | ~~🟡 Medium~~ done   | S      | 2     |
| TD-31 | ✅ `sortSelectOptions` mutated shared `PageMeta.options` in place                                 | ~~🟡 Medium~~ done   | S      | 2     |
| TD-32 | ✅ E2E job spent 9m a run on `playwright install-deps`                                            | ~~🟠 High~~ done     | S      | 1     |
| TD-33 | ✅ Italian identifiers TD-19 missed — 16 across 14 files + a directory                            | ~~🟡 Medium~~ done   | S      | 2     |
| TD-34 | ✅ CI actions pinned to a deprecated Node 20 runtime; Node 22 → 24                                | ~~🟢 Low~~ done      | S      | 2     |
| TD-35 | ✅ E2E specs assert hardcoded Italian copy instead of reading the catalogue                       | ~~🟡 Medium~~ done   | M      | 2     |
| TD-36 | ✅ `proxy.ts` matcher let `.jpg` through the auth/i18n gate, breaking map tiles                   | ~~🟠 High~~ done     | S      | 2     |
| TD-37 | ✅ `authenticate()` and `app/lib/connections/**` are 0% covered — the login and DB-bootstrap path | ~~🟠 High~~ done     | S      | 2     |
| TD-38 | `fetch*`/`get*Count` untested for deities, magicitems, npc — data layer at 51%, target 90%        | 🟠 High              | S      | 2     |
| TD-39 | Pure functions in `app/lib/utils/**` at 51%, target 95% — cheapest real coverage in the project   | 🟡 Medium            | S      | 2     |
| TD-40 | Metadata correctness untested — `npcMeta`/`deityMeta` at 14%/25%, target 80%                      | 🟡 Medium            | S      | 2     |
| TD-41 | `app/lib/hooks/**` at 52%, target 70% — `useFilterController` entirely untested                   | 🟡 Medium            | S      | 2     |
| TD-42 | ◑ `app/ui/**` behaviour untested — domain forms/cards/libraries at ~0%, target 60%                | 🟢 Low               | L      | 2     |
| TD-43 | `app/modules/maps/**` geometry and hooks near 0%, target 50%                                      | 🟢 Low               | M      | 2     |

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

### TD-38 🟠 Data-layer `fetch*`/`get*Count` untested for deities, magicitems, npc

**Where:** `app/lib/data/deities/{fetchFilteredDeities,getDeitiesCount,deleteDeityById}.ts` and the equivalent triplets under `app/lib/data/magicitems/` and `app/lib/data/npc/` — all at 0%. `app/lib/data/spells/getSpellsCount.ts` is the one outlier that's also 0%; everything else in `spells` is covered.

**Why:** `app/lib/data/**` is the project's own stated highest-value tier (90% target, "the risky part" per `docs/TESTING.md` §2) and sits at 83% today only because these four domains' count/fetch functions were never included when `getQuery.test.ts` and the mutation suites were written — `getQuery.ts` itself (the shared query builder all four call into) is already at 91%. This isn't four new test strategies, it's the existing `fetchFilteredSpells`/`getSpellsCount` pattern applied to three more domains that use the identical shape.

**Plan:** mirror `app/lib/data/spells/fetchFilteredSpells.test.ts` for the three missing domains — same mocked-Prisma approach already proven there. `deleteDeityById`/`deleteMagicItemById`/`deleteNpcById` need the same "throws without a session" case `mutationGuards.test.ts` already asserts for every `create*`/`update*`.

**Done when:** `app/lib/data/**` reads ≥90% lines in the coverage report, matching `docs/TESTING.md` §2's target.

---

### TD-39 🟡 Pure functions in `app/lib/utils/**` at 51%, cheapest real coverage available

**Where:** `filterByMeta.ts`, `getPagination.ts`, `getSearchParam.ts`, `cssColorClass.ts` — all 0%; `isArrayEmpty.ts`/`isObjectArray.ts`/`isStringArray.ts` at 0–50%; `sortByField` at 80%.

**Why:** `docs/TESTING.md` §2 sets this tier's target at 95% precisely because these are "trivial to cover" — no I/O, no mocking, table-driven `it.each` the way `isValidString`/`isNumberArray` already are. It's the highest coverage-per-hour in the register; the only reason it's ranked below TD-37/TD-38 is that pure-function bugs here are lower-stakes than an unverified auth path or query builder.

**Plan:** table-driven tests per function, same shape as the existing validator suites — empty input, single item, malformed input, the documented edge case in each function's own comment (e.g. `filterByMeta`'s handling of a filter key not present in the metadata).

**Done when:** `app/lib/utils/**` reads ≥95% lines.

---

### TD-40 🟡 Metadata correctness untested — `npcMeta` 14%, `deityMeta` 25%

**Where:** `app/lib/config/npc/npcMeta.ts` (14.28%), `app/lib/config/deity/deityMeta.ts` (25%), `app/lib/config/spells/SpellsMeta.ts` (50%), `pageMetaFields.ts` (60%).

**Why:** the metadata layer is "the core abstraction" per `CLAUDE.md` — every field declared here drives form rendering, list columns, filters and query construction in one place, which is exactly why a wrong declaration is high-blast-radius and exactly why `docs/TESTING.md` §2 sets an 80% target here despite this being declarative data, not logic. `getQuery.test.ts` already covers the query builder that _consumes_ this data; nothing asserts the declarations themselves — that every field has a matching `validator`, that `getDatum` returns what the type says, that option lists used as `defaultValue: list[0].value` are non-empty (the exact class of bug `firstOptionValue.ts` was written to prevent, per TD-20b's write-up in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)).

**Plan:** one test per domain metadata file asserting structural invariants across every declared field (validator present and matches the field's type, `getDatum` doesn't throw on a representative row, filterable fields appear in the filter list) rather than one test per field — the failure mode this guards against is a missing or wrong declaration, not a specific field's behaviour.

**Done when:** `app/lib/config/**` reads ≥80% lines.

---

### TD-41 🟡 `app/lib/hooks/**` at 52% — `useFilterController` entirely untested

**Where:** `app/lib/hooks/useFilterController.ts` (0%); `usePageManager.ts` is already at 92%, the pattern to follow.

**Why:** filter state is what the URL round-trips through `getQuery.ts` — a bug here produces a filter UI that silently shows the wrong count or the wrong rows, the same failure class `getQuery.test.ts`'s own top-billing ("the highest-value unit tests in the project") exists to catch on the query side. The hook that drives it from the client has no equivalent.

**Plan:** `@testing-library/react`'s `renderHook`, the same tooling already in the dev dependencies for component tests (see TD-42). Cover add/remove/clear-filter transitions and that the hook's output shape matches what `getQuery.ts` expects as input, so a future change to one side is caught by the other's tests.

**Done when:** `app/lib/hooks/**` reads ≥70% lines.

---

### TD-42 ◑ `app/ui/**` behaviour untested — domain forms/cards/libraries near 0%

**Progress (2026-08-02):** the shared form machinery is covered, following exactly the "prioritize the TD-09 shells first" plan below — `EntityForm.tsx` (9 tests: create vs. edit mode, the `disableUntilEdited` gate, submit calling `create`/`update` with the right payload shape, field errors surfacing and blocking `onSaveFinished`), `PageForm.tsx` (10 tests: save vs. delete mode, button enablement, `isSaving` copy), and all of `app/ui/forms/inputs/` — `TextInput`, `TextareaInput`, `CheckboxInput`, `FormLabel`, `InputComponent` (which resolves a real `MetaConfigKey` against live `pageMetaFields` config to the right control, rather than a fake registry). Statements coverage moved 27.4% → 29.75%, branches 19.67% → 24.4%. `EntityList`/`EntityLibrary` and the per-domain `*Card.tsx`/`*Form.tsx` wrappers remain open — this item is not done, both TD-09 shells named in "done when" are still outstanding.

**Where:** effectively all of `app/ui/{deities,npc,magicitems,spells}/`, `app/ui/components/` (`EntityList`, `EntityLibrary`, `Modal`, `pagination`), `app/ui/buttons/`. `Select` (91%), `BaseButton/getCSSClasses` (100%) and `app/ui/forms/` (above) are now covered — the pattern to extend, not a green field.

**Why last:** `docs/TESTING.md` §2 sets this tier's target lowest among app code (60%, "behaviour, not markup") and is explicit that this is supporting cast, not one of the four things a reviewer pokes at. It's also the largest single surface in the register (this is why it's sized L, not S) — TD-09 already collapsed four duplicated component quartets into `EntityList`/`EntityLibrary`/`EntityForm`, so most of this domain-specific 0% is actually the same three generic components rendered four times, and testing the generic shell once covers most of the gap rather than requiring 16 separate suites.

**Plan:** Testing Library, user-facing queries (`getByRole`, `getByLabelText`) not snapshot tests, per `docs/TESTING.md`'s existing stance. Prioritize `EntityForm`/`EntityList`/`EntityLibrary` (the TD-09 shells, highest leverage) before the thin per-domain `*Card.tsx`/`*Form.tsx` wrappers around them. Skip pure-markup components with no logic (e.g. `PageTitle.tsx`) — coverage there would be padding, not verification, exactly what `docs/TESTING.md` §2 warns against chasing.

**Done when:** `app/ui/**` reads ≥60% lines, with `EntityForm`/`EntityList`/`EntityLibrary` individually above that bar.

---

### TD-43 🟢 `app/modules/maps/**` geometry and hooks near 0%

**Where:** `app/modules/maps/lib/utils/{coordinates,maps,validation}.ts` (all 0%) — these are the same twenty sites TD-20b's write-up names as the reason `noUncheckedIndexedAccess` initially couldn't be verified safe by test; TD-20b shipped anyway with documented non-null assertions instead, so this item is not blocking anything, it is closing the gap TD-20b left on the table. Also `app/modules/maps/hooks/` at 20% (`useMeasurement`, `useMapMarkers`, `useContextMenu`, `useMapControls` all 0%) and `app/modules/maps/components/map/**` (0%, Leaflet rendering).

**Why last:** `docs/TESTING.md` §2 sets this tier's target lowest in the whole project (50%) and says why — "Leaflet is hard to test headlessly; cover hooks and utils, not rendering." `CLAUDE.md`'s "Decisions and rejected approaches" also flags this module as partly-vendored, partly-unwired-by-design scaffolding (`WorldMap.tsx`'s unused imports are deliberate) — a blanket coverage push here risks writing tests that lock in scaffolding as if it were finished behaviour, which is not this item's job.

**Plan:** `coordinates.ts`/`maps.ts`/`validation.ts` are pure geometry functions despite living in the maps module — test them exactly like TD-39's utils, table-driven, no Leaflet needed. `useMeasurement`/`useMapMarkers`/`useContextMenu`/`useMapControls` are plain hooks and take `renderHook`, same as TD-41. **Explicitly out of scope:** rendering `LeafletMap.tsx`/`MapMarker.tsx`/`MapContextMenu.tsx` themselves — `docs/TESTING.md` already routes that coverage through Playwright's `e2e/map.spec.ts`, not Vitest, and TD-36 is the live example of why a rendering assertion in Vitest wouldn't have caught the real bug anyway (it was a middleware routing issue, invisible to a component test).

**Done when:** `app/modules/maps/lib/utils/**` and `app/modules/maps/hooks/**` (excluding `components/`) read ≥50% lines.

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
```

**Maintenance note (2026-07-30).** This block had drifted badly: it carried ✅ on 9
items when 21 were done, which made it read as "Phase 2 has barely started" while
the summary table at the top of this file — which is accurate, and is the one to
trust — showed the opposite. Two documents disagreeing about what is finished is
worse than either being merely out of date, because the reader cannot tell which
to believe. If you close an item, tick it in **both** places or delete this block.

The ordering is not arbitrary: each step makes the next one cheaper or safer. In particular, do not attempt TD-09 before TD-08, do not attempt TD-01/TD-02 before TD-03 (you want a working test suite before you touch security-critical code), and do not attempt TD-24 before TD-01/TD-02 — the E2E specs assert auth and validation flows those two items create.
