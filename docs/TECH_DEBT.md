# Technical Debt Register

**Last updated:** 2026-08-18
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**Open items: TD-78, TD-79, TD-81 – TD-96.** Everything else in the summary table is closed.

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

| ID    | Title                                                                                                        | Severity             | Effort | Phase |
| ----- | ------------------------------------------------------------------------------------------------------------ | -------------------- | ------ | ----- |
| TD-01 | ✅ Unauthenticated delete endpoints and Server Actions                                                       | ~~🔴 Critical~~ done | M      | 1     |
| TD-02 | ✅ No input validation, incl. TD-02b's remaining boundaries                                                  | ~~🔴 Critical~~ done | M      | 1–2   |
| TD-03 | ✅ Test suite does not run                                                                                   | ~~🔴 Critical~~ done | M      | 1     |
| TD-04 | ✅ TypeScript errors on `tsc --noEmit`                                                                       | ~~🔴 Critical~~ done | S      | 1     |
| TD-05 | ✅ No ESLint config, no Prettier, no CI                                                                      | ~~🟠 High~~ done     | S      | 1     |
| TD-06 | ✅ Dead code and tutorial leftovers                                                                          | ~~🟠 High~~ done     | S      | 1     |
| TD-07 | ✅ `next`/`react` pinned; single lockfile                                                                    | ~~🟠 High~~ done     | S      | 1     |
| TD-08 | ✅ Metadata and query layer typed; zero `any`, rule is an error                                              | ~~🟠 High~~ done     | M      | 2     |
| TD-09 | ✅ Quartets collapsed into EntityList / EntityLibrary / EntityForm                                           | ~~🟠 High~~ done     | L      | 2     |
| TD-10 | ✅ Toasts (client) vs `logServerIssue` (server) replace the stub                                             | ~~🟠 High~~ done     | M      | 2     |
| TD-11 | ✅ Timestamps + `@@index([nome])`; relations still deferred                                                  | ~~🟡 Medium~~ part   | M      | 2     |
| TD-12 | ✅ Filter list declared once; count and rows can no longer diverge                                           | ~~🟡 Medium~~ done   | S      | 2     |
| TD-13 | ✅ Typed errors with `cause`; 404 vs 500; toasts via TD-10                                                   | ~~🟡 Medium~~ done   | M      | 2     |
| TD-14 | ✅ Map POIs persisted only to `localStorage`                                                                 | ~~🟡 Medium~~ done   | M      | 3     |
| TD-15 | ✅ `e2e/a11y.spec.ts` — zero axe violations, keyboard focus ring                                             | ~~🟡 Medium~~ done   | M      | 2     |
| TD-16 | ✅ Inconsistent formatting                                                                                   | ~~🟢 Low~~ done      | S      | 1     |
| TD-17 | ✅ README does not match reality                                                                             | ~~🟢 Low~~ done      | S      | 1     |
| TD-18 | ✅ `copy-webpack-plugin` forces webpack over Turbopack                                                       | ~~🟢 Low~~ done      | S      | 3     |
| TD-19 | ✅ Mixed Italian/English identifiers (residual set → TD-33)                                                  | ~~🟠 High~~ done     | L      | 2     |
| TD-20 | ✅ Every flag on, incl. `noUncheckedIndexedAccess` (`noUnusedLocals` rejected)                               | ~~🟡 Medium~~ done   | M      | 2     |
| TD-21 | ✅ UI strings hardcoded; app must ship in it + en                                                            | ~~🟠 High~~ done     | L      | 2     |
| TD-22 | ✅ Lint warnings 293 → 0; every rule back to `error`                                                         | ~~🟠 High~~ done     | M      | 2     |
| TD-23 | ✅ Migration drift patched forward; migrations match the schema                                              | ~~🟠 High~~ done     | S      | 1     |
| TD-24 | ✅ Playwright harness + specs; `e2e` job blocking in CI                                                      | ~~🟠 High~~ done     | M      | 1     |
| TD-25 | ✅ Startup reachability check; 503 distinct from 500                                                         | ~~🟡 Medium~~ done   | S      | 2     |
| TD-26 | ✅ `sottoclassi` / `circolo` duplication resolved                                                            | ~~🟡 Medium~~ done   | S      | 2     |
| TD-27 | ✅ Hidden `classi=0` filter on the spells list removed                                                       | ~~🟠 High~~ done     | S      | 2     |
| TD-28 | ✅ Seed ids removed; the database assigns them, as the UI does                                               | ~~🟠 High~~ done     | S      | 2     |
| TD-29 | ✅ Loading skeleton was the tutorial's invoices table                                                        | ~~🟡 Medium~~ done   | S      | 2     |
| TD-30 | ✅ Public list pages actually stream; skeleton matches the content                                           | ~~🟡 Medium~~ done   | S      | 2     |
| TD-31 | ✅ `sortSelectOptions` mutated shared `PageMeta.options` in place                                            | ~~🟡 Medium~~ done   | S      | 2     |
| TD-32 | ✅ E2E job spent 9m a run on `playwright install-deps`                                                       | ~~🟠 High~~ done     | S      | 1     |
| TD-33 | ✅ Italian identifiers TD-19 missed — 16 across 14 files + a directory                                       | ~~🟡 Medium~~ done   | S      | 2     |
| TD-34 | ✅ CI actions pinned to a deprecated Node 20 runtime; Node 22 → 24                                           | ~~🟢 Low~~ done      | S      | 2     |
| TD-35 | ✅ E2E specs assert hardcoded Italian copy instead of reading the catalogue                                  | ~~🟡 Medium~~ done   | M      | 2     |
| TD-36 | ✅ `proxy.ts` matcher let `.jpg` through the auth/i18n gate, breaking map tiles                              | ~~🟠 High~~ done     | S      | 2     |
| TD-37 | ✅ `authenticate()` and `app/lib/connections/**` are 0% covered — the login and DB-bootstrap path            | ~~🟠 High~~ done     | S      | 2     |
| TD-38 | ✅ `fetch*`/`get*Count` untested for deities, magicitems, npc — data layer at 51%, target 90%                | ~~🟠 High~~ done     | S      | 2     |
| TD-39 | ✅ Pure functions in `app/lib/utils/**` at 51%, target 95% — cheapest real coverage in the project           | ~~🟡 Medium~~ done   | S      | 2     |
| TD-40 | ✅ Metadata correctness untested — `npcMeta`/`deityMeta` at 14%/25%, target 80%                              | ~~🟡 Medium~~ done   | S      | 2     |
| TD-41 | ✅ `app/lib/hooks/**` at 52%, target 70% — `useFilterController` entirely untested                           | ~~🟡 Medium~~ done   | S      | 2     |
| TD-42 | ✅ `app/ui/**` behaviour untested — domain forms/cards/libraries at ~0%, target 60%                          | ~~🟢 Low~~ done      | L      | 2     |
| TD-43 | ✅ `app/modules/maps/**` geometry and hooks near 0%, target 50%                                              | ~~🟢 Low~~ done      | M      | 2     |
| TD-44 | ✅ Re-measured coverage with `coverage.all: true`; re-scoped the 70% gap as TD-45/TD-46                      | ~~🟡 Medium~~ done   | S      | 2     |
| TD-45 | ✅ Page-level route components (`app/[locale]/dashboard/**`, `app/ui/geography`) covered                     | ~~🟡 Medium~~ done   | M      | 2     |
| TD-46 | ✅ `app/modules/maps/components/**` (Leaflet rendering, 737 lines) Vitest coverage — Tier 1 and Tier 2 done  | ~~🟡 Medium~~ done   | L      | 2     |
| TD-58 | ✅ Dependabot grouped a major ESLint bump into the dev-dependencies group, breaking CI                       | ~~🟠 High~~ done     | S      | 3     |
| TD-59 | ✅ `prisma` CLI and `@prisma/client`/`@prisma/adapter-pg` could bump independently, breaking the build       | ~~🟠 High~~ done     | S      | 3     |
| TD-61 | ✅ Option-backed `Int` fields accept any number; an out-of-list value renders as a blank cell                | ~~🟠 High~~ done     | S      | 3     |
| TD-62 | ✅ POI category names are hardcoded English and reach the UI — a TD-21 leftover                              | ~~🟢 Low~~ done      | S      | 3     |
| TD-63 | ✅ Local dev DB's migration history had a gap `migrate dev`/`migrate deploy` couldn't get past               | ~~🟡 Medium~~ done   | S      | 3     |
| TD-64 | ✅ `WorldMap.tsx`'s async-effect map-loading pattern trips `react-hooks/set-state-in-effect`                 | ~~🟢 Low~~ done      | S      | 3     |
| TD-65 | ✅ `DATABASE_URL` in this dev environment isn't a throwaway DB — e2e debris landed in real data              | ~~🟡 Medium~~ done   | S      | 3     |
| TD-66 | ✅ `UPLOAD_DIR`'s relative default silently splits map-image files from the DB rows referencing them         | ~~🟡 Medium~~ done   | S      | 3     |
| TD-67 | ✅ "Add to My Places" context-menu label is misleading — it creates any kind, not just a POI                 | ~~🟢 Low~~ done      | S      | 3     |
| TD-68 | ✅ `MapPOIPanel`'s Close button is unclickable — a same-`z-index` overlay intercepts the click               | ~~🟠 High~~ done     | S      | 3     |
| TD-69 | ✅ `poi.linkedType`/`linkedId` has no unique constraint — a second pin per NPC/deity is silently possible    | ~~🟠 High~~ done     | S      | 3     |
| TD-70 | ✅ No rendering path exists for `deity`/`npc` pins on the map, even once positioned                          | ~~🟡 Medium~~ done   | M      | 3     |
| TD-71 | ✅ No way to position or edit a place that already exists — only newly-created ones get coordinates          | ~~🟠 High~~ done     | L      | 3     |
| TD-72 | ✅ `usePOIManager.ts`/`useNavigableChildren.ts` marker HTML uses inline `style`, not Tailwind classes        | ~~🟢 Low~~ done      | S      | 3     |
| TD-73 | ✅ `.env.test.example`'s documented e2e setup (`prisma db push`) leaves a fresh DB unable to seed            | ~~🟡 Medium~~ done   | S      | 3     |
| TD-74 | ✅ `pageMetaFields` spread four domain metas into one flat object — a name collision silently discarded one  | ~~🟡 Medium~~ done   | S      | 3     |
| TD-75 | ✅ `pnpm test` fails on a clean checkout — one suite needs a `DATABASE_URL` that only CI provides            | ~~🟡 Medium~~ done   | S      | 3     |
| TD-76 | ✅ `renderRichText` injects stored text as raw HTML with no sanitisation                                     | ~~🟡 Medium~~ done   | S      | 3     |
| TD-77 | ✅ An entity's location is resolved through two unreconciled read paths                                      | ~~🟡 Medium~~ done   | S      | 3     |
| TD-78 | The NPC admin list lost its Fazione column filter when the field went table-backed                           | 🟢 Low               | M      | 3     |
| TD-79 | The unpositioned-places count doesn't distinguish "blocked on the parent's map" from any other cause         | 🟢 Low               | S      | 3     |
| TD-80 | ✅ Deity, magic-item, and faction create/update Server Actions lack unit and e2e test coverage               | ~~🟡 Medium~~ done   | M      | 2     |
| TD-81 | Every map is framed with the same square default bounds, so any non-square image is stretched                | 🟠 High              | M      | 4     |
| TD-82 | The place in view has no URL of its own — navigating the tree never changes the address bar                  | 🟡 Medium            | S      | 4     |
| TD-83 | The "up" button is unreachable once you descend — it scrolls out of view above the map                       | 🟠 High              | S      | 4     |
| TD-84 | `WorldMap` is `h-screen` inside a padded column, so the bottom-right control stack is clipped below the fold | 🟠 High              | S      | 4     |
| TD-85 | The POI panel's list mode has no entry point, so positioning places and editing POIs are unreachable         | 🟠 High              | M      | 4     |
| TD-86 | "Add marker" drops an ephemeral pin that cannot be removed and does not survive a reload                     | 🟡 Medium            | S      | 4     |
| TD-87 | Zoom out does nothing on a child map — every map opens already at its minimum zoom                           | 🟠 High              | S      | 4     |
| TD-88 | ✅ Sidebar scroll container added; sign-out and locale switcher reachable                                    | ~~🟠 High~~ done     | S      | 4     |
| TD-89 | ✅ `group` ancestor added; chevron rotates on all five disclosure cards                                      | ~~🟢 Low~~ done      | S      | 4     |
| TD-90 | ✅ Icon rotates in a square box now, not the wrapper — incl. two unreported instances found                  | ~~🟢 Low~~ done      | S      | 4     |
| TD-91 | ✅ Places and factions counted; every place in the tree, per the DM                                          | ~~🟡 Medium~~ done   | S      | 4     |
| TD-92 | ✅ Every card links to its domain list via the locale-aware `Link`                                           | ~~🟢 Low~~ done      | S      | 4     |
| TD-93 | An already-positioned place or attached entity can be positioned again elsewhere                             | 🟠 High              | M      | 4     |
| TD-94 | Measurement reports haversine metres on a pixel-space map — superseded by SPEC-015, do not patch alone       | 🟠 High              | M      | 4     |
| TD-95 | The place panel is half-untranslated, with English strings hardcoded in the component                        | 🟡 Medium            | S      | 4     |
| TD-96 | The map's right-click menu carries two entries the model has outgrown                                        | 🟢 Low               | S      | 4     |

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

