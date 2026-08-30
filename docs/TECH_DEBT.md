# Technical Debt Register

**Last updated:** 2026-08-27
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**Open items: TD-78, TD-79, TD-82, TD-97, TD-98, TD-99, TD-100, TD-104, TD-105.** Everything else in the summary table is closed. TD-85 and TD-96 were the two `part` items — shipped in half, with the remainder deferred to SPEC-016's popover; both closed on 2026-08-27 with T7–T9, so their write-ups have moved to the archive with the rest.

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

| ID     | Title                                                                                                           | Severity             | Effort | Phase |
| ------ | --------------------------------------------------------------------------------------------------------------- | -------------------- | ------ | ----- |
| TD-01  | ✅ Unauthenticated delete endpoints and Server Actions                                                          | ~~🔴 Critical~~ done | M      | 1     |
| TD-02  | ✅ No input validation, incl. TD-02b's remaining boundaries                                                     | ~~🔴 Critical~~ done | M      | 1–2   |
| TD-03  | ✅ Test suite does not run                                                                                      | ~~🔴 Critical~~ done | M      | 1     |
| TD-04  | ✅ TypeScript errors on `tsc --noEmit`                                                                          | ~~🔴 Critical~~ done | S      | 1     |
| TD-05  | ✅ No ESLint config, no Prettier, no CI                                                                         | ~~🟠 High~~ done     | S      | 1     |
| TD-06  | ✅ Dead code and tutorial leftovers                                                                             | ~~🟠 High~~ done     | S      | 1     |
| TD-07  | ✅ `next`/`react` pinned; single lockfile                                                                       | ~~🟠 High~~ done     | S      | 1     |
| TD-08  | ✅ Metadata and query layer typed; zero `any`, rule is an error                                                 | ~~🟠 High~~ done     | M      | 2     |
| TD-09  | ✅ Quartets collapsed into EntityList / EntityLibrary / EntityForm                                              | ~~🟠 High~~ done     | L      | 2     |
| TD-10  | ✅ Toasts (client) vs `logServerIssue` (server) replace the stub                                                | ~~🟠 High~~ done     | M      | 2     |
| TD-11  | ✅ Timestamps + `@@index([nome])`; relations still deferred                                                     | ~~🟡 Medium~~ part   | M      | 2     |
| TD-12  | ✅ Filter list declared once; count and rows can no longer diverge                                              | ~~🟡 Medium~~ done   | S      | 2     |
| TD-13  | ✅ Typed errors with `cause`; 404 vs 500; toasts via TD-10                                                      | ~~🟡 Medium~~ done   | M      | 2     |
| TD-14  | ✅ Map POIs persisted only to `localStorage`                                                                    | ~~🟡 Medium~~ done   | M      | 3     |
| TD-15  | ✅ `e2e/a11y.spec.ts` — zero axe violations, keyboard focus ring                                                | ~~🟡 Medium~~ done   | M      | 2     |
| TD-16  | ✅ Inconsistent formatting                                                                                      | ~~🟢 Low~~ done      | S      | 1     |
| TD-17  | ✅ README does not match reality                                                                                | ~~🟢 Low~~ done      | S      | 1     |
| TD-18  | ✅ `copy-webpack-plugin` forces webpack over Turbopack                                                          | ~~🟢 Low~~ done      | S      | 3     |
| TD-19  | ✅ Mixed Italian/English identifiers (residual set → TD-33)                                                     | ~~🟠 High~~ done     | L      | 2     |
| TD-20  | ✅ Every flag on, incl. `noUncheckedIndexedAccess` (`noUnusedLocals` rejected)                                  | ~~🟡 Medium~~ done   | M      | 2     |
| TD-21  | ✅ UI strings hardcoded; app must ship in it + en                                                               | ~~🟠 High~~ done     | L      | 2     |
| TD-22  | ✅ Lint warnings 293 → 0; every rule back to `error`                                                            | ~~🟠 High~~ done     | M      | 2     |
| TD-23  | ✅ Migration drift patched forward; migrations match the schema                                                 | ~~🟠 High~~ done     | S      | 1     |
| TD-24  | ✅ Playwright harness + specs; `e2e` job blocking in CI                                                         | ~~🟠 High~~ done     | M      | 1     |
| TD-25  | ✅ Startup reachability check; 503 distinct from 500                                                            | ~~🟡 Medium~~ done   | S      | 2     |
| TD-26  | ✅ `sottoclassi` / `circolo` duplication resolved                                                               | ~~🟡 Medium~~ done   | S      | 2     |
| TD-27  | ✅ Hidden `classi=0` filter on the spells list removed                                                          | ~~🟠 High~~ done     | S      | 2     |
| TD-28  | ✅ Seed ids removed; the database assigns them, as the UI does                                                  | ~~🟠 High~~ done     | S      | 2     |
| TD-29  | ✅ Loading skeleton was the tutorial's invoices table                                                           | ~~🟡 Medium~~ done   | S      | 2     |
| TD-30  | ✅ Public list pages actually stream; skeleton matches the content                                              | ~~🟡 Medium~~ done   | S      | 2     |
| TD-31  | ✅ `sortSelectOptions` mutated shared `PageMeta.options` in place                                               | ~~🟡 Medium~~ done   | S      | 2     |
| TD-32  | ✅ E2E job spent 9m a run on `playwright install-deps`                                                          | ~~🟠 High~~ done     | S      | 1     |
| TD-33  | ✅ Italian identifiers TD-19 missed — 16 across 14 files + a directory                                          | ~~🟡 Medium~~ done   | S      | 2     |
| TD-34  | ✅ CI actions pinned to a deprecated Node 20 runtime; Node 22 → 24                                              | ~~🟢 Low~~ done      | S      | 2     |
| TD-35  | ✅ E2E specs assert hardcoded Italian copy instead of reading the catalogue                                     | ~~🟡 Medium~~ done   | M      | 2     |
| TD-36  | ✅ `proxy.ts` matcher let `.jpg` through the auth/i18n gate, breaking map tiles                                 | ~~🟠 High~~ done     | S      | 2     |
| TD-37  | ✅ `authenticate()` and `app/lib/connections/**` are 0% covered — the login and DB-bootstrap path               | ~~🟠 High~~ done     | S      | 2     |
| TD-38  | ✅ `fetch*`/`get*Count` untested for deities, magicitems, npc — data layer at 51%, target 90%                   | ~~🟠 High~~ done     | S      | 2     |
| TD-39  | ✅ Pure functions in `app/lib/utils/**` at 51%, target 95% — cheapest real coverage in the project              | ~~🟡 Medium~~ done   | S      | 2     |
| TD-40  | ✅ Metadata correctness untested — `npcMeta`/`deityMeta` at 14%/25%, target 80%                                 | ~~🟡 Medium~~ done   | S      | 2     |
| TD-41  | ✅ `app/lib/hooks/**` at 52%, target 70% — `useFilterController` entirely untested                              | ~~🟡 Medium~~ done   | S      | 2     |
| TD-42  | ✅ `app/ui/**` behaviour untested — domain forms/cards/libraries at ~0%, target 60%                             | ~~🟢 Low~~ done      | L      | 2     |
| TD-43  | ✅ `app/modules/maps/**` geometry and hooks near 0%, target 50%                                                 | ~~🟢 Low~~ done      | M      | 2     |
| TD-44  | ✅ Re-measured coverage with `coverage.all: true`; re-scoped the 70% gap as TD-45/TD-46                         | ~~🟡 Medium~~ done   | S      | 2     |
| TD-45  | ✅ Page-level route components (`app/[locale]/dashboard/**`, `app/ui/geography`) covered                        | ~~🟡 Medium~~ done   | M      | 2     |
| TD-46  | ✅ `app/modules/maps/components/**` (Leaflet rendering, 737 lines) Vitest coverage — Tier 1 and Tier 2 done     | ~~🟡 Medium~~ done   | L      | 2     |
| TD-58  | ✅ Dependabot grouped a major ESLint bump into the dev-dependencies group, breaking CI                          | ~~🟠 High~~ done     | S      | 3     |
| TD-59  | ✅ `prisma` CLI and `@prisma/client`/`@prisma/adapter-pg` could bump independently, breaking the build          | ~~🟠 High~~ done     | S      | 3     |
| TD-61  | ✅ Option-backed `Int` fields accept any number; an out-of-list value renders as a blank cell                   | ~~🟠 High~~ done     | S      | 3     |
| TD-62  | ✅ POI category names are hardcoded English and reach the UI — a TD-21 leftover                                 | ~~🟢 Low~~ done      | S      | 3     |
| TD-63  | ✅ Local dev DB's migration history had a gap `migrate dev`/`migrate deploy` couldn't get past                  | ~~🟡 Medium~~ done   | S      | 3     |
| TD-64  | ✅ `WorldMap.tsx`'s async-effect map-loading pattern trips `react-hooks/set-state-in-effect`                    | ~~🟢 Low~~ done      | S      | 3     |
| TD-65  | ✅ `DATABASE_URL` in this dev environment isn't a throwaway DB — e2e debris landed in real data                 | ~~🟡 Medium~~ done   | S      | 3     |
| TD-66  | ✅ `UPLOAD_DIR`'s relative default silently splits map-image files from the DB rows referencing them            | ~~🟡 Medium~~ done   | S      | 3     |
| TD-67  | ✅ "Add to My Places" context-menu label is misleading — it creates any kind, not just a POI                    | ~~🟢 Low~~ done      | S      | 3     |
| TD-68  | ✅ `MapPOIPanel`'s Close button is unclickable — a same-`z-index` overlay intercepts the click                  | ~~🟠 High~~ done     | S      | 3     |
| TD-69  | ✅ `poi.linkedType`/`linkedId` has no unique constraint — a second pin per NPC/deity is silently possible       | ~~🟠 High~~ done     | S      | 3     |
| TD-70  | ✅ No rendering path exists for `deity`/`npc` pins on the map, even once positioned                             | ~~🟡 Medium~~ done   | M      | 3     |
| TD-71  | ✅ No way to position or edit a place that already exists — only newly-created ones get coordinates             | ~~🟠 High~~ done     | L      | 3     |
| TD-72  | ✅ `usePOIManager.ts`/`useNavigableChildren.ts` marker HTML uses inline `style`, not Tailwind classes           | ~~🟢 Low~~ done      | S      | 3     |
| TD-73  | ✅ `.env.test.example`'s documented e2e setup (`prisma db push`) leaves a fresh DB unable to seed               | ~~🟡 Medium~~ done   | S      | 3     |
| TD-74  | ✅ `pageMetaFields` spread four domain metas into one flat object — a name collision silently discarded one     | ~~🟡 Medium~~ done   | S      | 3     |
| TD-75  | ✅ `pnpm test` fails on a clean checkout — one suite needs a `DATABASE_URL` that only CI provides               | ~~🟡 Medium~~ done   | S      | 3     |
| TD-76  | ✅ `renderRichText` injects stored text as raw HTML with no sanitisation                                        | ~~🟡 Medium~~ done   | S      | 3     |
| TD-77  | ✅ An entity's location is resolved through two unreconciled read paths                                         | ~~🟡 Medium~~ done   | S      | 3     |
| TD-78  | The NPC admin list lost its Fazione column filter when the field went table-backed                              | 🟢 Low               | M      | 3     |
| TD-79  | The unpositioned-places count doesn't distinguish "blocked on the parent's map" from any other cause            | 🟢 Low               | S      | 3     |
| TD-80  | ✅ Deity, magic-item, and faction create/update Server Actions lack unit and e2e test coverage                  | ~~🟡 Medium~~ done   | M      | 2     |
| TD-81  | ✅ Maps framed to the image's own aspect ratio instead of a square default                                      | ~~🟠 High~~ done     | M      | 4     |
| TD-82  | The place in view has no URL of its own — navigating the tree never changes the address bar                     | 🟡 Medium            | S      | 4     |
| TD-83  | ✅ "Up" anchored to the map's own overlay container, not the scrolling page header                              | ~~🟠 High~~ done     | S      | 4     |
| TD-84  | ✅ `WorldMap` sized to its container (`h-full`) instead of the viewport                                         | ~~🟠 High~~ done     | S      | 4     |
| TD-85  | ✅ "Posiziona luogo" ships (PR #190); POI edit/delete reachable from SPEC-016's popover; list view kept         | ~~🟠 High~~ done     | M      | 4     |
| TD-86  | ✅ Renamed to "marker temporaneo", dismissable — ephemerality kept, by design                                   | ~~🟡 Medium~~ done   | S      | 4     |
| TD-87  | ✅ Zoom floor computed from the map's own bounds instead of a hardcoded 0                                       | ~~🟠 High~~ done     | S      | 4     |
| TD-88  | ✅ Sidebar scroll container added; sign-out and locale switcher reachable                                       | ~~🟠 High~~ done     | S      | 4     |
| TD-89  | ✅ `group` ancestor added; chevron rotates on all five disclosure cards                                         | ~~🟢 Low~~ done      | S      | 4     |
| TD-90  | ✅ Icon rotates in a square box now, not the wrapper — incl. two unreported instances found                     | ~~🟢 Low~~ done      | S      | 4     |
| TD-91  | ✅ Places and factions counted; every place in the tree, per the DM                                             | ~~🟡 Medium~~ done   | S      | 4     |
| TD-92  | ✅ Every card links to its domain list via the locale-aware `Link`                                              | ~~🟢 Low~~ done      | S      | 4     |
| TD-93  | ✅ Guarded writes refuse a second placement; un-placing and clearing are the way back                           | ~~🟠 High~~ done     | M      | 4     |
| TD-94  | ✅ Closed by SPEC-015 T7 — measurement rebuilt on the grid, haversine path deleted, regression test in place    | ~~🟠 High~~ done     | M      | 4     |
| TD-95  | ✅ POI panel + neighbours (`MapControls`, `MapLoadingSpinner`, `MapErrorBoundary`) swept into both catalogues   | ~~🟡 Medium~~ done   | S      | 4     |
| TD-96  | ✅ Both entries gone — "Copia coordinate" with PR #190, "Collega personaggio" with SPEC-016 T8                  | ~~🟢 Low~~ done      | S      | 4     |
| TD-97  | `MagicItemType`'s nine members are still Italian identifiers — a TD-33 miss                                     | 🟢 Low               | S      | 4     |
| TD-98  | `.prettierignore` doesn't exclude `.claude/`, so `format:check`/`--write` reach other sessions' worktrees       | 🟢 Low               | S      | 4     |
| TD-99  | A fresh worktree's `pnpm install` postinstall (`prisma generate`) fails for lack of `DATABASE_URL`              | 🟢 Low               | S      | 4     |
| TD-100 | The map context menu can die to the init tail on slow environments; `map.spec` raced it and lost on CI          | 🟡 Medium            | M      | 4     |
| TD-101 | ✅ Marker drag repositioning: the marker was under the panel, not undraggable; its e2e spec is real now         | ~~🟠 High~~ done     | M      | 4     |
| TD-102 | ✅ Landmarks route to `placeLandmark`; picking one no longer addresses whichever zone shares its id             | ~~🟠 High~~ done     | M      | 4     |
| TD-103 | ✅ "Posiziona luogo" was enabled from a tree-wide count while listing only the current map — a dead click       | ~~🟠 High~~ done     | S      | 4     |
| TD-104 | A zone has no edit surface: not renamable anywhere, and "Modifica area" is stranded in the right-click menu     | 🟡 Medium            | M      | 4     |
| TD-105 | 48 `revalidatePath` calls name a route structure that does not exist — and no page is cached, so they are inert | 🟢 Low               | S      | 4     |

---

---

## Closed items — TD-01 through TD-80

Everything the 2026-07-22 audit found, plus everything found while doing the work through 2026-08-17, is closed: correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness, the coverage sweep that crossed Phase 2's 70% gate, the whole SPEC-004 map/world-tree run, the clean-checkout `pnpm test` gap, the metadata layer's unguarded field-name collision, description fields rendering as unsanitised HTML, the entity-location read path duplication, and the deity/magic-item/faction mutation coverage gap. The summary table above is the current status of each.

**Each item's full write-up — what was found, why, the fix — is in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)**, moved there in five passes (TD-01–TD-36 on 2026-08-01, TD-37–TD-75 on 2026-08-08, TD-76 on 2026-08-13, TD-77 on 2026-08-13, TD-80 on 2026-08-17). Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

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

### TD-79 — The unpositioned-places count doesn't distinguish "blocked on the parent's map" from any other cause

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-10, [SPEC-007](./specs/007-placement-backlog.md) T2 — filed 2026-08-17 during the Phase 3 closure audit, since it had only ever been recorded as prose in `ROADMAP.md`, with no number of its own

`countUnpositionedPlaces` (`app/lib/data/maps/countUnpositionedPlaces.ts`) reports
one tree-wide number: every place with `lat: null` and a non-null `parentId`. A
place whose own parent has no map yet — so it structurally cannot be
positioned until the DM uploads a map one level up — counts identically to a
place whose parent already has a map and simply hasn't been drawn on it yet.
The two situations have different fixes (upload a map vs. draw a pin), and
the count cannot tell the DM which one they're looking at.

**Re-scoped 2026-08-18 — and the alarming version of this entry was wrong.**

An earlier draft of this note argued that removing the header count would strand
places whose parent has no map: nothing would list them, because the
"Posiziona luogo" dropdown can only offer the children of the map currently open.
**The DM refuted it, and checking the code confirms the refutation.** A place can
only be created by right-clicking a map — `createPlace`'s only callers are
`WorldMap` and `MapPOIPanel`, there is no admin CRUD for places, and there is no
seed — and a place with no `mapImage` is not navigable
(`useNavigableChildren.ts:228`), so there is no map to right-click _inside_ a
mapless place. A map also cannot be removed once uploaded: `updateZoneMap` only
ever writes a non-empty `mapImage`, never null. **So a child of a mapless parent
is not reachable through today's UI, and the category this item was created to
distinguish is currently empty.**

Recorded at this length because the mistake is instructive and this register has
made it before (SPEC-007 §0 documents two consecutive drafts that reasoned from a
spec's description of the data instead of the data): **the reasoning was sound
and the premise was never checked.**

**What the DM asked for instead, and it is the whole of it:** the count belongs
next to the "Posiziona luogo" entry in the right-click menu — how many places
are still waiting, shown at the exact moment the DM can act on it — and nowhere
else. That is a line of TD-85's work, not a separate item.

**Keep this entry open anyway, narrowed to a guard.** The empty category stops
being empty the moment anything lets a map be deleted or a place be created away
from a map — both plausible (the map options menu already offers "replace", and
an admin list for places would be a natural addition). If either ships, the
distinction this item is about becomes real and invisible at the same time.
Whoever builds one should read this first.

**Why this is Low, not Medium.** `MapUploadControl` (SPEC-007 T1) already
surfaces the fix in practice: the moment the DM reaches the mapless parent,
the upload control is right there. The gap is in the report's wording, not
in the workflow — the number is honest, just less specific than it could be.

**The fix, sketched in SPEC-007 §10 T2's own note:** split the count (or add
a second one) that distinguishes "blocked on an ancestor's missing map" from
"map exists, not yet drawn." Doing this precisely means walking each
unpositioned place's `parentId` chain to check whether any ancestor also
lacks a map — not a single-query `WHERE` clause — so it is a real, if small,
piece of work, not a one-line change.

### TD-82 — The place in view has no URL of its own — navigating the tree never changes the address bar

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-08-17, requested by the DM

`/dashboard/geography` renders whichever place sits on top of
`GeographyExplorer`'s in-memory stack. Descending into a child pushes, "up"
pops, and **the URL is identical throughout** — so a specific map cannot be
linked, bookmarked, reopened after a refresh, or reached with the browser's
back button.

**Half of this already exists and is easy to miss.** `geography/page.tsx`
already accepts `?place=<id>` and calls `fetchPlaceAncestryChain` to seed the
stack with that place's full root-to-place trail (SPEC-011 T4, built for
cross-entity place search). The read path is done, tested, and already handles
a missing, non-numeric, or dangling id by falling back to the root. **What is
missing is only the write half:** `handleDescend`/`handleAscend` never tell the
router where they went.

