# Technical Debt Register

**Last updated:** 2026-08-19
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**Open items: TD-78, TD-79, TD-82, TD-85, TD-93, TD-96, TD-97, TD-98, TD-99, TD-100, TD-101.** Everything else in the summary table is closed. TD-85 and TD-96 are `part` — shipped in part, with the remainder deliberately deferred; their write-ups stay here rather than in the archive because that remainder is still live work.

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

| ID     | Title                                                                                                         | Severity             | Effort | Phase |
| ------ | ------------------------------------------------------------------------------------------------------------- | -------------------- | ------ | ----- |
| TD-01  | ✅ Unauthenticated delete endpoints and Server Actions                                                        | ~~🔴 Critical~~ done | M      | 1     |
| TD-02  | ✅ No input validation, incl. TD-02b's remaining boundaries                                                   | ~~🔴 Critical~~ done | M      | 1–2   |
| TD-03  | ✅ Test suite does not run                                                                                    | ~~🔴 Critical~~ done | M      | 1     |
| TD-04  | ✅ TypeScript errors on `tsc --noEmit`                                                                        | ~~🔴 Critical~~ done | S      | 1     |
| TD-05  | ✅ No ESLint config, no Prettier, no CI                                                                       | ~~🟠 High~~ done     | S      | 1     |
| TD-06  | ✅ Dead code and tutorial leftovers                                                                           | ~~🟠 High~~ done     | S      | 1     |
| TD-07  | ✅ `next`/`react` pinned; single lockfile                                                                     | ~~🟠 High~~ done     | S      | 1     |
| TD-08  | ✅ Metadata and query layer typed; zero `any`, rule is an error                                               | ~~🟠 High~~ done     | M      | 2     |
| TD-09  | ✅ Quartets collapsed into EntityList / EntityLibrary / EntityForm                                            | ~~🟠 High~~ done     | L      | 2     |
| TD-10  | ✅ Toasts (client) vs `logServerIssue` (server) replace the stub                                              | ~~🟠 High~~ done     | M      | 2     |
| TD-11  | ✅ Timestamps + `@@index([nome])`; relations still deferred                                                   | ~~🟡 Medium~~ part   | M      | 2     |
| TD-12  | ✅ Filter list declared once; count and rows can no longer diverge                                            | ~~🟡 Medium~~ done   | S      | 2     |
| TD-13  | ✅ Typed errors with `cause`; 404 vs 500; toasts via TD-10                                                    | ~~🟡 Medium~~ done   | M      | 2     |
| TD-14  | ✅ Map POIs persisted only to `localStorage`                                                                  | ~~🟡 Medium~~ done   | M      | 3     |
| TD-15  | ✅ `e2e/a11y.spec.ts` — zero axe violations, keyboard focus ring                                              | ~~🟡 Medium~~ done   | M      | 2     |
| TD-16  | ✅ Inconsistent formatting                                                                                    | ~~🟢 Low~~ done      | S      | 1     |
| TD-17  | ✅ README does not match reality                                                                              | ~~🟢 Low~~ done      | S      | 1     |
| TD-18  | ✅ `copy-webpack-plugin` forces webpack over Turbopack                                                        | ~~🟢 Low~~ done      | S      | 3     |
| TD-19  | ✅ Mixed Italian/English identifiers (residual set → TD-33)                                                   | ~~🟠 High~~ done     | L      | 2     |
| TD-20  | ✅ Every flag on, incl. `noUncheckedIndexedAccess` (`noUnusedLocals` rejected)                                | ~~🟡 Medium~~ done   | M      | 2     |
| TD-21  | ✅ UI strings hardcoded; app must ship in it + en                                                             | ~~🟠 High~~ done     | L      | 2     |
| TD-22  | ✅ Lint warnings 293 → 0; every rule back to `error`                                                          | ~~🟠 High~~ done     | M      | 2     |
| TD-23  | ✅ Migration drift patched forward; migrations match the schema                                               | ~~🟠 High~~ done     | S      | 1     |
| TD-24  | ✅ Playwright harness + specs; `e2e` job blocking in CI                                                       | ~~🟠 High~~ done     | M      | 1     |
| TD-25  | ✅ Startup reachability check; 503 distinct from 500                                                          | ~~🟡 Medium~~ done   | S      | 2     |
| TD-26  | ✅ `sottoclassi` / `circolo` duplication resolved                                                             | ~~🟡 Medium~~ done   | S      | 2     |
| TD-27  | ✅ Hidden `classi=0` filter on the spells list removed                                                        | ~~🟠 High~~ done     | S      | 2     |
| TD-28  | ✅ Seed ids removed; the database assigns them, as the UI does                                                | ~~🟠 High~~ done     | S      | 2     |
| TD-29  | ✅ Loading skeleton was the tutorial's invoices table                                                         | ~~🟡 Medium~~ done   | S      | 2     |
| TD-30  | ✅ Public list pages actually stream; skeleton matches the content                                            | ~~🟡 Medium~~ done   | S      | 2     |
| TD-31  | ✅ `sortSelectOptions` mutated shared `PageMeta.options` in place                                             | ~~🟡 Medium~~ done   | S      | 2     |
| TD-32  | ✅ E2E job spent 9m a run on `playwright install-deps`                                                        | ~~🟠 High~~ done     | S      | 1     |
| TD-33  | ✅ Italian identifiers TD-19 missed — 16 across 14 files + a directory                                        | ~~🟡 Medium~~ done   | S      | 2     |
| TD-34  | ✅ CI actions pinned to a deprecated Node 20 runtime; Node 22 → 24                                            | ~~🟢 Low~~ done      | S      | 2     |
| TD-35  | ✅ E2E specs assert hardcoded Italian copy instead of reading the catalogue                                   | ~~🟡 Medium~~ done   | M      | 2     |
| TD-36  | ✅ `proxy.ts` matcher let `.jpg` through the auth/i18n gate, breaking map tiles                               | ~~🟠 High~~ done     | S      | 2     |
| TD-37  | ✅ `authenticate()` and `app/lib/connections/**` are 0% covered — the login and DB-bootstrap path             | ~~🟠 High~~ done     | S      | 2     |
| TD-38  | ✅ `fetch*`/`get*Count` untested for deities, magicitems, npc — data layer at 51%, target 90%                 | ~~🟠 High~~ done     | S      | 2     |
| TD-39  | ✅ Pure functions in `app/lib/utils/**` at 51%, target 95% — cheapest real coverage in the project            | ~~🟡 Medium~~ done   | S      | 2     |
| TD-40  | ✅ Metadata correctness untested — `npcMeta`/`deityMeta` at 14%/25%, target 80%                               | ~~🟡 Medium~~ done   | S      | 2     |
| TD-41  | ✅ `app/lib/hooks/**` at 52%, target 70% — `useFilterController` entirely untested                            | ~~🟡 Medium~~ done   | S      | 2     |
| TD-42  | ✅ `app/ui/**` behaviour untested — domain forms/cards/libraries at ~0%, target 60%                           | ~~🟢 Low~~ done      | L      | 2     |
| TD-43  | ✅ `app/modules/maps/**` geometry and hooks near 0%, target 50%                                               | ~~🟢 Low~~ done      | M      | 2     |
| TD-44  | ✅ Re-measured coverage with `coverage.all: true`; re-scoped the 70% gap as TD-45/TD-46                       | ~~🟡 Medium~~ done   | S      | 2     |
| TD-45  | ✅ Page-level route components (`app/[locale]/dashboard/**`, `app/ui/geography`) covered                      | ~~🟡 Medium~~ done   | M      | 2     |
| TD-46  | ✅ `app/modules/maps/components/**` (Leaflet rendering, 737 lines) Vitest coverage — Tier 1 and Tier 2 done   | ~~🟡 Medium~~ done   | L      | 2     |
| TD-58  | ✅ Dependabot grouped a major ESLint bump into the dev-dependencies group, breaking CI                        | ~~🟠 High~~ done     | S      | 3     |
| TD-59  | ✅ `prisma` CLI and `@prisma/client`/`@prisma/adapter-pg` could bump independently, breaking the build        | ~~🟠 High~~ done     | S      | 3     |
| TD-61  | ✅ Option-backed `Int` fields accept any number; an out-of-list value renders as a blank cell                 | ~~🟠 High~~ done     | S      | 3     |
| TD-62  | ✅ POI category names are hardcoded English and reach the UI — a TD-21 leftover                               | ~~🟢 Low~~ done      | S      | 3     |
| TD-63  | ✅ Local dev DB's migration history had a gap `migrate dev`/`migrate deploy` couldn't get past                | ~~🟡 Medium~~ done   | S      | 3     |
| TD-64  | ✅ `WorldMap.tsx`'s async-effect map-loading pattern trips `react-hooks/set-state-in-effect`                  | ~~🟢 Low~~ done      | S      | 3     |
| TD-65  | ✅ `DATABASE_URL` in this dev environment isn't a throwaway DB — e2e debris landed in real data               | ~~🟡 Medium~~ done   | S      | 3     |
| TD-66  | ✅ `UPLOAD_DIR`'s relative default silently splits map-image files from the DB rows referencing them          | ~~🟡 Medium~~ done   | S      | 3     |
| TD-67  | ✅ "Add to My Places" context-menu label is misleading — it creates any kind, not just a POI                  | ~~🟢 Low~~ done      | S      | 3     |
| TD-68  | ✅ `MapPOIPanel`'s Close button is unclickable — a same-`z-index` overlay intercepts the click                | ~~🟠 High~~ done     | S      | 3     |
| TD-69  | ✅ `poi.linkedType`/`linkedId` has no unique constraint — a second pin per NPC/deity is silently possible     | ~~🟠 High~~ done     | S      | 3     |
| TD-70  | ✅ No rendering path exists for `deity`/`npc` pins on the map, even once positioned                           | ~~🟡 Medium~~ done   | M      | 3     |
| TD-71  | ✅ No way to position or edit a place that already exists — only newly-created ones get coordinates           | ~~🟠 High~~ done     | L      | 3     |
| TD-72  | ✅ `usePOIManager.ts`/`useNavigableChildren.ts` marker HTML uses inline `style`, not Tailwind classes         | ~~🟢 Low~~ done      | S      | 3     |
| TD-73  | ✅ `.env.test.example`'s documented e2e setup (`prisma db push`) leaves a fresh DB unable to seed             | ~~🟡 Medium~~ done   | S      | 3     |
| TD-74  | ✅ `pageMetaFields` spread four domain metas into one flat object — a name collision silently discarded one   | ~~🟡 Medium~~ done   | S      | 3     |
| TD-75  | ✅ `pnpm test` fails on a clean checkout — one suite needs a `DATABASE_URL` that only CI provides             | ~~🟡 Medium~~ done   | S      | 3     |
| TD-76  | ✅ `renderRichText` injects stored text as raw HTML with no sanitisation                                      | ~~🟡 Medium~~ done   | S      | 3     |
| TD-77  | ✅ An entity's location is resolved through two unreconciled read paths                                       | ~~🟡 Medium~~ done   | S      | 3     |
| TD-78  | The NPC admin list lost its Fazione column filter when the field went table-backed                            | 🟢 Low               | M      | 3     |
| TD-79  | The unpositioned-places count doesn't distinguish "blocked on the parent's map" from any other cause          | 🟢 Low               | S      | 3     |
| TD-80  | ✅ Deity, magic-item, and faction create/update Server Actions lack unit and e2e test coverage                | ~~🟡 Medium~~ done   | M      | 2     |
| TD-81  | ✅ Maps framed to the image's own aspect ratio instead of a square default                                    | ~~🟠 High~~ done     | M      | 4     |
| TD-82  | The place in view has no URL of its own — navigating the tree never changes the address bar                   | 🟡 Medium            | S      | 4     |
| TD-83  | ✅ "Up" anchored to the map's own overlay container, not the scrolling page header                            | ~~🟠 High~~ done     | S      | 4     |
| TD-84  | ✅ `WorldMap` sized to its container (`h-full`) instead of the viewport                                       | ~~🟠 High~~ done     | S      | 4     |
| TD-85  | "Posiziona luogo" entry ships; POI edit/delete reachability still waits on TD-93's popover                    | ~~🟠 High~~ part     | M      | 4     |
| TD-86  | ✅ Renamed to "marker temporaneo", dismissable — ephemerality kept, by design                                 | ~~🟡 Medium~~ done   | S      | 4     |
| TD-87  | ✅ Zoom floor computed from the map's own bounds instead of a hardcoded 0                                     | ~~🟠 High~~ done     | S      | 4     |
| TD-88  | ✅ Sidebar scroll container added; sign-out and locale switcher reachable                                     | ~~🟠 High~~ done     | S      | 4     |
| TD-89  | ✅ `group` ancestor added; chevron rotates on all five disclosure cards                                       | ~~🟢 Low~~ done      | S      | 4     |
| TD-90  | ✅ Icon rotates in a square box now, not the wrapper — incl. two unreported instances found                   | ~~🟢 Low~~ done      | S      | 4     |
| TD-91  | ✅ Places and factions counted; every place in the tree, per the DM                                           | ~~🟡 Medium~~ done   | S      | 4     |
| TD-92  | ✅ Every card links to its domain list via the locale-aware `Link`                                            | ~~🟢 Low~~ done      | S      | 4     |
| TD-93  | An already-positioned place or attached entity can be positioned again elsewhere                              | 🟠 High              | M      | 4     |
| TD-94  | ✅ Closed by SPEC-015 T7 — measurement rebuilt on the grid, haversine path deleted, regression test in place  | ~~🟠 High~~ done     | M      | 4     |
| TD-95  | ✅ POI panel + neighbours (`MapControls`, `MapLoadingSpinner`, `MapErrorBoundary`) swept into both catalogues | ~~🟡 Medium~~ done   | S      | 4     |
| TD-96  | "Copia coordinate" removed; "Collega personaggio" stays until TD-93's popover ships                           | ~~🟢 Low~~ part      | S      | 4     |
| TD-97  | `MagicItemType`'s nine members are still Italian identifiers — a TD-33 miss                                   | 🟢 Low               | S      | 4     |
| TD-98  | `.prettierignore` doesn't exclude `.claude/`, so `format:check`/`--write` reach other sessions' worktrees     | 🟢 Low               | S      | 4     |
| TD-99  | A fresh worktree's `pnpm install` postinstall (`prisma generate`) fails for lack of `DATABASE_URL`            | 🟢 Low               | S      | 4     |
| TD-100 | The map context menu can die to the init tail on slow environments; `map.spec` raced it and lost on CI        | 🟡 Medium            | M      | 4     |
| TD-101 | Marker drag repositioning never fires `dragend`; its e2e spec was green on a vacuous assertion                | 🟠 High              | M      | 4     |

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

