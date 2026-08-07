# SPEC-005: Place repositioning

- **Status:** Draft
- **Date:** 2026-08-07
- **Phase:** 3
- **Related:** TD-71, SPEC-002 (map POI persistence), SPEC-004 (world model / place hierarchy)

---

## 1. Problem

A DM can give a place a position only at the moment of creating it — right-click the map, "Add Place," pick the exact spot. Once a `region`, `plane`, `city`, `dungeon`, `deity`, `npc` or `poi` exists, nothing in the app lets the DM select it and say "place it here" or "move it there." The only workaround is deleting and recreating the place, which loses everything that made it what it was (a linked deity/npc, or a region's own children underneath it).

This is invisible for `poi` rows created through the normal flow, because they are always placed at creation. It became visible with SPEC-004's seeded tree: 166 places exist with `lat`/`lng` left `null` by design ("assigned a parent, not yet placed"), and there is currently no way to see them on a map at all — the three marker-rendering hooks (`usePOIManager`, `useNavigableChildren`, `useLinkedEntityMarkers`) all skip rows with null coordinates, so an unplaced place renders nothing.

## 2. Goal

A DM can select any existing place — any kind — and give it a position or change its position on its parent's map, without deleting and recreating it.

## 3. Non-goals

- **No tree/breadcrumb UI.** `GeographyExplorer` already navigates by descending into map markers, not a list; this spec does not build a general-purpose place tree. It adds only the minimum picker needed to reach an _unplaced_ child (see §5) — an unplaced place currently has no marker to click, so a list is the only way to reach it.
- **No reparenting.** Moving a place to a different parent (changing `parentId`) is out of scope. This spec only ever changes `lat`/`lng` within the place's existing parent's map.
- **No bulk/multi-select repositioning.**
- **No change to creation-time placement** (right-click → Add Place). That flow is unaffected.
- **No undo/redo.** A drag or a re-pick is immediate, same as every other mutation in this app today.
- **No mobile/touch-specific drag affordance beyond what Leaflet's own `draggable` marker option provides for free.**

## 4. User stories

- As a DM, I want to place one of the 166 seeded-but-unplaced places (a region, a city, an NPC) onto its parent's map, so the tree I built is actually usable, not just data.
- As a DM, I want to drag an existing marker to a new spot when I misjudged the map, so I don't have to delete and recreate it and lose its links/children.
- As a DM, I want repositioning to work the same way regardless of kind (`poi` vs `region` vs `deity`), so I don't have to remember a different flow per kind.

## 5. Behaviour

Two independent interactions, both landing on the same mutation (see §6):

**A. Position an unplaced place (picker → click-to-place)**

1. `MapPOIPanel`'s existing "list" view gains a collapsible "Da posizionare (N)" section, rendered above the current filtered POI list, visible only when the currently-open map has at least one unplaced child. It lists any row with `parentId` = current map's id and `lat`/`lng` both `null`, regardless of `kind` — today the panel's list only ever shows `kind:"poi"` rows, so this section must be fed by `fetchPlaceChildren` rather than `usePOIManager`'s poi-only fetch. No new panel/component; same file, same view mode.
2. Selecting one and choosing "Position on map" enters the existing crosshair/`isSelectingPOILocation` mode (`WorldMap.tsx`), but targets an _update_ of that place's row instead of a _create_.
3. Clicking the map sets `lat`/`lng` on the selected place via `updatePoi` (see §6) and the corresponding marker hook now renders it (it no longer fails the null-coordinate filter).
4. Cancelling the picker/mode leaves the place unplaced, unchanged.

**B. Reposition an already-placed marker (drag)**

1. Every marker `usePOIManager`, `useNavigableChildren` and `useLinkedEntityMarkers` render becomes Leaflet-draggable (`draggable: true`).
2. On `dragend`, the hook reads the marker's new `LatLng` and calls `updatePoi({ id, lat, lng })`, optimistically moving the marker (it already sits at the drop point — no snap-back needed on success) and reverting position + surfacing a toast on failure, matching `usePOIManager.updatePOI`'s existing optimistic-update/revert pattern.
3. `useNavigableChildren` and `useLinkedEntityMarkers` are currently read-only render hooks with no mutation path — this is new plumbing for both, not a copy of something that already exists there.

**Edge cases**

| Situation                                                                                                 | Expected behaviour                                                                                      |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Drag a `region`/`plane`/`city`/`dungeon` marker (a navigable place with its own sub-map)                  | Only its position on the _parent's_ map changes; its own map/bounds/children are untouched.             |
| Drag ends outside the currently-loaded map's tile bounds                                                  | Allowed — same as any other lat/lng today; no bounds validation exists for `poi` either.                |
| Picker is open (mode A) and the DM navigates to a different map (descends/ascends)                        | Selecting mode is cancelled, matching how `isSelectingPOILocation` already behaves for the create flow. |
| Two DMs (rare, single-user app today, but the pattern exists elsewhere) drag the same marker concurrently | Out of scope — this app has no concurrent-edit handling anywhere yet.                                   |
| A `deity`/`npc` place's linked entity is deleted elsewhere while it has a position                        | Unaffected by this spec — same as today.                                                                |

## 6. Data model changes

None. `prisma.poi` already stores `lat`/`lng` as nullable columns for every kind (`app/lib/definitions/interfaces/maps/PlaceChild.ts`), and `updatePoi.ts` (`app/lib/data/maps/updatePoi.ts`) already issues `prisma.poi.update({ where: { id }, data: { lat, lng, ... } })` with no `kind` filter — it is not structurally poi-only, only every _caller_ today happens to be. Reusing it for any kind requires no schema or query change, only a caller that passes a non-`poi` id — confirmed safe as long as the caller never also sends `category` (which is validated as a `poi`-only enum and would wrongly write a category value onto a non-poi row).

- Backfill needed? No.
- Reversible? N/A, no schema change.

## 7. Metadata changes

None. This is entirely inside `app/modules/maps/`, not the `PageMeta`-driven domain pages.

## 8. Acceptance criteria

- [ ] A DM can select any unplaced place (any `kind`) from a picker scoped to the current map and give it a position by clicking the map.
- [ ] A DM can drag any placed marker (any `kind`) to a new position on its current map.
- [ ] Both paths call `updatePoi` with only `{ id, lat, lng }` — never `category` for a non-`poi` row.
- [ ] A failed drag reverts the marker to its prior position and surfaces a toast, matching `usePOIManager.updatePOI`'s existing pattern.
- [ ] Repositioning a navigable place (`region`/`plane`/`city`/`dungeon`) does not alter its own `mapImage`/`mapBounds`/children.
- [ ] Every new mutation call still goes through `requireSession` (already true inside `updatePoi` — no new mutation is being added, only new callers).
- [ ] Marker HTML/styling added or touched in this work uses Tailwind classes, never inline `style` (CLAUDE.md rule #8 — this bit `useLinkedEntityMarkers.ts` before, TD-70).
- [ ] Coverage has not dropped.

## 9. Implementation plan

**Shape.** Two independent slices sharing one mutation. Flow A (picker) is new state in `WorldMap` plus a new data hook and a new panel section; flow B (drag) is a per-hook change in each of the three marker hooks. Neither needs a server action, a schema change, or a metadata change — `updatePoi` already does the write for any kind (§6).

**What already exists and is reused, not rebuilt**

- `updatePoi` (`app/lib/data/maps/updatePoi.ts`) — the mutation, `requireSession`-guarded, kind-agnostic.
- `WorldMap`'s crosshair mode — `isSelectingPOILocation` + `handleMapClick` + `handleMapMouseMove` + the live cursor readout (`WorldMap.tsx:71,183-202`). Flow A adds a second reason to be in that mode, it does not add a second mode.
- `usePOIManager`'s optimistic-update/revert pattern — `updatePOI` (`usePOIManager.ts:392-446`) commits optimistically, enqueues the server call, and restores `previous` on failure. Its marker-redraw effect (`usePOIManager.ts:296-323`) rebuilds all markers from `pois` state, so a revert snaps the marker back with no extra marker code.
- `placesRefetchToken` (`WorldMap.tsx:100-107`) — the existing "a place changed, reload the non-poi marker hooks" signal.

**Files touched, in order**

| #   | File                                                                       | Change                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `app/modules/maps/hooks/useUnplacedChildren.ts` (new)                      | Data-only hook: `fetchPlaceChildren(parentId)`, keep rows where `lat` or `lng` is `null`, return `{ id, title, kind }[]`. Same `refetchToken` convention as the other two child hooks. No Leaflet, no map.                                                                                                                                             |
| 2   | `messages/it.json`, `messages/en.json`                                     | New `geography` keys: section title + count, the "position on map" action, the positioning-cancelled/failed toasts. Both locales together — `messages.test.ts` asserts parity.                                                                                                                                                                         |
| 3   | `app/modules/maps/components/map/MapPOIPanel.tsx`                          | New `unplacedChildren` prop + `onPositionPlace(id)` callback. Collapsible "Da posizionare (N)" section in the `list` view, above the filtered POI list, rendered only when non-empty. Presentational — no fetching, no mutation.                                                                                                                       |
| 4   | `app/ui/geography/WorldMap.tsx`, `app/modules/maps/hooks/usePOIManager.ts` | Wire flow A: `useUnplacedChildren`, `positioningPlaceId` state, `handleMapClick` branches to `updatePoi({ id, lat, lng })` when positioning. On success bump `placesRefetchToken`, refetch unplaced, and reload the POI list — which needs `usePOIManager` to expose its existing internal `loadPOIs` as `reloadPOIs` (one-line export, no new logic). |
| 5   | `app/modules/maps/hooks/usePOIManager.ts`                                  | Flow B for `poi`: `draggable: true` on the marker in `createMarker`, `dragend` → existing `updatePOI(id, { lat, lng })`. Nothing else — optimism, revert and redraw are already there.                                                                                                                                                                 |
| 6   | `app/modules/maps/hooks/useNavigableChildren.ts`                           | Flow B for navigable kinds: `draggable: true`, `dragend` → optimistic `setChildren` + `updatePoi` + revert-and-toast on failure. **Also must not descend on drop** — see Risks.                                                                                                                                                                        |
| 7   | `app/modules/maps/hooks/useLinkedEntityMarkers.ts`                         | Flow B for `deity`/`npc`: same change as #6, no click/descend complication.                                                                                                                                                                                                                                                                            |
| 8   | `e2e/` (spec name TBD at implementation)                                   | One spec covering both flows end to end against real rows.                                                                                                                                                                                                                                                                                             |
| 9   | `docs/TECH_DEBT.md`, this file §11                                         | TD-71 closure write-up; spec outcome.                                                                                                                                                                                                                                                                                                                  |

**Risks**

- **A drag on a navigable marker must not also descend into it.** `useNavigableChildren` binds `click` → `onDescend` (`useNavigableChildren.ts:130`). Leaflet usually suppresses the synthetic click after a drag, but "usually" is not a guarantee across versions and touch. Guard explicitly (a `dragend`-set flag swallowing the next `click`, or checking the marker's drag state) and cover it with a test — an accidental map change on every reposition would be the most annoying possible bug here.
- **Never send `category` for a non-`poi` row.** `buildPoiUpdateSchema` is not discriminated by kind (§6), so a `category` sent alongside a `region` id would validate and write. Both flows must send `{ id, lat, lng }` only.
- **TD-72 touches the exact lines flow B touches** (inline `style` in `usePOIManager.ts` and `useNavigableChildren.ts`'s marker HTML). **Do TD-72 first, as its own commit**, so the drag change lands on already-clean markup rather than being mixed with a styling fix — one logical change per commit, and TD-72 is an S.
- Four separate `fetchPlaceChildren(parentId)` calls will now exist per map (poi, navigable, linked, unplaced). This mirrors the pattern already in place rather than fixing it; if it becomes a measurable problem it is its own debt item, not scope here.

**Open questions**

- Should a placed place be able to go _back_ to unplaced (coordinates cleared)? Treated as out of scope for now — no UI proposed for it. Flag it if it turns out to be needed while implementing.

## 10. Task breakdown

- [ ] **T0** — Land TD-72 first (inline `style` → Tailwind in `usePOIManager.ts` / `useNavigableChildren.ts` marker HTML). Not part of this spec; sequenced here because T5/T6 rewrite the same lines. _(test: existing hook suites stay green)_
- [ ] **T1** — `useUnplacedChildren` hook. _(test: new `useUnplacedChildren.test.ts` — returns rows missing either coordinate, across all kinds; excludes fully-placed rows; refetches on `refetchToken`)_
- [ ] **T2** — Panel section: `unplacedChildren` + `onPositionPlace` props, collapsible "Da posizionare (N)" above the POI list, plus both message catalogues. _(test: `MapPOIPanel.test.tsx` — section absent when the list is empty, one row per unplaced child, action fires `onPositionPlace` with the right id; `messages.test.ts` parity)_
- [ ] **T3** — Flow A wiring in `WorldMap` + `reloadPOIs` exposed from `usePOIManager`. _(test: `WorldMap` suite — choosing a place enters crosshair mode, the next map click calls `updatePoi` with `{ id, lat, lng }` and nothing else, success triggers the three reloads, failure toasts and leaves the place unplaced)_
- [ ] **T4** — Flow B for `poi` in `usePOIManager`. _(test: `usePOIManager.test.ts` — `dragend` calls `updatePoi` with the new coordinates; a rejected call reverts the POI's coordinates in state)_
- [ ] **T5** — Flow B for `useNavigableChildren`, including the no-descend-on-drop guard. _(test: dragging fires the update and not `onDescend`; failure reverts the marker; a plain click still descends)_
- [ ] **T6** — Flow B for `useLinkedEntityMarkers`. _(test: same as T5 minus the descend case)_
- [ ] **T7** — E2E covering both flows: position a seeded unplaced place, then drag it somewhere else, and assert both survive a reload. _(test: is the test)_
- [ ] **T8** — Close TD-71 in `docs/TECH_DEBT.md`; fill §11 below. _(test: n/a)_

## 11. Outcome

_Fill in at close._