**The fix, in shape:** on descend and ascend, `router.replace` the same page
with `?place=<current.id>` (`replace`, not `push`, unless we decide each hop
should be its own history entry — see below). Nothing else has to change: a
reload of that URL rebuilds the identical stack through the path that already
works.

**Deliberately not `/dashboard/geography/01`,** which is how the request was
phrased. A path segment means a new dynamic route and a second copy of the
page's data loading, for no behaviour the query param does not already give
us — and the id in the URL would be the database id either way, not a stable
human-facing number. If the DM wants pretty, memorable per-map URLs (slugs
rather than ids), that is a genuine feature and needs a spec under
`docs/specs/`, not this entry.

**Decide while implementing:** whether the browser back button should walk the
tree hop by hop (`push`) or leave the map entirely (`replace`). `push` is
probably what the DM means by "poter navigare", but it makes back and the "up"
button do subtly different things — back retraces _history_, up climbs the
_tree_, and after a search-result deep link those two are not the same path.

### TD-97 — `MagicItemType`'s nine members are still Italian identifiers — a TD-33 miss

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18, while writing SPEC-013 T3's `TreasureCategory`

`app/lib/definitions/enums/magicitem/MagicItemType.ts` — `Anello`, `Armatura`,
`Arma`, `Bacchetta`, `Bastone`, `OggettoMeraviglioso`, `Pergamena`, `Pozione`,
`Verga` — is Italian identifiers in the code layer, which `CLAUDE.md`'s
language conventions say is a genuine TD-33 miss, not an exception. Not a new
finding in the sense of unnoticed: T3's `TreasureCategory` was deliberately
built to copy this file's _structural_ pattern (enum + numeric options array)
while using English members, precisely to avoid extending the miss.

