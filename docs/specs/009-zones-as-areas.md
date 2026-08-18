# SPEC-009: Zones as areas, and containment that is spatially true

- **Status:** Shipped — agreed 2026-08-10 from a design interview, every open question closed. All five tasks landed (PRs #144, #146, #147, #150, and T5).
- **Date:** 2026-08-10
- **Phase:** 3
- **Related:** extends [SPEC-004](./004-world-model.md)'s tree ([ADR-0009](../adr/0009-world-tree-as-one-polymorphic-table.md)) from a tree of points to a tree of areas; depends on [SPEC-007](./007-placement-backlog.md) T1 (a place can be given a map after creation); reshapes what SPEC-005 repositions

---

## 1. Problem

**A region is drawn as a dot.** Today a place is created by clicking a point on its parent's map: `createPlace` writes `lat`/`lng`, and the child appears as a pin you can click to descend. The Kingdom of Kang — a realm covering a third of the continent — is a marker the size of a tavern.

That is a cosmetic complaint on its own. What makes it structural is the thing the dot cannot express: **where the region ends.** With only points, the tree's containment is a fact about the database and nothing else. Nothing on the map says that this stretch of coast is inside Kang and that one is not, and nothing stops the DM putting a pin for a Kang village at coordinates that are visually in the orc kingdom. The parent/child relation and the picture disagree, and only the database knows.

## 2. Goal

A place can be drawn as an area on its parent's map. Areas carry their own map and are entered by clicking them. And on any given map, **a pin and an area never occupy the same ground** — if something is inside an area, it belongs on that area's map, one level down.

## 3. The rule this spec exists to encode

Stated by the DM on 2026-08-10, and worth quoting because the whole design follows from it:

1. **A rectangle always means a map.** Drawing an area is the same act as uploading the map it contains; clicking it descends into that map. There is no area without a map behind it.
2. **An area must be drawn over empty ground.** If pins already sit inside the rectangle being drawn, the app refuses and says which ones — the area cannot be created until they are dealt with.
3. **Therefore a pin is always "at this level".** Placing a pin somewhere means no area covers those coordinates. If one does, clicking there does not place anything — it descends into that area's map, and the pin belongs down there.

Read together, these say something stronger than "zones can be rectangles": **containment becomes spatially true.** A place's map shows exactly what is directly inside it, and anything belonging to a sub-area is on that sub-area's map instead. There is one correct level for everything, and the map enforces it rather than documenting it.

**This also answers what looked like a contradiction.** "The rectangle replaces the pin" and "a dungeon is a point, not an area" are the same rule seen from two sides: a dungeon is a point _because_ nothing covers it. Draw an area over that ground later and the dungeon does not become an area — it moves down a level, onto the new area's map, where it is a point again.

## 4. Non-goals

- **Polygons.** Rectangles only. Coastlines and mountain ranges would look better and cost far more, in drawing, storage, hit-testing and every later edit. Revisit only if rectangles prove genuinely unusable in practice, not because a polygon would be prettier.

  > **Superseded 2026-08-18 — the revisit condition above was met.** The DM drew
  > the real world and the rectangles do not fit it: on the root map the material
  > plane is the upper part of a hemisphere and a rectangle over it swallows
  > ground that is not the material plane; inside it, Kang's realm cannot be
  > boxed without taking a piece of the dwarven kingdom and a piece of Quel'Thalas.
  >
  > **This is not the aesthetic objection this non-goal was guarding against.** It
  > is §3's own premise failing: an area that covers ground belonging to a
  > neighbour makes containment spatially _false_, which is the one thing this
  > spec set out to make true — and the collision surfaces later, when those
  > neighbours get their own maps and their borders disagree with the boxes
  > already drawn. Rectangles are usable on a map whose regions happen to be
  > boxy, and this campaign's map is not one.
  >
  > Polygon footprints are recorded as a spec candidate in `ROADMAP.md`. **Leave
  > the paragraph above as written** — it is an accurate record of what was
  > decided in 2026-08-10 and on what evidence, and the cost it lists is still
  > the cost.

- **Overlapping areas.** Two sibling areas may not overlap. Containment with ambiguity is not containment, and rule 3 would have no single answer for a point in the overlap.
- **Areas for landmarks.** `poi` rows stay points. A landmark is a place on a map, not a container of one.
- **Automatic reparenting on geography.** Nothing walks the tree looking for pins that "should" belong to an area drawn later. The rules are enforced at the moment of drawing and the moment of placing, not retroactively by a sweep.
- **Changing how entities are placed.** An NPC's location is still a zone or a landmark reference (ADR-0010). This spec changes what a zone looks like, not what points at it.

## 5. Behaviour

**Drawing an area**

1. On the current map, the DM drags a rectangle.
2. If any pin — a child place or a landmark — falls inside it, the app refuses and names them, and creates nothing. The DM moves them out and draws again; the app never absorbs them (§9).
3. Otherwise a form asks for the place's name, its kind, and its map. On save, a child place is created with that footprint and that map.
4. The rectangle is drawn on the parent's map with its name. Clicking it descends into its map.

**Placing a point**

1. Clicking empty ground offers the existing "add place" and "add landmark" flows, unchanged.
2. Clicking inside an area does **not** offer them. It descends into that area, where the same click can be made one level down.

**Edge cases**

| Situation                                        | Expected behaviour                                                                                                                                                                                                                                       |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The rectangle overlaps a sibling area            | Refused, naming the area it collides with. §4: no overlaps.                                                                                                                                                                                              |
| The rectangle is drawn partly outside the map    | Clamped to the map's bounds, or refused if the visible part is degenerate. It must not be storable outside the space it is drawn on.                                                                                                                     |
| A degenerate rectangle (a click, or a hairline)  | Refused. Below a minimum size it is a mis-drag, not an intent.                                                                                                                                                                                           |
| An area with no map                              | Cannot be created — rule 1. A place that already exists without one is SPEC-007 T1's job, and gaining a map does not give it a footprint.                                                                                                                |
| A place has a footprint and a map is replaced    | The footprint is on the **parent's** map and is unaffected. SPEC-007's misalignment warning is about the place's own map and its children, a different one.                                                                                              |
| Resizing or moving an area later                 | Same rules re-checked: no overlap, no pins swallowed (T5). `updateZonePosition` excludes the area's own row from the sibling comparison — otherwise every resize would find itself "overlapping" its own unchanged footprint and refuse unconditionally. |
| A place created as a point, later wanted as area | It has no footprint; giving it one re-runs rule 2 against whatever is inside. Nothing converts automatically.                                                                                                                                            |
| Two areas that merely touch at an edge           | Allowed. Sharing a border is not overlapping.                                                                                                                                                                                                            |

## 6. Data model changes

```prisma
model zone {
  // ...
  footprint Json?   // ← new: the rectangle on the PARENT's map
}
```

**One nullable column.** A place with a `footprint` is an area; a place without one is a point. Both keep `lat`/`lng` — for an area those are the rectangle's **derived centre**, written at creation so that every existing consumer (the label, the click target, `countUnpositionedPlaces`, `useUnplacedChildren`) keeps working unchanged. That is a computed convenience, not a second authored position: the DM draws a rectangle and never types a centre.

**The root never has a footprint, and cannot be given one.** A footprint is by definition the rectangle a place casts on its _parent's_ map, and the root is the one row with `parentId: null` (`fetchRootPlace`/`createRootPlace` both key on exactly that). With no parent there is no surface to cast a shape onto, so the root's extent is not a rectangle anyone can draw or shrink — it is simply its own `mapBounds`, the whole map. This falls out of the model rather than needing a guard, and it is the other half of the `footprint` / `mapBounds` distinction below: every place can have a `mapBounds` (the map inside it), every place _except the root_ can have a `footprint` (its shape outside). Stated here because it was load-bearing in conversation twice and written down nowhere (2026-08-13).

**Named `footprint`, deliberately not `areaBounds`.** `zone.mapBounds` already exists and means something different — the extent of the place's _own_ map image. Two `*Bounds` Json columns on one model, one describing the map inside and one the shape outside, is a confusion this project would pay for later. `footprint` says "the shape this place casts on its parent" and cannot be misread as the other.

**Json rather than four float columns.** The only query is "which of this parent's children contain this point", and a parent has a handful of children — the containment test runs in JS over rows `fetchPlaceChildren` already loads. Four indexed floats would buy a SQL-side filter nothing needs, at the cost of four columns and an all-or-nothing invariant the type system would not enforce. Revisit if the tree ever gets wide enough for that to matter; today the whole table is 42 rows.

**Backfill:** none. No place has coordinates today, so nothing converts. **Reversible:** yes — dropping the column loses the rectangles and leaves every place a point, which is exactly the current state.

## 7. Validation

Two checks, both server-side in the mutation, both also enforced in the UI so the DM finds out while dragging rather than on submit:

- **On drawing an area:** no sibling area overlaps it, and no pin (child place or landmark) falls inside it.
- **On placing a point:** no sibling area contains it.

They are the same predicate read in two directions, so they share one pure, unit-tested function — `app/modules/maps/lib/utils/` is where the project's other geometry lives, and this belongs beside it rather than inline in two mutations.

**The client check is a convenience; the server check is the rule.** Both `createPlace` and `createPoi` must refuse regardless of what the client believed, per non-negotiable rule #2.

## 8. Acceptance criteria

- [x] Dragging a rectangle on a place's map creates a child area with its own uploaded map. _(T2)_
- [x] Clicking an area descends into its map; clicking empty ground still offers the point flows. _(T2 for the rectangle itself, T4 for the surrounding ground.)_
- [x] Drawing an area over an existing pin is refused, and the refusal names the pins. _(T1: `createPlace` returns "Would cover existing place(s): …", and T2 threads that message to the toast. T3 is a richer presentation of this same refusal, not the refusal itself.)_
- [x] Drawing an area overlapping a sibling area is refused, naming the sibling. _(T1: "Overlaps an existing area: …".)_
- [x] Placing a point inside an existing area is impossible from the UI and refused by the server if attempted directly. _(Server: T1, in `createPlace`/`createPoi`. UI: T4. `updateZonePosition` closed the last gap in T5: it now re-runs both checks — the point half was §8's documented gap, resizing/moving an area is the rest of T5's own scope.)_
- [x] A degenerate or out-of-bounds rectangle is refused. _(Degenerate: T1's `isDegenerateFootprint`. Out-of-bounds: `useDrawArea` clamps the drag to the map's own bounds, T2.)_
- [x] An area's stored centre matches its rectangle, and every existing consumer of `lat`/`lng` works unchanged. _(T1's `footprintCentre`, written at creation.)_
- [x] The containment predicate is a pure function with its own unit tests, used by both mutations. _(`app/modules/maps/lib/utils/footprint.ts`; T4 reuses the same `findContainingSibling` client-side rather than reimplementing it.)_
- [x] Every new mutation rejects an unauthenticated request and validates its input. _(No new mutation was needed: the footprint rides through the existing `createPlace`, which already calls `requireSession` and validates.)_
- [x] Coverage has not dropped. _(Enforced as a CI ratchet with thresholds in `vitest.config.ts` — the three PRs above all passed it.)_

