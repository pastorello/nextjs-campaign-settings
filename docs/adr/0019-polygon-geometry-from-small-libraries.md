# ADR-0019: Take polygon geometry from small, single-purpose libraries

- **Status:** Accepted
- **Date:** 2026-09-30
- **Deciders:** the DM (the choice of a library over hand-written predicates, 2026-09-30); the libraries themselves chosen here
- **Related:** [SPEC-024](../specs/024-polygon-area-footprints.md) (polygon footprints) · [SPEC-009](../specs/009-zones-as-areas.md) (the rules polygons must keep) · `app/modules/maps/lib/utils/footprint.ts` · ROADMAP's 2026-09-18 decision on the vendored Earth-geometry helpers

## Context

SPEC-024 turns an area's footprint from a rectangle into a polygon the DM draws
vertex by vertex. Every rule SPEC-009 built on footprints has to hold for the new
shape, and each was trivial arithmetic on a rectangle:

- **Containment**: is a pin inside an area? It decides where a click lands, and
  refuses a pin placed inside a sibling area.
- **Overlap**: do two sibling areas share ground? This is the load-bearing rule;
  "an area may not overlap a sibling" is what keeps containment true.
- **Validity**: a footprint must be a simple polygon (no self-intersection) and
  not degenerate.
- **The centre**: the pin written to `lat`/`lng` must lie inside the shape, which
  a concave polygon's centroid does not guarantee.

On polygons these are classic sources of subtle, data-dependent bugs: collinear
edges, touching borders, vertices on edges, floating-point near-misses. Asked on
2026-09-30, the DM chose a library over hand-written predicates.

Two facts about this app constrain the choice. These are **pixel maps**, image
overlays whose "lat/lng" run into the hundreds, so anything geodesic (areas in
square metres, great-circle distances) is wrong for them: that was the lesson of
TD-131's vendored Earth helpers. And the predicates run on **both sides**: the
server's check is the rule (`checkPlacement.ts`), and the map runs the same
functions to refuse early and to decide where a click lands. So whatever is
chosen ships in the browser bundle too.

## Decision

We will take each predicate from a small, single-purpose, planar library, behind
the one module that already owns footprint geometry (`footprint.ts`):

| Predicate                         | Library                          | Licence |
| --------------------------------- | -------------------------------- | ------- |
| Overlap (positive shared area)    | `polygon-clipping`               | MIT     |
| Containment (point in polygon)    | `@turf/boolean-point-in-polygon` | MIT     |
| Self-intersection                 | `@turf/kinks`                    | MIT     |
| A point guaranteed inside (label) | `polylabel`                      | ISC     |

The polygon's **area**, used by the degeneracy check and to measure an overlap,
stays a few lines of shoelace formula in `footprint.ts`. That is the one piece of
arithmetic no planar library offers without a geodesic assumption.

Nothing outside `footprint.ts` imports these libraries. Callers keep calling
`footprintContains`, `footprintsOverlap` and the rest, whose meanings do not
change: containment is **closed** (a point on the border is inside), overlap is
**open** (two areas sharing only a border do not overlap), exactly as SPEC-009
defined them for rectangles.

## Alternatives considered

### Hand-written predicates

No dependencies, and each function is short on paper: ray casting, segment
intersection, the shoelace formula. It was the DM's other option, and it was
rejected for the reason SPEC-024 §9 gives. Polygon intersection written by hand
is where the degenerate cases hide (a shared vertex, a collinear overlap, a
vertex exactly on an edge), and the overlap check is the rule the model rests on.
A wrong answer there does not crash: it quietly lets two realms claim the same
ground, which is the exact failure SPEC-024 exists to end.

### Turf as a whole (`@turf/turf`)

One import and every predicate. But it is a large bundle for four functions. It
also makes geodesic functions (`@turf/area`, `@turf/distance`) one autocomplete
away, and they are wrong for these maps. The modular packages give the same code
without either problem.

### Turf for everything, including overlap (`@turf/boolean-overlap`, `@turf/intersect`)

`boolean-overlap` answers a narrower question than the one asked: it is false
when one polygon contains the other, which for SPEC-009 is still an overlap.
`boolean-intersects` is true for polygons that merely touch, which SPEC-009
allows. `@turf/intersect` computes the shared region with `polygon-clipping`
underneath, so depending on `polygon-clipping` directly is the same algorithm
with one layer fewer.

### A general computational-geometry library (JSTS, a GEOS port)

Robust, and it has every predicate. It is also an order of magnitude heavier, in
the browser bundle as well as on the server, for a map editor that needs four.

## Consequences

**Positive**

- The predicates that decide whether a placement is legal come from code that is
  used and tested far more widely than this app ever could be.
- The meanings SPEC-009 fixed, closed containment and open overlap, carry over
  unchanged. Callers do not learn that the shape changed.
- The centre problem has a real answer. `polylabel` returns the pole of
  inaccessibility, a point inside the polygon as far from its edges as possible:
  the right place for a region's pin.

**Negative**

- Four new runtime dependencies, in the client bundle as well as on the server.
  Each is small and single-purpose, but each is one more thing Dependabot bumps.
- `@turf/*` expects GeoJSON-shaped input, so `footprint.ts` converts a ring into
  a closed GeoJSON polygon at the boundary. The order is `[lat, lng]`, not
  GeoJSON's `[lng, lat]`. That is harmless because every predicate here is
  planar and symmetric in its axes, but it is recorded here so nobody "fixes" it
  into a real projection.

**Neutral / follow-up work**

- `footprint.ts` becomes the only module that knows a footprint is a polygon
  stored as `{ ring }`. The migration that converts the stored rectangles is the
  only other place that knows the old shape (SPEC-024 §6).

## Revisit when

A predicate is wrong in a way the library cannot be configured out of, or the
bundle cost of these four becomes a measured complaint. Either way, the
replacement goes behind `footprint.ts`, where these are contained today.
