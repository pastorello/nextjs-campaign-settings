# SPEC-010: Deleting a place

- **Status:** Agreed 2026-08-10 — from a design interview; every open question closed. Three tasks, one schema change.
- **Date:** 2026-08-10
- **Phase:** 3
- **Related:** completes [SPEC-004](./004-world-model.md)'s tree, which can be grown but never pruned; feeds both backlogs [SPEC-007](./007-placement-backlog.md) defines; a place drawn as an area ([SPEC-009](./009-zones-as-areas.md)) deletes by the same rules

---

## 1. Problem

**There is no way to remove a place. None, anywhere in the app.** Verified 2026-08-10: `deletePoi` deletes a landmark row; nothing deletes a `zone`. The four DELETE route handlers cover spells, magic items, NPCs and deities. `app/lib/data/maps/` has `createPlace`, `createRootPlace`, `createPoi`, `updatePoi`, `updateZonePosition`, `deletePoi` — and no `deletePlace`.

So **a branch of the world, once created, is permanent.** A region added by mistake, a plane that turned out to be two planes, a city that belongs under a different kingdom: all of them stay, forever, through the interface.

That is already wrong on its own. What makes it urgent is the DM's stated plan: once the geography specs land, they intend to **rebuild the tree's structure from scratch** and re-place everything, keeping the 119 NPCs and the 42 location records that already exist. Today that plan cannot start. Even in raw SQL it is blocked — `onDelete: Restrict` guards children, NPCs and deities alike, so it would mean detaching 124 entities and deleting 42 places bottom-up by hand.

## 2. Goal

A place can be deleted, and **nothing except that place is destroyed.**

## 3. The rules

From the design interview of 2026-08-10:

1. **The root is never deletable.** The world always exists. Starting over means replacing the root's map image and deleting the branches beneath it — not deleting the world itself.

> **Correction, 2026-08-13.** Rule 1 originally read "removing the root's map image (SPEC-007)". **SPEC-007 never specified removal and none was built**: `updateZoneMap` validates `mapImage: z.string().min(1)`, so it cannot write an empty value or a `null`, and `MapUploadControl` offers only _upload_ (when there is no map) or _replace_ (when there is one). SPEC-007's own scope is giving a place a map or replacing one. The target state is nonetheless reachable and already handled — `WorldMap` renders empty ground with the upload control when `mapUrl` is blank (SPEC-007 T1) — so what is missing is only the transition into it. Removing a map image is therefore **not** a precondition this spec can lean on; if it is wanted, it needs its own task somewhere. Rule 1 is unaffected either way: the root is undeletable regardless of what happens to its image.

2. **Children move up.** Deleting a place reparents its children to its own parent, and clears their coordinates: they were positioned on a map that no longer exists, so they become unpositioned children of the grandparent, ready to be drawn on _its_ map.
3. **Entities assigned to the place lose it; entities assigned to a landmark follow the landmark.** An NPC or deity whose location _is_ the deleted place has its `zoneId` cleared — it is not reassigned to the grandparent, because the DM said where it was, that place is gone, and guessing a replacement would be inventing data. But one whose location is a **landmark** inside the deleted place keeps that landmark, which moves up (§9), so its `zoneId` is **updated to the grandparent** rather than cleared. ADR-0010's invariant — `zoneId` always agrees with `poi.zoneId` — forces this: clearing the zone while leaving the `poiId` would produce exactly the inconsistent row that invariant exists to prevent.
4. **Nothing else changes.** No cascade, no orphans, no deletions the DM did not name.

**Rule 1 is what makes rule 2 total.** Because the root cannot be deleted, every deletable place has a parent, so there is always a grandparent to reparent to. No special case, no "what if it was top-level", no nullable-parent state to design around. The two rules were chosen independently and this is the reason to keep them together.

**Rules 2 and 3 differ on purpose, and the difference is the model.** A place is a node in a tree — it has a position on somebody's map, and losing that position is recoverable by drawing it again. An entity is not in the tree; it _refers_ to a place. When the referent is gone the reference is meaningless, and the honest state is "no place assigned", which SPEC-007's second backlog exists to surface. This follows the distinction the DM drew: _an NPC belongs to a location, never to coordinates._

