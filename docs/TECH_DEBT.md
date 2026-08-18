# Technical Debt Register

**Last updated:** 2026-08-18
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**Open items: TD-78, TD-79, TD-81 – TD-93.** Everything else in the summary table is closed.

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
| TD-88 | The sidebar cannot scroll, so the last nav items (logout, locale) are unreachable                            | 🟠 High              | S      | 4     |
| TD-89 | `NpcCard`'s chevron never rotates — the `group-*` variant has no marked ancestor                             | 🟢 Low               | S      | 4     |
| TD-90 | `DeityCard`/`MagicItemCard` rotate a non-square wrapper, so the chevron shifts instead of turning in place   | 🟢 Low               | S      | 4     |
| TD-91 | The dashboard counts four domains of six — places and factions were never added                              | 🟡 Medium            | S      | 4     |
| TD-92 | The dashboard's cards are not clickable, so the counts lead nowhere                                          | 🟢 Low               | S      | 4     |
| TD-93 | An already-positioned place or attached entity can be positioned again elsewhere                             | 🟠 High              | M      | 4     |

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

**The fix, in shape:** one control that opens the panel with
`setPOIPanelMode("list")`. Two candidate homes, and the second is better:

- Another floating button in `MapControls`' stack — consistent with the other
  map controls, but that stack is exactly what TD-84 is about, so this depends
  on TD-84 landing first.
- **The unpositioned-places count in `GeographyExplorer`'s header.** It already
  says "41 luoghi non ancora posizionati" and today does nothing; making it the
  button that opens the list gives the number a purpose and puts the entry point
  next to the thing it describes. **The DM's first instinct was to delete that
  count as useless (reported 2026-08-18); this is the counter-proposal, and it
  needs the DM's agreement before implementing** — if they still want it gone,
  the control moves to the map instead and the count is removed separately.

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

**The real question is not how to persist them — it is what this menu item is
for.** POIs already exist, are persisted (SPEC-002 / TD-14), are scoped to the
place in view, and can carry a category, a description and a linked entity. An
unnamed, unsaved marker duplicates the POI's job while doing it worse.
`useMapMarkers` is vendored-library scaffolding (`app/modules/maps/` — see
`CLAUDE.md`'s "unused is not dead" entry), not something this app's flows asked
for.

**Recommended fix: remove the menu item**, and leave `useMapMarkers` in place as
inventory. That is a deletion, which this codebase prefers, and it removes a
dead end the DM has already walked into once. **Ask before doing it** — if
"drop a quick pin I don't have to name" is a flow the DM actually wants, then
the answer is the opposite one (persist markers as a POI category), and that is
a spec, not this item.

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

### TD-88 — The sidebar cannot scroll, so the last nav items (logout, locale) are unreachable

**Severity:** 🟠 High · **Effort:** S · **Found:** 2026-08-18, reported by the DM

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

### TD-89 — `NpcCard`'s chevron never rotates — the `group-*` variant has no marked ancestor

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18, reported by the DM

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

### TD-90 — `DeityCard`/`MagicItemCard` rotate a non-square wrapper, so the chevron shifts instead of turning in place

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18, reported by the DM ("opening the card moves the arrow until it touches the border")

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

### TD-91 — The dashboard counts four domains of six — places and factions were never added

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-08-18, reported by the DM

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

### TD-92 — The dashboard's cards are not clickable, so the counts lead nowhere

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18, requested by the DM

`Card` (`app/ui/dashboard/cards.tsx:37`) renders a static tile. Seeing "142
spells" and wanting to go to the spells list is the obvious next move, and there
is nothing to click.

**The fix, in shape:** wrap each card in the locale-aware `Link` from
`@/i18n/navigation` (not `next/link` — the locale segment matters, TD-21) and
point it at that domain's list page. Do this after TD-91, so the two new cards
get their links in the same pass rather than being added and then linked.

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

**Two decisions the DM has to make before this can be implemented**, and they
are product decisions, not technical ones:

1. **Refuse, or move?** Blocking the second placement matches the report
   literally ("first you have to remove it"). Offering "this is already at X —
   move it here?" is fewer steps and loses nothing, since the old position is
   being abandoned either way.
2. **Does this apply to places, entities, or both?** The report names NPCs,
   deities and places together, but they do not share a mechanism: a place
   carries its own `lat`/`lng`, while an entity carries a reference to a place
   (SPEC-008 T8). The constraint is therefore two different pieces of work that
   happen to answer the same complaint.

**Sized M, not S,** because the honest fix has a database half (a constraint, so
the invariant holds regardless of which code path writes) and a UI half (a
message that explains the refusal, in both catalogues). A UI-only check is not
worth doing: it is the path that has already failed here once.