### TD-81 — Every map is framed with the same square default bounds, so any non-square image is stretched

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

### TD-83 — The "up" button is unreachable once you descend — it scrolls out of view above the map

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

### TD-84 — `WorldMap` is `h-screen` inside a padded column, so the bottom-right control stack is clipped below the fold

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

### TD-85 — The POI panel's list mode has no entry point, so positioning places and editing POIs are unreachable

**Severity:** 🟠 High · **Effort:** M · **Found:** 2026-08-18, from three separate DM reports that turned out to be one defect

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

**Check while implementing:** `handlePOIModeChange` (`WorldMap.tsx:423`) takes
`"list" | "add" | "edit"` and stores it with `setPOIPanelMode(mode as "list" | "add")`.
The runtime value passes through intact, so this is not believed to be the cause
of anything the DM sees — but the cast is a lie to the compiler of exactly the
kind `CLAUDE.md`'s rule 3 exists to prevent, and it sits in the middle of the
code this item touches. Widen the state's type instead of casting.

### TD-86 — "Add marker" drops an ephemeral pin that cannot be removed and does not survive a reload

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

### TD-87 — Zoom out does nothing on a child map — every map opens already at its minimum zoom

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

### TD-94 — The measurement tool reports haversine metres on a pixel-space map, so every distance it gives is meaningless

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

### TD-95 — The place panel is half-untranslated, with English strings hardcoded in the component

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

### TD-96 — The map's right-click menu carries two entries the model has outgrown

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18, reported by the DM

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
