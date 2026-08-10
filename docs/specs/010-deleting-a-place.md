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

1. **The root is never deletable.** The world always exists. Starting over means removing the root's map image (SPEC-007) and deleting the branches beneath it — not deleting the world itself.
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

- [ ] A place with no children and no entities can be deleted.
- [ ] Deleting a place reparents its direct children to the grandparent and clears their coordinates.
- [ ] Grandchildren are untouched and keep their coordinates.
- [ ] Entities assigned to the deleted place have their `zoneId` cleared and appear in SPEC-007's entity backlog.
- [ ] Entities assigned to a landmark inside it keep that landmark, and their `zoneId` follows it to the grandparent — `zoneId` and `poi.zoneId` still agree afterwards (ADR-0010).
- [ ] Entities assigned to a surviving child are untouched.
- [ ] The root cannot be deleted, and the control is not offered for it.
- [ ] The confirmation states real counts for that place before anything is written.
- [ ] All of it happens in one transaction: a failure partway leaves the tree exactly as it was.
- [ ] The mutation rejects an unauthenticated request and validates its input.
- [ ] Coverage has not dropped.

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

- [ ] **T1** — `poi.lat`/`lng` nullable, and every consumer handling an unpositioned landmark _(test: a landmark with no position is readable, is excluded from the marker layer rather than crashing it, and appears in the unpositioned list)_
- [ ] **T2** — `deletePlace`: reparent children and landmarks, clear their coordinates, detach entities, delete, all in one transaction; the root refused _(test: children and landmarks move up unpositioned; grandchildren untouched; entities detached; the root cannot be deleted; a mid-transaction failure leaves nothing changed)_
- [ ] **T3** — The confirmation dialog with real counts, and the entry point on a place _(test: counts match the database; the control is absent for the root; cancelling writes nothing)_

## 11. Outcome

_Fill in at close._