**The fix, in shape:** rename the nine members to English, land it as its own
pure-rename commit (`CLAUDE.md`'s own instruction for exactly this situation),
touching nothing else. Do it after SPEC-013's metadata work on `magicitems`
(T4) settles, so the rename doesn't collide with an in-flight `PageMeta` change
to the same domain.

### TD-98 — `.prettierignore` doesn't exclude `.claude/`, so `format:check`/`--write` reach other sessions' worktrees

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18, running several worktree agents in parallel

`.claude/worktrees/**` holds other agents' in-progress git worktrees while
they're mid-task. `.prettierignore` lists `node_modules`, `.next`, `generated`,
`coverage`, `public`, `playwright-report`, the lockfiles and `next-env.d.ts` —
not `.claude/`. `pnpm format:check` scanning the whole repo therefore walks
into other worktrees and reports their files; harmless for a read-only check,
but `prettier --write .` run from the repo root would edit another session's
working tree out from under it.

**The fix:** add `.claude/` to `.prettierignore`, and check whether
`tailwind.config.ts`'s content glob and ESLint's ignore list have the same gap
— found while debugging TD-85/96's CI failures, where several worktrees were
live at once.

### TD-99 — A fresh worktree's `pnpm install` postinstall (`prisma generate`) fails for lack of `DATABASE_URL`

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18/19, across every worktree agent this session

`pnpm install --frozen-lockfile` in a freshly created git worktree has no
`.env`, and `prisma generate`'s postinstall wants a `DATABASE_URL` to read
even though generation itself needs no live database connection. Every
worktree agent this session hit this and worked around it by generating once
against `.env.example`'s placeholder connection string, undocumented, ad hoc,
independently discovered each time.

**The fix, in shape:** either make `prisma generate` tolerant of a missing
`DATABASE_URL` (check whether `app/lib/config/env.ts`'s validation — the same
mechanism TD-75 fixed for `pnpm test` — is what's actually forcing this, since
that would make this the same class of bug, not a new one), or write the
`.env.example`-fallback workaround into `docs/TESTING.md` once, next to TD-75's
note, so it isn't rediscovered per agent.

### TD-100 — The map context menu can die to the init tail on slow environments; `map.spec` raced it and lost on CI

**Severity:** 🟡 Medium · **Effort:** M · **Found:** 2026-08-21, from a docs-only PR (#215) failing e2e twice on the same test

`map.spec.ts`'s "clicking the visible Close button closes the desktop POI
panel" failed on CI twice in a row (runs of 2026-08-20, PR #215 — a PR that
touches only two markdown files) while the identical code was green on main
and green locally across the full suite, `--repeat-each` isolation, 6×/20×
CPU throttling, and 500ms emulated network latency. The Playwright trace and
error context from CI show two distinct signatures, both of them the test
racing the map's initialisation window:

- **First attempt:** the right-click opened the menu, the "Aggiungi luogo"
  button resolved, then detached from the DOM once (~100–200ms after opening,
  the same offset TD-90's/#208's cascade note records) and never returned —
  the menu closed and the test never right-clicks again.
- **Both retries:** the right-click completed but the menu never appeared at
  all within 30s — consistent with the click landing before Leaflet's
  `contextmenu` handler was attached, since `.leaflet-container` being
  visible (all the `beforeEach` waits for) is not "the map is ready".

**What was ruled out, with evidence:** the six mount-time server-action POSTs
to `/dashboard/geography` (one per data-fetching hook) carry ~68-byte
responses on CI and 843 bytes locally — return values only, no RSC re-render
payload, so they cannot remount anything (Next 16's server-actions guide
confirms an action that neither revalidates nor touches cookies does not
re-render). The #208 framing fix (`{ animate: false }` inside
`runWithoutClosing`, both the interim `setView` and the image-load re-fit) is
intact and covers what it says it covers.