## 9. Decided: the app never absorbs a pin

**When an area is drawn over existing pins, the app refuses, names them, and stops there.** The DM moves each pin out by hand and draws again. Nothing is reparented, nothing is repositioned, no confirmation dialog offers a shortcut.

The obvious alternative — creating the area reparents the pins beneath it — is more useful in the common case and was rejected on 2026-08-10 for a reason worth keeping verbatim, because it will be re-proposed:

> _"Il peggio sarebbe che per sbaglio disegno e ingloballo cose dove non dovrebbero essere inglobate: il costo e la frustrazione sarebbe maggiore piuttosto che mettersi a spostare ogni pin a mano."_

The asymmetry is the argument. Moving three pins by hand is tedious and takes a minute. A mis-drag that silently swallows the wrong six places **also destroys their positions** — the parent's map and the new area's map share no coordinate system, so an absorbed pin cannot keep where it was and would land in SPEC-007's unpositioned backlog. A tedious operation you control beats a convenient one that occasionally costs an afternoon.

This is the same instinct as `onDelete: Restrict` throughout the schema: **refuse and name what blocks you, rather than resolving it on the user's behalf.** Drawing an area is now consistent with every other destructive-adjacent operation in the app.

## 10. Task breakdown

- [x] **T1** — `footprint` column, the containment predicate as a pure function, and both server-side checks _(test: a point inside/outside/on the edge; overlapping and merely touching rectangles; a degenerate rectangle)_
- [x] **T2** — Draw a rectangle on the map, name/kind/map form, area rendered with its label, click to descend _(test: an area created with its map is navigable; the derived centre matches the rectangle)_
- [x] **T3** — The refusal: drawing over pins names every one of them and creates nothing _(test: one pin, several pins, a pin exactly on the edge; nothing is written and no pin is reparented)_
- [x] **T4** — Clicking inside an area descends instead of offering the point flows _(test: the add-place and add-landmark entries are absent inside an area and present outside it)_
- [x] **T5** — Resizing and moving an existing area, re-running both checks _(test: a resize that would swallow a pin is refused; one that would overlap a sibling is refused)_

