# SPEC-024: Polygon area footprints

- **Status:** Draft — needs the DM's agreement
- **Date:** 2026-09-22
- **Phase:** 4
- **Related:** [SPEC-009](./009-zones-as-areas.md) (§4 carries the dated supersession note this spec acts on) · [SPEC-017](./017-one-unplaced-pool.md) · [SPEC-015](./015-map-grid-and-scale.md) · `app/modules/maps/lib/utils/footprint.ts` · ROADMAP, _Reversed on 2026-08-18_

---

## 1. Problem

An area's footprint is a rectangle, and the DM's own map cannot be drawn with
rectangles. On the root map the material plane is the upper part of a hemisphere,
and any box over it takes in ground that is not the material plane. One level
down, Kang's realm cannot be boxed without also claiming a piece of the dwarven
kingdom and a piece of Quel'Thalas.

This is worse than looking wrong. SPEC-009's whole justification was that
**containment becomes spatially true** — a pin inside an area's footprint really
is inside that region, which is what lets the app refuse contradictory placements.
A rectangle that covers a neighbour's ground makes containment spatially false,
so the guarantee the rest of the map model rests on is already broken wherever
the DM has had to approximate. The damage is deferred: it surfaces when those
neighbours get their own maps and their borders contradict boxes drawn months
earlier.

SPEC-009 said to revisit "only if rectangles prove genuinely unusable in
practice". They have, and that judgement was already recorded on 2026-08-18.

## 2. Goal

An area's footprint is a polygon the DM draws vertex by vertex, and every rule
built on footprints — containment, overlap, the derived centre — holds for that
shape as it did for rectangles.

## 3. Non-goals

- **Holes, multi-part regions, islands.** One closed ring per area. An
  archipelago is several areas or one generous outline; a doughnut is not
  modelled.
- **Curves.** Straight segments between vertices. Smoothing is cosmetic and
  would complicate every predicate.
- **Snapping to neighbours' borders.** Shared borders are drawn twice, by eye.
  Topological editing is a different, much larger feature.
- **Geographic projections.** These are pixel maps; ROADMAP's 2026-09-18
  decision on the vendored Earth-geometry helpers stands — they are off-limits
  for this app's maps.
- **Changing what an area _is_.** A place with a footprint is an area, a place
  without one is a point, `lat`/`lng` still hold the derived centre. SPEC-009's
  model is unchanged; only the shape stored in `footprint` widens.
- **Re-drawing the rectangles that already exist.** They migrate as four-vertex
  polygons and keep working untouched.

## 4. User stories

- As a DM, I want to trace a region's real border, so that what the map shows is
  the shape of my world rather than a box around it.
- As a DM, I want two neighbouring realms to sit side by side without either
  claiming the other's ground, so that containment keeps telling the truth.
- As a DM, I want to fix a border I drew badly, so that a mistake costs a drag
  rather than a delete and redraw.

## 5. Behaviour

**Drawing.** Drag-to-draw becomes click-per-vertex: each click adds a vertex, a
rubber band follows the cursor, the last vertex can be undone, and a closing
gesture (clicking the first vertex, or double-click, or Enter) finishes the
shape. Escape abandons it. SPEC-009's minimum-size rule becomes a
minimum-vertex rule — three — plus the degeneracy check below.

**Editing.** SPEC-009 T5's move and resize become: drag a vertex, drag the whole
polygon, add a vertex on a segment, delete a vertex (never below three). Every
edit re-runs the same checks a new footprint runs.

**The rules that must keep holding**, all currently trivial arithmetic in
`footprint.ts`:

- **Containment** — point-in-rectangle becomes point-in-polygon.
- **Overlap** — interval comparison becomes polygon–polygon intersection. This is
  the expensive predicate and the load-bearing one: "an area may not overlap a
  sibling" is what makes the model coherent.
- **The derived centre** — a midpoint becomes something that must lie _inside_
  the shape. A concave polygon's centroid can fall outside it, which would put a
  horseshoe-shaped region's pin in its empty middle. Since SPEC-009 writes that
  centre into `lat`/`lng` at creation, this needs a real answer — pole of
  inaccessibility, or an author-placed label point the DM can drag — not a
  formula chosen for being short. **Recommendation to decide in §9:** compute a
  guaranteed-inside point, and let the DM move it; store it, do not recompute it
  behind their back.

**Edge cases**

| Situation                                 | Expected behaviour                                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Fewer than three vertices                 | Not a shape; the draw cannot be finished.                                                                                                |
| Self-intersecting outline                 | Refused with an explanation. Every predicate below assumes a simple polygon, so this cannot be stored.                                   |
| Zero-area or hairline polygon             | Refused, as `isDegenerateFootprint` refuses a degenerate rectangle today.                                                                |
| A vertex dragged outside the map's bounds | Clamped to the bounds, as SPEC-009 clamps a rectangle.                                                                                   |
| An edit would overlap a sibling           | Refused, naming the sibling, exactly as today.                                                                                           |
| An edit would leave a child pin outside   | Same refusal SPEC-009 already defines for shrinking a rectangle away from what it contains.                                              |
| A concave shape whose centroid is outside | The stored centre is a point inside the polygon; the pin never renders in empty space.                                                   |
| Very many vertices                        | No hard cap unless one is needed for the overlap check's cost; if one is introduced it is stated in the spec, not discovered at runtime. |

## 6. Data model changes

None to the schema. `zone.footprint` is already `Json?`; what changes is the
shape stored in it.

```ts
// today
type Footprint = [[number, number], [number, number]]; // two corners
// proposed
type Footprint = { ring: [number, number][]; centre?: [number, number] };
```

- **Backfill needed?** Yes, and it is mechanical: every existing two-corner
  footprint becomes a four-vertex ring with the same corners. Do it as a data
  migration rather than by tolerating both shapes at read time — two accepted
  formats in a `Json` column is how the next reader gets it wrong. `isFootprint`
  becomes the single validator for the new shape, and it is the only place that
  needs to recognise the old one, during the migration.
- **Reversible?** Only for footprints that are still rectangles. Say so in the
  migration's note: once the DM draws a real polygon, going back loses the shape.

## 7. Metadata changes

None. The footprint is not a form field; it is drawn on the map and written by
the map's own actions, which validate through `zoneMeta` for everything else
(TD-129).

## 8. Acceptance criteria

- [ ] An area can be drawn as a polygon of three or more vertices.
- [ ] Existing rectangles render and behave identically after the migration.
- [ ] A self-intersecting or degenerate outline is refused with a named reason.
- [ ] Point-in-polygon containment agrees with what the map shows, including for
      concave shapes.
- [ ] Two polygons that overlap by any amount are refused as siblings.
- [ ] The stored centre always lies inside its polygon.
- [ ] A vertex can be added, moved and removed, and each edit re-runs both checks.
- [ ] A polygon cannot leave the map's bounds.
- [ ] The keyboard can draw and edit a footprint, or the spec states plainly that
      it cannot and why (TD-133's standard applies to new map interactions).
- [ ] Every new mutation rejects an unauthenticated request.
- [ ] Every new mutation rejects invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Fill in after the sections above are agreed._

**Open questions**

- **A geometry library or hand-written predicates?** Polygon intersection written
  by hand is a classic source of subtle, data-dependent bugs; a dependency is a
  dependency. This is an ADR-sized choice and belongs in one.
- Which "guaranteed inside" point, and is it draggable?
- Does the DM want to convert existing rectangles into real borders by hand
  afterwards, and does anything help them do it?

## 10. Task breakdown

_Fill in after §9._

## 11. Outcome

_Fill in at close._