## 4. Non-goals

- **Cascade-deleting a branch.** Deleting "Terra" must not take its 28 descendants with it. They survive, unpositioned, one level up. If a DM genuinely wants a whole branch gone they delete it a place at a time — deliberately tedious, because it is irreversible.
- **A "reset the geography" command.** Rule 1 plus repeated deletion already achieves it, and a single button that empties the world is a mis-click with no undo. Explicitly rejected 2026-08-10.
- **Deleting a place's map image.** That is SPEC-007, it is not destructive, and it must not be confused with this: removing an image hides children; deleting a place unpositions them.
- **Undo, or a trash.** Out of proportion. The confirmation dialog (§7) is the safeguard.
- **Reassigning entities on delete.** Rule 3. The place the DM chose is gone; the app does not choose a different one.

## 5. Behaviour

**Main flow**

1. From a place, the DM chooses to delete it.
2. A confirmation states exactly what will happen, with real counts read from the database — not a generic warning. For "Terra": _28 places move up to "Piani di Esistenza" and lose their position; 43 NPCs and 2 deities will have no location._
3. On confirmation, all of it happens in one transaction, or none of it does.
4. The DM lands on the parent's map, where the reparented children are now waiting in the unpositioned list.

**Edge cases**

| Situation                                        | Expected behaviour                                                                                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deleting the root                                | Refused, always, with no override — rule 1. The control is not rendered for the root rather than rendered and erroring.                              |
| A place with no children and no entities         | Deleted with a plain confirmation. The dialog says nothing will be affected, rather than listing zeroes.                                             |
| Deleting a place whose parent is the root        | Children reparent to the root. Nothing special: the root is a parent like any other, it simply cannot itself be deleted.                             |
| Grandchildren                                    | Untouched. Only direct children reparent; a grandchild stays with its own parent and keeps its coordinates, because the map it sits on still exists. |
| A child that was already unpositioned            | Stays unpositioned, now under the grandparent. Idempotent.                                                                                           |
| An entity assigned to a **child**, not the place | Untouched. Its place still exists, merely unpositioned — SPEC-007's "two backlogs" distinction exactly.                                              |
| An entity assigned via `poiId` to a landmark     | Keeps it. The landmark moves up unpositioned (§9) rather than being deleted, so the reference stays valid and the entity's location follows it.      |
| The place has an area footprint (SPEC-009)       | Deleted with it. The rectangle was its shape on the parent's map; there is nothing to inherit.                                                       |
| Two deletes racing                               | The transaction settles it: the second finds no row and reports the place is already gone, rather than half-applying.                                |

## 6. Data model changes

**None for places or entities.** Every column this needs is already nullable: `zone.parentId`, `zone.lat`, `zone.lng`, `npc.zoneId`, `deities.zoneId`. The foreign keys are `onDelete: Restrict`, which is correct and stays — the point is not to let the database cascade silently, it is to do the reparenting and detaching explicitly, in one transaction, and only then delete.

**One change, for landmarks: `poi.lat` and `poi.lng` become nullable** (§9). They are non-null today, so a landmark can neither be orphaned nor unpositioned the way a place can — and §9 requires it to be exactly that. `poi.zoneId` stays non-null: a landmark always belongs to some zone, and on delete it is repointed at the grandparent rather than detached.

## 7. The confirmation

The dialog is the only safeguard, so it carries real weight rather than boilerplate:

- **Counts come from the database**, computed for this place at the moment of asking. A generic "this cannot be undone" teaches the DM to click through.
- **It names the consequences in the DM's terms** — places moving up and losing their position, entities losing their location — not in schema terms.
- **It is the same shape as SPEC-006's faction delete**, which refuses and names the NPCs blocking it. The difference is deliberate: a faction delete is _refused_ because a faction has no natural fallback, while a place delete _proceeds_ because rule 1 guarantees one. Same dialog vocabulary, opposite outcome, and both say exactly what is at stake.

## 8. Acceptance criteria

