# SPEC-009: Zones as areas, and containment that is spatially true

- **Status:** Agreed 2026-08-10 — from a design interview; every open question closed. Five tasks.
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

| Situation                                        | Expected behaviour                                                                                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The rectangle overlaps a sibling area            | Refused, naming the area it collides with. §4: no overlaps.                                                                                                 |
| The rectangle is drawn partly outside the map    | Clamped to the map's bounds, or refused if the visible part is degenerate. It must not be storable outside the space it is drawn on.                        |
| A degenerate rectangle (a click, or a hairline)  | Refused. Below a minimum size it is a mis-drag, not an intent.                                                                                              |
| An area with no map                              | Cannot be created — rule 1. A place that already exists without one is SPEC-007 T1's job, and gaining a map does not give it a footprint.                   |
| A place has a footprint and a map is replaced    | The footprint is on the **parent's** map and is unaffected. SPEC-007's misalignment warning is about the place's own map and its children, a different one. |
| Resizing or moving an area later                 | Same rules re-checked: no overlap, no pins swallowed. SPEC-005 repositions points today and grows to cover this.                                            |
| A place created as a point, later wanted as area | It has no footprint; giving it one re-runs rule 2 against whatever is inside. Nothing converts automatically.                                               |
| Two areas that merely touch at an edge           | Allowed. Sharing a border is not overlapping.                                                                                                               |

## 6. Data model changes

```prisma
model zone {
  // ...
  footprint Json?   // ← new: the rectangle on the PARENT's map
}
```

**One nullable column.** A place with a `footprint` is an area; a place without one is a point. Both keep `lat`/`lng` — for an area those are the rectangle's **derived centre**, written at creation so that every existing consumer (the label, the click target, `countUnpositionedPlaces`, `useUnplacedChildren`) keeps working unchanged. That is a computed convenience, not a second authored position: the DM draws a rectangle and never types a centre.

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

- [ ] Dragging a rectangle on a place's map creates a child area with its own uploaded map.
- [ ] Clicking an area descends into its map; clicking empty ground still offers the point flows.
- [ ] Drawing an area over an existing pin is refused, and the refusal names the pins.
- [ ] Drawing an area overlapping a sibling area is refused, naming the sibling.
- [ ] Placing a point inside an existing area is impossible from the UI and refused by the server if attempted directly.
- [ ] A degenerate or out-of-bounds rectangle is refused.
- [ ] An area's stored centre matches its rectangle, and every existing consumer of `lat`/`lng` works unchanged.
- [ ] The containment predicate is a pure function with its own unit tests, used by both mutations.
- [ ] Every new mutation rejects an unauthenticated request and validates its input.
- [ ] Coverage has not dropped.

## 9. Decided: the app never absorbs a pin

**When an area is drawn over existing pins, the app refuses, names them, and stops there.** The DM moves each pin out by hand and draws again. Nothing is reparented, nothing is repositioned, no confirmation dialog offers a shortcut.

The obvious alternative — creating the area reparents the pins beneath it — is more useful in the common case and was rejected on 2026-08-10 for a reason worth keeping verbatim, because it will be re-proposed:

> _"Il peggio sarebbe che per sbaglio disegno e ingloballo cose dove non dovrebbero essere inglobate: il costo e la frustrazione sarebbe maggiore piuttosto che mettersi a spostare ogni pin a mano."_

The asymmetry is the argument. Moving three pins by hand is tedious and takes a minute. A mis-drag that silently swallows the wrong six places **also destroys their positions** — the parent's map and the new area's map share no coordinate system, so an absorbed pin cannot keep where it was and would land in SPEC-007's unpositioned backlog. A tedious operation you control beats a convenient one that occasionally costs an afternoon.

This is the same instinct as `onDelete: Restrict` throughout the schema: **refuse and name what blocks you, rather than resolving it on the user's behalf.** Drawing an area is now consistent with every other destructive-adjacent operation in the app.

## 10. Task breakdown

- [ ] **T1** — `footprint` column, the containment predicate as a pure function, and both server-side checks _(test: a point inside/outside/on the edge; overlapping and merely touching rectangles; a degenerate rectangle)_
- [x] **T2** — Draw a rectangle on the map, name/kind/map form, area rendered with its label, click to descend _(test: an area created with its map is navigable; the derived centre matches the rectangle)_
- [ ] **T3** — The refusal: drawing over pins names every one of them and creates nothing _(test: one pin, several pins, a pin exactly on the edge; nothing is written and no pin is reparented)_
- [ ] **T4** — Clicking inside an area descends instead of offering the point flows _(test: the add-place and add-landmark entries are absent inside an area and present outside it)_
- [ ] **T5** — Resizing and moving an existing area, re-running both checks _(test: a resize that would swallow a pin is refused; one that would overlap a sibling is refused)_

## 11. Outcome

_Fill in at close._