### TD-85 — The POI panel's list mode has no entry point, so positioning places and editing POIs are unreachable

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
and the add form needs somewhere to return to. What did go with SPEC-016 T9 is
the unplaced-children picker this item withdrew — see below.

**Check while implementing:** `handlePOIModeChange` (`WorldMap.tsx:423`) takes
`"list" | "add" | "edit"` and stores it with `setPOIPanelMode(mode as "list" | "add")`.
The runtime value passes through intact, so this is not believed to be the cause
of anything the DM sees — but the cast is a lie to the compiler of exactly the
kind `CLAUDE.md`'s rule 3 exists to prevent, and it sits in the middle of the
code this item touches. Widen the state's type instead of casting.

### TD-93 — An already-positioned place or attached entity can be positioned again elsewhere

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

### TD-96 — The map's right-click menu carries two entries the model has outgrown

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

**What remains open:** decide whether the menu should close on user-intent
events (`dragstart`, `zoomstart`) rather than `movestart`, which would end
this whole class — #208's fix, this suspected trigger, and any future
programmatic move — instead of wrapping each new trigger one at a time; or
alternatively wrap/neutralise the `LeafletMap` deferred `invalidateSize`
(e.g. `{ pan: false }` plus keeping `moveend` out of the init tail). Either
way, the DM-facing claim to preserve is: a menu the DM opened stays open
until the DM closes it or acts on it.