- [x] A place with no children and no entities can be deleted. _(No dedicated unit test — `updateMany`/`deleteMany` against zero matching rows is standard Prisma behaviour, not a special code path — but verified directly: deleting "Test Area SPEC-009", a real leaf place, in a real browser against the dev database.)_
- [x] Deleting a place reparents its direct children to the grandparent and clears their coordinates.
- [x] Grandchildren are untouched and keep their coordinates. _(Every write scopes on `parentId`/`zoneId` equal to the deleted place's own id, which is what keeps grandchildren untouched by construction, per T2's outcome note.)_
- [x] Entities assigned to the deleted place have their `zoneId` cleared and appear in SPEC-007's entity backlog.
- [x] Entities assigned to a landmark inside it keep that landmark, and their `zoneId` follows it to the grandparent — `zoneId` and `poi.zoneId` still agree afterwards (ADR-0010).
- [x] Entities assigned to a surviving child are untouched. _(Same scoping argument as grandchildren: their `zoneId` never matches the deleted place's id, so no write ever touches them.)_
- [x] The root cannot be deleted, and the control is not offered for it.
- [x] The confirmation states real counts for that place before anything is written.
- [x] All of it happens in one transaction: a failure partway leaves the tree exactly as it was.
- [x] The mutation rejects an unauthenticated request and validates its input. _("Validates its input" is thin here: `deletePlace(id: number)` takes a compiler-checked number from a component that only ever passes an already-fetched place's own id — there is no raw string boundary to Zod-parse, unlike a route handler's `:id` segment.)_
- [x] Coverage has not dropped.

## 9. Landmarks follow the same rule as places

**A landmark moves up to the grandparent and becomes unpositioned**, exactly as a child place does. Decided 2026-08-10.

This is rule 4 applied without exception: a delete destroys the place the DM named and nothing else. The alternative — deleting landmarks along with their zone, on the reasoning that a landmark is a mark on a map and the map is gone — was rejected because it destroys something unnamed, and takes any `poiId` reference pointing at it as well.

**It costs one schema change**, and it is the only one in this spec:

```prisma
model poi {
  lat Float?   // ← was non-null
  lng Float?   // ← was non-null
}
```

A landmark can now exist without a position, which is the same state a place has always been able to be in. Every reader of `poi.lat`/`lng` has to handle null — `usePOIManager`, the marker layers, the GeoJSON endpoints. **There are zero `poi` rows today**, so the migration is free and the work is entirely in the type errors the change surfaces, which is the cheapest possible moment to do it.

An unpositioned landmark belongs in SPEC-007's first backlog beside unpositioned places: same state, same list, same fix.

## 10. Task breakdown

- [x] **T1** — `poi.lat`/`lng` nullable, and every consumer handling an unpositioned landmark _(test: a landmark with no position is readable, is excluded from the marker layer rather than crashing it, and appears in the unpositioned list)_
- [x] **T2** — `deletePlace`: reparent children and landmarks, clear their coordinates, detach entities, delete, all in one transaction; the root refused _(test: children and landmarks move up unpositioned; grandchildren untouched; entities detached; the root cannot be deleted; a mid-transaction failure leaves nothing changed)_
- [x] **T3** — The confirmation dialog with real counts, and the entry point on a place _(test: counts match the database; the control is absent for the root; cancelling writes nothing)_

## 11. Outcome

**T1 — 2026-08-13.** `poi.lat`/`lng` are now `Float?` (migration
`20260813150844_spec010_poi_position_nullable`, applied against a table with
zero rows — a free change). No form-facing behaviour changed: `createPoi`
still requires a point, since nothing yet creates a landmark without one.
What changed is every reader: `Poi`'s interface, `fetchPlaceChildren`'s stale
comment claiming landmarks were always positioned, and one real compile-time
gap `checkAreaPlacement` had — `siblingPois` was spread straight into the
swallowed-pins check assuming non-null `lat`/`lng`, which would have broken
the moment any row went null. Fixed with the same non-null filter the zone
side already had. `useUnplacedChildren` and `usePOIManager`'s loader already
filtered on `lat !== null && lng !== null` defensively, ahead of the schema
allowing it — no logic changes there, only new test cases proving an
unpositioned landmark is excluded from the marker layer and included in the
unplaced list, and a stale test asserting "a landmark poi never is
unplaced" corrected. T2 (`deletePlace`, which actually produces an
unpositioned landmark) is next.

