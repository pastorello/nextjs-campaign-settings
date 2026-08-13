# Technical Debt Register

**Last updated:** 2026-08-13
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**Open items: TD-78.** Everything else in the summary table is closed.

**Scope note.** TD-01 – TD-22 came out of the 2026-07-22 audit; TD-23 onward were found while doing the work, which is why the numbering is chronological rather than thematic. Each item is sized to be completable in one focused session.

**TD-47 – TD-57 and TD-60 have no write-up here, and that is not an oversight to fix.** Three different situations, verified 2026-08-08:

- **TD-47 – TD-55: nothing to transcribe.** A 2026-08-06 merge commit ("docs: record TD-47 – TD-57 from the 2026-08-04 audit pass", PR #80) claimed to record them; its actual diff added only `.env.example` and `dependabot.yml`. No PR, commit or doc anywhere in this repo's history says what these nine were about — most likely an external audit session (a Cowork pass, per `CLAUDE.md`'s "Bringing research into the codebase") whose findings were never committed.
- **TD-56 and TD-57 shipped as code but never got an entry.** They are the `.env.example` and `dependabot.yml` work in that same PR. The fixes are live; only the register entry is missing, and reconstructing one after the fact would be a guess.
- **TD-60 was never claimed by anything** — a skipped number.

**Do not re-litigate any of this by writing entries**, and do not reuse these IDs for new items; skip to the next free number, so a rediscovered write-up (if one ever surfaces) has an unambiguous home.

---

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
| TD-61 | ✅ Option-backed `Int` fields accept any number; an out-of-list value renders as a blank cell               | ~~🟠 High~~ done     | S      | 3     |
| TD-62 | ✅ POI category names are hardcoded English and reach the UI — a TD-21 leftover                             | ~~🟢 Low~~ done      | S      | 3     |
| TD-63 | ✅ Local dev DB's migration history had a gap `migrate dev`/`migrate deploy` couldn't get past              | ~~🟡 Medium~~ done   | S      | 3     |
| TD-64 | ✅ `WorldMap.tsx`'s async-effect map-loading pattern trips `react-hooks/set-state-in-effect`                | ~~🟢 Low~~ done      | S      | 3     |
| TD-65 | ✅ `DATABASE_URL` in this dev environment isn't a throwaway DB — e2e debris landed in real data             | ~~🟡 Medium~~ done   | S      | 3     |
| TD-66 | ✅ `UPLOAD_DIR`'s relative default silently splits map-image files from the DB rows referencing them        | ~~🟡 Medium~~ done   | S      | 3     |
| TD-67 | ✅ "Add to My Places" context-menu label is misleading — it creates any kind, not just a POI                | ~~🟢 Low~~ done      | S      | 3     |
| TD-68 | ✅ `MapPOIPanel`'s Close button is unclickable — a same-`z-index` overlay intercepts the click              | ~~🟠 High~~ done     | S      | 3     |
| TD-69 | ✅ `poi.linkedType`/`linkedId` has no unique constraint — a second pin per NPC/deity is silently possible   | ~~🟠 High~~ done     | S      | 3     |
| TD-70 | ✅ No rendering path exists for `deity`/`npc` pins on the map, even once positioned                         | ~~🟡 Medium~~ done   | M      | 3     |
| TD-71 | ✅ No way to position or edit a place that already exists — only newly-created ones get coordinates         | ~~🟠 High~~ done     | L      | 3     |
| TD-72 | ✅ `usePOIManager.ts`/`useNavigableChildren.ts` marker HTML uses inline `style`, not Tailwind classes       | ~~🟢 Low~~ done      | S      | 3     |
| TD-73 | ✅ `.env.test.example`'s documented e2e setup (`prisma db push`) leaves a fresh DB unable to seed           | ~~🟡 Medium~~ done   | S      | 3     |
| TD-74 | ✅ `pageMetaFields` spread four domain metas into one flat object — a name collision silently discarded one | ~~🟡 Medium~~ done   | S      | 3     |
| TD-75 | ✅ `pnpm test` fails on a clean checkout — one suite needs a `DATABASE_URL` that only CI provides           | ~~🟡 Medium~~ done   | S      | 3     |
| TD-76 | ✅ `renderRichText` injects stored text as raw HTML with no sanitisation                                    | ~~🟡 Medium~~ done   | S      | 3     |
| TD-77 | ✅ An entity's location is resolved through two unreconciled read paths                                     | ~~🟡 Medium~~ done   | S      | 3     |
| TD-78 | The NPC admin list lost its Fazione column filter when the field went table-backed                          | 🟢 Low               | M      | 3     |

---

---

## Closed items — TD-01 through TD-77

Everything the 2026-07-22 audit found, plus everything found while doing the work through 2026-08-13, is closed: correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness, the coverage sweep that crossed Phase 2's 70% gate, the whole SPEC-004 map/world-tree run, the clean-checkout `pnpm test` gap, the metadata layer's unguarded field-name collision, description fields rendering as unsanitised HTML, and the entity-location read path duplication. The summary table above is the current status of each.

**Each item's full write-up — what was found, why, the fix — is in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)**, moved there in four passes (TD-01–TD-36 on 2026-08-01, TD-37–TD-75 on 2026-08-08, TD-76 on 2026-08-13, TD-77 on 2026-08-13). Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

---

## Open items

### TD-78 — The NPC admin list lost its Fazione column filter when the field went table-backed

**Severity:** 🟢 Low · **Effort:** M · **Found:** 2026-08-10, while building [SPEC-006](./specs/006-factions.md) T7

Before SPEC-006, `npcMeta.faction` was a static option list, and the NPC admin
list's Fazione column got a working filter dropdown for free from
`SortableHeader`'s built-in mechanism (`fieldMeta[fieldKey].options`). T7
switched the field to `optionTable: "faction"` — rows in a table, not a static
list — and `SortableHeader` has no equivalent for that: it reads
`PageMeta.options` directly, which a table-backed field never declares. The
column degrades to sort-only rather than throwing (`isFiltrable: false`,
correct defensive behaviour), but that is a real capability the DM had before
this spec and does not have after it: filtering NPCs by faction from the admin
list header no longer works.

**Same shape as SPEC-008's "Location" column**, which needed its own bespoke
`LocationFilterControl` for exactly this reason — a dynamic, async-resolved
list `SortableHeader`'s static shape can't express. A real fix here is that
same size of work: a `FactionFilterControl` (or a generalisation of
`LocationFilterControl`) fed by `fetchFieldOptions("faction")`.

**Not filed as a blocker.** Nothing in SPEC-006's user stories asked for
faction filtering on the admin list, and building it without being asked is
exactly what SPEC-006 §3 and its own §9 open question 2 warn against. Pick
this up if the DM asks for it back, not before.