### TD-101 — Marker drag repositioning never fires `dragend`; its e2e spec was green on a vacuous assertion

**Severity:** 🟠 High · **Effort:** M · **Found:** 2026-08-22, while fixing the
CI break SPEC-016 T7 caused in `map-place-repositioning.spec.ts`

TD-71 / SPEC-005 §5.B — "a DM can drag an already-placed marker to a new spot,
and the new position persists" — does not work, and the e2e spec written to
prove it never could have caught that.

**Why the spec passed anyway.** It read the "before" position from the panel
row (`formatDecimalDegrees(…, 4)` → `"1890.8620, 344.0000"`) and the "after"
position from the marker's native Leaflet popup (`toFixed(6)` →
`"1890.862000, 344.000000"`). Two different formatters over the same numbers,
so `expect(after).not.toBe(before)` was true no matter what the drag did.
SPEC-016 T7 deleted that popup (a landmark click opens the place popover now,
which never shows raw coordinates), which forced both readings onto the panel
row — and comparing like with like, it fails.

**What actually happens.** A probe run on 2026-08-22 recorded the marker's
on-screen bounding box as `{x: 588, y: 129}` both before and after the drag
gesture, and the panel row unchanged immediately after it, before any reload.
So the marker never moves and no optimistic update is committed: `dragend`
never fires. This is not a failure to persist a completed drag.

**Not a SPEC-016 regression.** The same row-based assertion fails identically
with `app/modules/maps/hooks/usePOIManager.ts` reverted to pre-T7 `main` and
everything else left in place (checked that way round, 2026-08-22). T7 only
removed the popup that was hiding it.

**What is not yet known, and is this item's first job:** whether the drag is
broken for a real DM in a browser, or only under Playwright's synthetic mouse
failing to drive Leaflet's `L.Draggable`. The spec's own comment already flags
this as the one interaction in the suite that needs Leaflet's real drag
handling rather than a `dispatchEvent` shortcut, so a harness-only explanation
is plausible — but `draggable: true` is set on both the POI marker
(`usePOIManager.createMarker`) and the navigable one
(`useNavigableChildren`), and neither has been verified by hand. Establish
that first: it decides whether this is a product bug or a test-harness one,
and the two have very different fixes.

`e2e/map-place-repositioning.spec.ts` is `test.fixme` until then, with the
row-based reading left in place so that un-`fixme`ing it yields a real test.
Do not re-green it by comparing two formatters again.