**The suspected closer for the first signature** is the deferred
`map.invalidateSize()` in `LeafletMap.tsx` (~line 123, rAF + 100ms after map
creation): if the container's size changed in that window (late layout/font
settle — CI-plausible, local-implausible), `invalidateSize` fires `moveend`,
and `setMaxBounds`'s `panInsideMaxBounds` hook — attached by the interim
framing — pans on `moveend`, and _that_ pan fires the `movestart` that
closes the menu. Same cascade #208 documented, different trigger, and this
one runs outside any `runWithoutClosing`. Unproven: the interleaving did not
reproduce locally under any throttle tried.

**Interim measure, shipped with this entry:** `map.spec.ts` now opens the
context menu through a retrying helper (`openContextMenu`) — right-click
until the menu is visible, as a real DM would — instead of right-clicking
exactly once and waiting 30s. This unhostages CI without masking a
persistent regression (if the menu keeps dying, the retry exhausts and the
test still fails), but it deliberately does not fix the app.

**That interim was too narrow, and CI proved it on 2026-08-27** (run
33113909995, PR #230 — again a PR that changes nothing this test touches).
`openContextMenu` returned as soon as the menu was _visible_, which leaves
the window between "visible" and "the item is clicked" unguarded — and the
second signature above landed squarely in it: the menu opened, "Aggiungi
luogo" resolved, then went unstable and detached mid-click, three attempts
running. Retrying the open cannot recover from that, because by then the
helper has already returned. The helper has therefore moved to
`e2e/helpers/mapContextMenu.ts` and gained `chooseFromContextMenu`, which
retries the right-click _and_ the click on the entry as one unit; all six map
specs plus `a11y.spec.ts` go through it, where before only `map.spec.ts` had
any retry at all and the other nine right-click sites had none. Still an
interim, and still not a fix to the app.

**What remains open:** decide whether the menu should close on user-intent
events (`dragstart`, `zoomstart`) rather than `movestart`, which would end
this whole class — #208's fix, this suspected trigger, and any future
programmatic move — instead of wrapping each new trigger one at a time; or
alternatively wrap/neutralise the `LeafletMap` deferred `invalidateSize`
(e.g. `{ pan: false }` plus keeping `moveend` out of the init tail). Either
way, the DM-facing claim to preserve is: a menu the DM opened stays open
until the DM closes it or acts on it.

### TD-103 ✅ "Posiziona luogo" is enabled from a tree-wide count but lists only the current map's children — **DONE (2026-08-30)**

**Severity:** 🟠 High · **Effort:** S · **Found:** 2026-08-30, by the DM using the app while TD-102 was open — "clicco e non succede nulla"

`MapContextMenu`'s entry was `disabled={unpositionedCount === 0}`, and
`countUnpositionedPlaces` counts every `zone` with `lat: null` **in the whole
tree**. Its dropdown, meanwhile, was filled from `unplacedPlaces` —
`useUnplacedChildren(parentId)`, the direct children of the map currently
open. So on any map whose own children are all placed, the entry rendered
enabled, the click toggled `isPositionListOpen`, and
`isPositionListOpen && unplacedPlaces.length > 0` rendered nothing. A control
that looks available and does nothing at all.

Live on the DM's own database while this was found: 41 unpositioned zones
tree-wide, so the entry was enabled on **every** map, and useful on the two
that actually had unplaced children.

**Neither half was wrong on its own.** SPEC-007 §5 says outright that the
count is "a tree-wide read, not a per-parent one" and that
`useUnplacedChildren` "answers which children of _this_ place lack
coordinates and stays as it is" — two numbers for two surfaces, deliberately.
The header label that consumed the tree-wide one was withdrawn on 2026-08-18
("a number with no action attached to it is noise"), and the same
conversation gave positioning its own right-click entry (TD-85). That is
where the count got wired to `disabled`: an awareness figure asked to answer
a reachability question.

**Fix:** the entry is enabled from the list it will actually show. The
tree-wide number still reaches the menu, but only as `positionPlaceSublabel`'s
already-rendered text — information about the campaign, never a claim about
this map — so `MapContextMenu` no longer takes `unpositionedCount` at all.

**Why the tests did not catch it:** every case in
`MapContextMenu.test.tsx` paired `unplacedPlaces: []` with
`unpositionedCount: 0` and a populated list with `unpositionedCount: 2`. The
suite encoded the assumption that the two agree, so the one state that
matters — non-zero count, empty list — was never rendered. It has its own
test now.

**Interim, and labelled as such.** The DM's own reading of this is that the
unplaced pool should not be per-map at all: there is no way to move a place
from one map to another, so a place parked under the wrong parent is stuck
there. That is re-parenting, cycle refusal and ADR-0010's entity invariant —
recorded in [`ROADMAP.md`](./ROADMAP.md) as spec work. This item only stops
the control from lying; it does not decide what the pool should contain.

### TD-104 — A zone has no edit surface: not renamable anywhere, and "Modifica area" is stranded in the right-click menu

**Severity:** 🟡 Medium · **Effort:** M · **Found:** 2026-08-30, by the DM clicking a zone with a sub-map and looking for "Modifica area" where the other actions are

Left-clicking a navigable child opens `PlacePopover`, which offers exactly
four things: attach an entity, "Sposta nei luoghi non posizionati" (SPEC-016
T5), "Rimuovi definitivamente" (T6), and "Apri mappa". **No edit of any
kind.** A landmark, by contrast, has "Modifica" from the same popover (T7).
Editing a zone's area lives only in the map's right-click menu, reached by
right-clicking inside the area rather than by clicking the place — which is
where the DM looked and did not find it.

**And the gap is wider than the missing entry.** Grepping every writer of
`zone` turns up `createPlace`, `createRootPlace`, `updateZoneMap`,
`updateZoneGrid`, `updateZonePosition`, `unplacePlace` and `deletePlace`.
None of them writes `title` or `description`. **A region cannot be renamed
anywhere in the application.** `MapOptionsButton` acts on the place currently
being viewed and offers only replace-map, configure-grid and delete.

So this is one decision, not two: if the popover gains an edit surface for
zones it should be a single entry that covers the title, the description and
the area, rather than "Modifica area" moved across on its own and a rename
bolted on later.

**Decided by the DM, 2026-08-30: one "Modifica" entry, opening the panel with
the area inside it.** Not two entries side by side in the popover. So the
popover gains exactly one button for a zone, matching the shape a landmark
already has (SPEC-016 T7's "Modifica"), and the area's redraw is reached from
within that panel rather than from a second place. What the right-click menu
keeps is a separate question this does not settle — the positional entry still
works on the area under the cursor, which is the only way to reach an area
whose place is hard to click. The area half also changes shape in the move — the
right-click entry targets `contextMenuOverArea`, the area the click landed
inside, while a popover entry targets the place already clicked; both end up
arming `editingArea`, so the gesture itself is unaffected.

**Already fixed, separately:** the entry's sublabel said "Ridimensiona o
sposta" / "Resize or move" while `handleEditArea` arms only SPEC-009 T5's
redraw-to-replace. Redrawing the rectangle elsewhere does move the area, so
the wording was not false about the outcome — but it promised a _control_
that does not exist, and the DM read it that way. It now describes the
gesture: "Ridisegna il rettangolo" / "Redraw the rectangle".

### TD-105 — 48 `revalidatePath` calls name a route structure that does not exist, and nothing is cached anyway

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-30, noticed while writing `placeLandmark` for TD-102 — `createPoi`/`updatePoi` revalidate `/geography` where every zone mutation revalidates `/dashboard/geography`

**Two findings, and the second defuses the first.**

**1. None of the 48 calls is in a form that can match.** Pages live at
`app/[locale]/dashboard/<domain>`, so the path begins with a dynamic segment.
Next's own reference
(`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`)
settles it on two points: with rewrites you pass the **destination** path, not
the URL the browser shows, because the function works on the route file
structure; and when the path contains a dynamic segment, `type` is
**required**. `proxy.ts` mounts `next-intl/middleware` with
`localePrefix: "as-needed"`, so `/dashboard/geography` is the source URL,
rewritten internally to `/it/dashboard/geography`. The form that would match
is `revalidatePath("/[locale]/dashboard/geography", "page")`.

| form                              | calls | what is wrong                                               |
| --------------------------------- | ----- | ----------------------------------------------------------- |
| `/dashboard/campaign` and similar | 29    | the _source_ path — the reference's own "Incorrect" example |
| `/geography`, `/npc`, `/spells`…  | 19    | matches nothing: neither source nor destination             |
| passing `type: "page"`            | 0     | required by the `[locale]` segment, never passed            |

**2. There is no cache for them to invalidate.** Verified against a production
build on 2026-08-30, not inferred:

- `pnpm build` marks **every** route `ƒ (Dynamic) server-rendered on demand`.
  The only `○ (Static)` entry in the whole table is `/opengraph-image.png`.
  That follows from the code: every dashboard page reaches `requireSession()`
  → `auth()` → cookies, which forces dynamic rendering.
- Against `pnpm start`, the page's own response carries
  `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`.
- Inserting an unplaced zone **directly into the database**, with no mutation
  and no `revalidatePath` anywhere in the picture, moved the rendered
  `unpositionedCount` from 0 to 1 on the very next request, and deleting it
  moved it back. The page reads the database per request.
- The client Router Cache does not hold these either: `staleTimes.dynamic`
  defaults to 0 seconds since Next 15 ("not cached"), and `next.config.ts`
  sets no `staleTimes`.

**So this is not the landmine the first draft of this entry described.** The
worry was that all 48 work by side effect — the reference notes that a Server
Function's `revalidatePath` currently also refreshes previously visited pages,
and says that will be narrowed — and would stop together when Next narrows it.
They will not, because nothing here is cached to begin with. Correcting the
paths would change nothing observable.

**The fix is therefore to delete them, or to correct them, and the argument
runs the other way than expected.** Deleting is honest about today: 48 calls
that do nothing, one of them (`/geography`) visibly a different kind of
nothing from the rest, is a standing invitation to misread the caching model —
this entry exists because it did. Correcting is the bet that caching arrives
later (PPR, `use cache`, a static shell), and 48 calls that are wrong now
would be equally wrong then, so keeping them "for later" buys nothing.

**One thing still unverified**, and it is the only reason not to delete them
outright without looking: whether any client-side navigation currently leans
on that temporary broad refresh — back/forward in particular, since the
reference notes `staleTimes` does not govern back/forward caching. Checking
that needs a browser session against a production build, which the
curl-and-cookie probe above deliberately did not cover.

**A claim in the code was wrong and was corrected with this entry.** Comments
in `WorldMap.tsx` and `WorldMap.test.tsx` said the count refresh comes from
`revalidatePath("/dashboard/geography")`, "confirmed live in e2e (SPEC-016
T5)". The observation was real; the attribution was not, and e2e could never
have supported it — `playwright.config.ts` starts `pnpm dev`, where Server
Components re-render per request whatever the cache is told. Pointing
`unplacePlace` at `revalidatePath("/td-105-nonsense-path")` leaves
`map-unplace.spec` passing, count assertion included.