**T2 — 2026-08-13.** `deletePlace` (`app/lib/data/maps/deletePlace.ts`)
lands as a `"use server"` action mirroring `deletePoi`'s auth-then-lookup
shape: `requireSession`, look up the place, refuse a missing row with
`NotFoundError` and the root (the one zone with `parentId: null`) with
`ConflictError`, otherwise run seven writes in one `prisma.$transaction`
array — reparent direct child zones and landmarks to the grandparent with
their coordinates cleared, split entities on `poiId` (`null` → `zoneId`
cleared; set → `zoneId` moved to the grandparent, `poiId` left alone, per
ADR-0010) for both `npc` and `deities`, then delete the place row. Every
write is scoped to `parentId`/`zoneId` equal to the place's own id, which
is what keeps grandchildren untouched — there is no recursive query to
accidentally reach them. A `P2025` from the final delete (lost a race to
another delete of the same row) is reported as `NotFoundError` rather than
a generic `DatabaseError`, matching §5's "two deletes racing" row.
`checkAreaPlacement`'s null-safe `lat`/`lng` filtering (T1) meant no other
call site needed touching. 10 unit tests cover every acceptance-criteria
row in §8 except the confirmation dialog's counts, which is T3. No route
handler or UI entry point yet — T3 wires those up.

**T3 — 2026-08-13.** `fetchPlaceDeletionImpact` (`app/lib/data/maps/`) is a
new read-only Server Action that counts, for a given place: direct child
zones plus direct child landmarks as one `placeCount` (both move up
identically per rule 4/§9, so the dialog names them as one figure), and
`npcCount`/`deityCount` scoped to `poiId: null` only — the entities that
actually lose their location (rule 3); a `poiId`-set entity keeps its
landmark and stays located, so it's deliberately excluded from these
counts. `DeletePlaceButton` (`app/ui/geography/`) is the entry point: a
floating map control alongside `MapUploadControl`/`AttachEntityButton`/
`DrawAreaButton`, built directly on the generic `Modal` shell rather than
`ModalButton`/`DeleteButton` — `deletePlace` is a Server Action called
directly, the same pattern `createPlace`/`updateZonePosition`/
`updateZoneMap` already use from this file tree, and SPEC-006's faction
delete (the "same dialog vocabulary" reference) computes nothing until
the delete attempt itself fails, which doesn't fit a mutation that
proceeds rather than refuses. Counts are fetched fresh the moment the
dialog opens (§7's "at the moment of asking"), not baked into the trigger
button. `GeographyExplorer` threads `isRoot` (`stack.length === 1`) and
`parentTitle` (the previous stack entry's title) down through `WorldMap`
so the control can be withheld for the root entirely — not rendered and
then refused — and can name where children reparent to; on a successful
delete it pops the stack the same way "up" does, since a deleted place's
reparented children now belong on the parent's map, which is exactly
where popping already lands.

Browser verification (not just unit tests) surfaced a real, pre-existing
defect: `Modal.tsx` used `z-50`, while the maps module's floating
controls go up to `z-[1100]` (`MapContextMenu`). Any `Modal` opened over
the map — this dialog, and `MapUploadControl`'s existing replace-confirm
dialog — rendered fully in the DOM but visually underneath those
controls, invisible in a real browser though invisible to jsdom-based
unit tests, which don't render stacking contexts. Fixed by raising
`Modal`'s dialog to `z-[1200]`, above every map z-index in the codebase;
this is a one-line, generic fix that also corrects `MapUploadControl`'s
dialog, which shipped with the same latent bug.

10 new unit tests (5 for the counts function, 5 for the dialog component)
plus new coverage in `WorldMap.test.tsx` and `GeographyExplorer.test.tsx`
for the prop wiring and stack-pop-on-delete behaviour. The full golden
path — descend into a place, open the dialog, see real counts (including
the "nothing will be affected" zero case), cancel without writing, then
confirm and land back on the parent's map with the deleted place's
footprint gone — was clicked through in a real browser against the dev
database. SPEC-010 is complete: all three tasks shipped.
