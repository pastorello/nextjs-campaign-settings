# SPEC-017: One pool of unplaced places

- **Status:** **Agreed 2026-09-05** — all four §9 questions decided with the DM, and [ADR-0012](../adr/0012-placement-writes-the-tree-edge.md) accepted alongside: no confirmation when a place is taken from another map; the landmark un-place (T10) is in scope, not cut; the campaign-wide count stays campaign-wide; "Da altre mappe" is flat and alphabetical with the parent named per row.
- **Date:** 2026-09-04
- **Phase:** 4
- **Related:** [ADR-0012](../adr/0012-placement-writes-the-tree-edge.md) (accepted 2026-09-05, the decision this spec implements) · [ADR-0009](../adr/0009-world-tree-as-one-polymorphic-table.md) (the tree `parentId` builds) · [ADR-0010](../adr/0010-entity-location-as-stored-reference.md) (the `zoneId`/`poiId` invariant this must maintain) · [SPEC-005](./005-place-repositioning.md) (repositioning, which this is not) · [SPEC-007](./007-placement-backlog.md) (the unpositioned count) · [SPEC-009](./009-zones-as-areas.md) §7 (the placement checks) · [SPEC-010](./010-deleting-a-place.md) (the other writer of `parentId`) · [SPEC-016](./016-place-popover.md) T5 (un-placing, the pool's only entrance) · TD-85, TD-93, TD-102, TD-103 (the interim fix this supersedes), TD-105

---

## 1. Problem

A place parked under the wrong parent is stuck there for good.

"Posiziona luogo" — the map's right-click entry — offers only the direct children of the map the DM is standing on (`useUnplacedChildren(parentId)` filters `fetchPlaceChildren(parentId)` down to the rows with no coordinates). So a city created under the wrong region can be positioned on that region's map and nowhere else. Nothing in the application re-parents anything: `createPlace` and `createRootPlace` write `parentId` once at creation, `deletePlace` rewrites it only as a consequence of a deletion, and every other writer of `zone` (`updateZonePosition`, `updateZoneMap`, `updateZoneGrid`, `updateZoneDetails`, `unplacePlace`) leaves the tree edge alone.

The DM's framing, on 2026-08-30 while testing the map: this makes the per-map pool not merely inconsistent but a cage. Moving a place from one map to another is a capability the app does not have, and the single pool _is_ how it gets delivered — picking a pooled place while viewing map X should write `parentId = X` alongside the coordinates.

Two smaller things sit on top of the same request. A DM who un-places something (SPEC-016 T5) and then navigates away has no way back to it except by remembering where it was; and a landmark cannot be sent to the pool at all, so for landmarks the cage has no door in either direction.

## 2. Goal

Every unplaced place in the campaign is offered on every map, and choosing one there both positions it and moves it under that map.

## 3. Non-goals

- **Moving an already-placed place directly between maps.** The DM's own rule stands — "remove it from where it is before placing it elsewhere" (TD-93, SPEC-016 §5) — so a move is un-place, navigate, place. The pool is the transit point, not a bypass of the one-place-one-position invariant.
- **Restoring an area's footprint when a place is re-placed.** `unplacePlace` clears `footprint` deliberately; a place taken from the pool lands as a point, and its area is drawn again from the popover's "Modifica" (TD-104). Not a regression this spec introduces — today's behaviour, kept.
- **A kind-compatibility rule.** Nothing today refuses a `plane` placed inside a `city`, and this spec does not add such a rule. `kind` stays a closed vocabulary about what a place _is_, not a constraint on where it may sit (ADR-0009).
- **The two-way delete dialog** ("elimina definitivamente" vs "rimuovi dalla mappa" as one question) — the DM's second request of 2026-08-30, recorded in `ROADMAP.md`. It touches SPEC-010's rule 2 and a cascade that does not exist; its own spec.
- **TD-79's distinction** between "blocked on an ancestor's missing map" and "not yet drawn". The single pool makes the first category placeable anywhere, which is adjacent, but the count's wording is still out of scope.
- **An admin list for places, breadcrumbs, or `?place=` URL state** (TD-82). The pool is reached from the map, as today.
- **Undo.** Un-placing already destroys the coordinates, so a mis-move cannot return a place to the exact pixel it came from. It can always be moved back to the right parent, which is the loss that matters.

## 4. User stories

- As a DM, I want to place a place that currently lives under a different map, so that one created in the wrong region is not stuck there forever.
- As a DM, I want each pooled place to say where it currently sits, so that I can tell two "Tempio" apart before I take one.
- As a DM, I want the app to refuse to drop a place inside something it contains, so that I cannot break the tree by hand.
- As a DM, I want an NPC standing at a landmark to still report the right location after that landmark moves to another map, so that my entity lists stay honest.
- As a DM, I want to send a landmark back to the unpositioned places the way I can a zone, so that the move works for landmarks too.

## 5. Behaviour

**Main flow**

1. The DM right-clicks a map and opens "Posiziona luogo". The entry is enabled when the pool is non-empty for this map, disabled otherwise (TD-103's rule, unchanged), and its sublabel keeps carrying the campaign-wide count — information about the campaign, never a claim about this map.
2. The dropdown lists **every** unplaced place in the campaign — zones and landmarks alike — in two groups: **"Qui"**, the children of the map in view (today's list, so the common case is where it has always been), and **"Da altre mappe"**, everything else — one flat alphabetical list, not sub-grouped by parent — each row labelled with the place it currently belongs to ("Tempio — da «Regno di Kang»"). A filter box above the list narrows by title.
3. The DM picks one. It is positioned at the exact point the right-click was aimed at (TD-85), and, if it came from another map, moved under this one in the same write.
4. A toast confirms: a plain "«Tempio» posizionato" for a local child, "«Tempio» spostato da «Regno di Kang»" for a move.
5. The place disappears from the pool everywhere and appears as a marker here.

**Edge cases**

| Situation                                                                | Expected behaviour                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The pool is empty                                                        | The entry is disabled, as today. With one pool this now means the whole campaign is placed, not merely this map's children — the state TD-103 could not express.                                                                                                                                                                                         |
| The pooled place contains the map in view                                | Refused, at the mutation: placing "Terra" inside "Regno di Kang", which is under Terra, would cut the subtree off the root. The row is also omitted from the list on that map, so the refusal is a backstop, not the DM's first encounter with the rule.                                                                                                 |
| The pooled place _is_ the map in view                                    | Same refusal, same reason — reachable, since an unplaced zone still has its own map and can be opened from a search result (SPEC-011 T4).                                                                                                                                                                                                                |
| The place was placed by another tab since the list was read              | Refused with the existing `alreadyPlaced` code and message; the pre-state travels inside `updateMany`'s `where`, so Postgres refuses it, not the client snapshot (TD-93).                                                                                                                                                                                |
| The point falls inside a sibling area                                    | Refused by `checkPointPlacement` (SPEC-009 §7) — run against the **target** parent, not the place's stored one.                                                                                                                                                                                                                                          |
| A landmark moves to another map while NPCs or deities are attached to it | Their `zoneId` follows the landmark to its new zone, in the same transaction. `poiId` is untouched. This is ADR-0010's invariant, the same agreement `deletePlace` maintains across its seven writes.                                                                                                                                                    |
| A zone with children moves                                               | The whole subtree travels with it. Children keep their coordinates — they are positioned on the moved zone's own map, which has not changed — and no entity write is needed: entities point at the zone or at its landmarks, and neither reference changes.                                                                                              |
| A zone that is an area is taken from the pool                            | It lands as a point. Un-placing cleared its footprint (SPEC-016 T5); re-drawing the area is a separate act (TD-104).                                                                                                                                                                                                                                     |
| The place was deleted since the list was read                            | Refused as "does not exist", the shape `placeLandmark` and `updateZonePosition` already return.                                                                                                                                                                                                                                                          |
| Very large pool                                                          | 41 unplaced places on the DM's own database today. The list is scroll-capped and filterable; the group headings keep the local children reachable without scrolling. Beyond roughly a hundred a dropdown stops being the right surface — named as a risk in §9, not solved here.                                                                         |
| The campaign-wide count and the list disagree                            | Expected and legible: the count is campaign-wide, the list is what can be placed _here_ (ancestors of this map are excluded). **But the count is also wrong today** — `countUnpositionedPlaces` counts `zone` rows only, while the list has offered unplaced landmarks since the `zone`/`poi` split. The single pool makes the gap visible; T7 fixes it. |
| The root                                                                 | Never in the pool: it has no parent, `countUnpositionedPlaces` excludes it, and `unplacePlace` refuses it.                                                                                                                                                                                                                                               |

## 6. Data model changes

**None.** No Prisma schema change, no migration. That is the main reason this is affordable.

```prisma
// unchanged — zone.parentId is already nullable, poi.zoneId already NOT NULL
```

What does change is what those columns _mean_ while a row is unplaced, and it is a decision rather than an observation:

- **An unplaced row keeps its old `parentId` / `zoneId`, and nothing reads it until the row is placed again.** It is where the place came from, not where it is; the placement overwrites it.
- **`zone.parentId` is not made nullable and `poi.zoneId` is not either.** Making the edge nullable would model "in the pool, belonging to nothing" honestly, at the cost of a migration, a nullable foreign key on a `NOT NULL` column that every read of `poi` currently trusts, and a second representation of "unplaced" alongside `lat IS NULL`. Two columns able to disagree about one fact is precisely the shape ADR-0009 and ADR-0010 were both written to avoid.
- **The consequence, stated so it is not discovered later:** the old parent is a stale value with no UI showing it, except the one place this spec deliberately does show it — the pool row's "da «X»" label, which is honest about being provenance.

- Backfill needed? No.
- Reversible? Yes — nothing is dropped, and the spec adds no column to migrate back.

## 7. Metadata changes

**None.** A place has no `PageMeta` and no `pagesConfig` entry, deliberately: `ARCHITECTURE.md` records that "a place is a map annotation edited from a panel, not a browsable, filterable catalogue page", and ADR-0011's test agrees — places have no list page and no header filters of their own. This spec adds no field to any domain; it changes which rows a map's picker offers and what a placement writes.

## 8. Acceptance criteria

- [ ] The "Posiziona luogo" dropdown on any map lists every unplaced place in the campaign, zones and landmarks alike, not only the children of that map
- [ ] Each row from another map states which place it currently belongs to
- [ ] The rows are grouped, with the map's own unplaced children first
- [ ] A filter box narrows the list by title
- [ ] Picking a place from another map positions it **and** writes `parentId` (zone) or `zoneId` (landmark) to the map in view, in one write
- [ ] Picking a local child behaves exactly as it does today
- [ ] Placing a zone onto a map contained by that zone — or onto its own map — is refused, with a message naming the reason, and the offending rows are absent from that map's list
- [ ] Moving a landmark carries the `zoneId` of every NPC and deity attached to it, in the same transaction; `poiId` is unchanged
- [ ] A failed or refused move leaves every row exactly as it was
- [ ] The target parent, not the stored one, is what SPEC-009 §7's placement checks run against
- [ ] A landmark can be sent back to the unpositioned places from its popover, and reappears in the pool
- [x] The campaign-wide count counts what the list offers, landmarks included _(T7)_
- [ ] `placeLandmark` is the only writer of `poi.zoneId` outside creation and deletion
- [ ] Every new or changed mutation rejects an unauthenticated request
- [ ] Every new or changed mutation rejects invalid input with field-level errors
- [ ] Every new user-facing string exists in both `messages/it.json` and `messages/en.json`
- [ ] Coverage has not dropped

## 9. Implementation plan

**ADR first.** "Placing a place writes the tree edge" changes what a placement _is_ — until now, position and parentage were written by different acts, and `parentId` was set once at creation. That, plus §6's decision to leave a stale edge on an unplaced row rather than make it nullable, plus the first interactive Prisma transaction in this codebase (see risks), is [ADR-0012](../adr/0012-placement-writes-the-tree-edge.md) — written 2026-09-04, **`Accepted` 2026-09-05**, so T1 is closed before T2 opens rather than left to an audit to notice.

**One thing the ADR surfaced that changes this plan.** `updatePoi` already spreads `...(zoneId !== undefined && { zoneId })` into its update, so the capability to move a landmark between zones exists in the mutation today and maintains none of ADR-0010's follow-through. It is unreachable — `usePOIManager` is its only caller and never sends the key (`usePOIManager.ts:255`) — but leaving it there once `placeLandmark` carries the invariant means two doors to one state change, one of which breaks it silently. T6 closes it by dropping `zoneId` from the update schema: nothing sends it, and deleting an unreachable capability is cheaper than maintaining an agreement across two writers.

**Files touched, in order**

| #   | File                                                                                                                | Change                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [`docs/adr/0012-placement-writes-the-tree-edge.md`](../adr/0012-placement-writes-the-tree-edge.md)                  | ✅ Written and accepted 2026-09-05                                                                                                                      |
| 2   | `app/lib/data/maps/fetchUnplacedPlaces.ts` (+ test)                                                                 | New read: every `zone` with `lat: null, parentId: { not: null }` and every `poi` with `lat: null`, each with its current parent's title                 |
| 3   | `app/lib/definitions/interfaces/maps/UnplacedPlace.ts`                                                              | New — `{ id, title, kind, parentId, parentTitle }`, the shape the picker consumes                                                                       |
| 4   | `app/lib/data/maps/placeZone.ts` (+ test)                                                                           | New — extracted from `updateZonePosition`'s `intent: "place"` branch, unchanged behaviour, then given a target `parentId` and the cycle refusal         |
| 5   | `app/lib/data/maps/updateZonePosition.ts`                                                                           | Loses the `place` branch and the `intent` discriminator; reposition and resize only                                                                     |
| 6   | `app/lib/data/maps/placeLandmark.ts`, `app/lib/data/maps/updatePoi.ts`, `app/lib/data/maps/validation/poiSchema.ts` | Takes a target `zoneId`; writes `poi.zoneId` and follows `npc`/`deities.zoneId` in one transaction — and `updatePoi` loses its own unreachable `zoneId` |
| 7   | `app/lib/data/maps/unplaceLandmark.ts` (+ test)                                                                     | New — the landmark half of SPEC-016 T5                                                                                                                  |
| 8   | `app/lib/data/maps/countUnpositionedPlaces.ts`                                                                      | Counts unplaced landmarks too                                                                                                                           |
| 9   | `app/modules/maps/hooks/useUnplacedChildren.ts`                                                                     | Becomes `useUnplacedPlaces(refetchToken)` — campaign-wide, no `parentId` argument                                                                       |
| 10  | `app/ui/geography/WorldMap.tsx`                                                                                     | Passes the target parent to the mutations; excludes the current stack's ancestors from the list; the move toast                                         |
| 11  | `app/modules/maps/components/map/MapContextMenu.tsx`                                                                | Groups, provenance labels, filter box, scroll cap                                                                                                       |
| 12  | `app/ui/geography/PlacePopover.tsx`                                                                                 | The landmark variant gains "Sposta nei luoghi non posizionati"                                                                                          |
| 13  | `messages/it.json`, `messages/en.json`                                                                              | Group headings, filter placeholder, provenance label, move toast, cycle refusal                                                                         |
| 14  | `e2e/map-move-between-maps.spec.ts`                                                                                 | New spec — the move, the refusal, the entity follow-through                                                                                             |
| 15  | `docs/ROADMAP.md`, `docs/TECH_DEBT.md`, `docs/specs/README.md`, SPEC-007/SPEC-016 cross-notes                       | Close the roadmap entry and TD-103's "interim" note                                                                                                     |

**Risks**

- **The entity invariant is application-level.** ADR-0010 says so outright: Postgres cannot express `npc.zoneId = poi.zoneId` without a trigger. A landmark move that forgets the follow-through produces exactly the inconsistent row that invariant exists to prevent, and nothing will complain. This is why the follow-through is one transaction and has its own test, not a code comment.
- **The first interactive transaction in this codebase.** Every existing `$transaction` (six call sites: `deletePlace`, `fetchCardData`, the four `reorder*`) is the array form, which cannot branch — a guarded `updateMany` whose count decides whether the following writes should happen at all needs `prisma.$transaction(async (tx) => …)`. New pattern, hence the ADR.
- **The pool is a client snapshot and always will be.** Every refusal that matters is enforced in the database (`updateMany`'s `where`, the descendant check inside the same mutation); the list is an affordance, never the guard.
- **The refresh path is not `revalidatePath`.** TD-105 established that all 48 calls match nothing and that nothing is cached anyway — the pool refreshes through the existing `placesRefetchToken` convention, and no comment in this work should attribute a refresh to revalidation.
- **Two doors to one state change.** `updatePoi` can already write `poi.zoneId` and maintains none of ADR-0010's follow-through; it is unreachable today only because its one caller omits the key. T6 closes it in the same commit that opens the intended door — not afterwards.
- **Scale.** 41 rows in a dropdown is workable with grouping and a filter; several hundred is not. If the DM's pool grows, the surface becomes a panel or a modal, and the captured right-click point travels with it.
- **A wider blast radius than the UI suggests.** `updateZonePosition` is called from three flows and `placeLandmark` from one; splitting the place branch out is the change most likely to be got wrong quietly, which is why T3 is a pure refactor with no behaviour change of its own.

**Decided 2026-09-05**, with the DM — every question answered as recommended, so the reasoning below is the record of why, not a live debate.

1. **No confirmation when a place is taken from another map.** The row names its current parent before the pick and the toast names the move after it; un-placing — the destructive half, since it discards the coordinates — already asks nothing (SPEC-016 §9, agreed 2026-08-21), so a dialog on the constructive half would be inconsistent.
2. **The landmark un-place (T10) is in this spec, not the next one.** Without it the pool has no entrance for landmarks and the goal in §2 would ship half-working — today a landmark reaches the pool only as a side effect of deleting its zone (SPEC-010 T1).
3. **The campaign-wide count stays campaign-wide.** It is not narrowed to what can be placed on the map in view: TD-103's framing holds — information about the campaign, never a claim about this map — so count and list may legitimately differ by the ancestors this map excludes.
4. **"Da altre mappe" is flat and alphabetical**, with each row naming its current parent, rather than sub-grouped by parent: grouping buys structure the DM does not navigate by, and makes the filter's results jump between headings. The two top-level groups, "Qui" first, stay.
5. **ADR-0012 is accepted with clause 1 intact** — placement is the only act that re-parents, and no separate `movePlace` mutation is introduced.

## 10. Task breakdown

- [x] **T1** — [ADR-0012](../adr/0012-placement-writes-the-tree-edge.md) agreed and moved to `Accepted`; §9's four questions decided **(2026-09-05)** _(no test — a docs commit)_
- [x] **T2** — `fetchUnplacedPlaces` + the `UnplacedPlace` shape: zones and landmarks, campaign-wide, each with its current parent's title _(test: unit — both tables merged, root excluded, placed rows excluded, auth required)_
- [x] **T3** — Extract `placeZone` from `updateZonePosition`'s `intent: "place"` branch; `updateZonePosition` keeps reposition and resize; call sites updated _(test: the existing `updateZonePosition` place-branch tests move to `placeZone.test.ts` and stay green — pure refactor, no behaviour change)_
- [x] **T4** — `placeZone` takes a target `parentId`, writes it with the coordinates in one guarded `updateMany`, and runs SPEC-009 §7's checks against that parent _(test: unit — the edge is written, a stale "already placed" is still refused, the checks use the target)_ — and refuses the root, which becomes placeable the moment the edge is writable; T5's descendant check subsumes it but names the reason less well
- [ ] **T5** — `placeZone` refuses a cycle: the target may not be the place itself or any of its descendants _(test: unit — self, direct child, grandchild all refused with a named error; a sibling accepted)_
- [ ] **T6** — `placeLandmark` takes a target `zoneId`; `poi.zoneId` and the `zoneId` of every NPC and deity with that `poiId` move together in one transaction _(test: unit — the invariant holds after the move; a refused placement writes nothing at all)_ — and `updatePoi` drops its unreachable `zoneId`, so the edge has one writer, not two _(test: unit — the update schema rejects it)_
- [x] **T7** — `countUnpositionedPlaces` counts unplaced landmarks alongside unplaced zones _(test: unit — a `poi` with `lat: null` is counted; regression for the zones-only bug)_
- [ ] **T8** — `useUnplacedChildren` becomes campaign-wide `useUnplacedPlaces`; `WorldMap` excludes the ancestors of the map in view using the navigation stack it already holds _(test: unit — the hook returns places from other maps; an ancestor is filtered out)_
- [ ] **T9** — The picker: two groups, provenance label, filter box, scroll cap; the move toast and the cycle message, both catalogues _(test: unit — grouping and filtering render; e2e covers the flow in T11)_
- [ ] **T10** — `unplaceLandmark` + the landmark popover entry, parity with SPEC-016 T5 _(test: unit + e2e — the landmark leaves the map and reappears in the pool)_
- [ ] **T11** — E2E: place a pooled place from another map and find it there; the refusal of a cycle; an NPC's location after its landmark moves _(test: `e2e/map-move-between-maps.spec.ts`)_
- [ ] **T12** — Docs: close the `ROADMAP.md` entry, retire TD-103's "interim" note, cross-note SPEC-007 §5 and SPEC-016, tick this spec's criteria _(no test)_

## 11. Outcome

_Fill in at close._

- Shipped: YYYY-MM-DD
- Deviations from spec and why: …
- Follow-up debt created: …