## 11. Outcome

**All five tasks shipped.**

**T5 closed 2026-08-13** — closes §8's last documented gap. `app/lib/data/maps/checkPlacement.ts` is a new module extracting SPEC-009 §7's two checks (`checkAreaPlacement`, `checkPointPlacement`) out of `createPlace.ts`, where they'd lived inline since T1; `createPlace` and `createPoi` now both call the extracted functions instead of duplicating the predicate a second and third time (TD-77 is exactly this failure shape — two copies of one rule drifting apart — and this is that shape being closed off before it happened rather than after).

`updateZonePosition` now accepts either `{ id, lat, lng }` (an ordinary pin move — unchanged wire shape) or `{ id, footprint }` (a resize/move, new), and re-runs the appropriate check against the zone's own siblings before writing. Both branches pass `excludeZoneId: id` into the shared checker: **without it, resizing an area finds its own unchanged footprint in the sibling query and `findOverlappingSibling` reports it overlapping itself, refusing every resize unconditionally.** This was caught by writing that exact test first (`checkPlacement.test.ts`, "does not refuse a resize against its own unchanged footprint") before the exclusion existed, confirming it would otherwise have shipped broken.

The interaction is redraw-to-replace, not corner-handle resize: right-clicking an existing area now offers "Edit Area" in the context menu (the mirror of T4's `hideAddPlace` — shown only over an area, not over empty ground). Choosing it arms a second `useDrawArea` instance on the same rectangle; the old footprint is hidden (`useNavigableChildren`'s new `editingChildId` param) while the DM drags a fresh one over the same ground, and `updateZonePosition` writes the new footprint and its derived centre atomically. No optimistic update and no live in-drag validation — the old rectangle simply stays hidden until the server confirms, matching how `createPlace`'s own refusal already surfaces (a toast naming what blocked it), not a corner-handle affordance. Corner-handle resize was considered and set aside: T5's acceptance criteria are about the checks being re-run correctly, not handle ergonomics, and redraw-to-replace reuses `useDrawArea`'s already-tested clamping, Escape-cancel and degenerate-drag rejection rather than a new ~150-line gesture.

**T3 closed 2026-08-13** — the three edge cases of the area-drawing refusal now have tests covering them: multiple pins inside the footprint all named in the error (not just the first), a pin exactly on the footprint's edge (the containment predicate is closed-set; edge-inclusive), and the implicit assertion that no mutation happens when the refusal fires. The specification's own wording ("the app refuses and names them, and stops there") is now verifiable.

**T4 closed 2026-08-12** — added `hideAddPlace` to the context menu (hidden when a right-click falls inside an area, shown outside), and both crosshair click flows (`positioningPlace` and `isSelectingPOILocation`) now descend instead of offering to place a pin when clicked inside an area. Closes off the UI that would otherwise drive `positioningPlace` into a covered point; the server-side gap remained until T5.
