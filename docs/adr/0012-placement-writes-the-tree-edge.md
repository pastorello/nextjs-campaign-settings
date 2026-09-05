# ADR-0012: Placement writes the tree edge

- **Status:** **Accepted 2026-09-05**, with [SPEC-017](../specs/017-one-unplaced-pool.md), whose T1 this closes. _(Drafted 2026-09-04 as `Proposed`; flipped the day the spec was agreed rather than left for an audit to catch — ADR-0009 and ADR-0010 both sat stale at `Proposed` for nine days after the decisions they record had shipped.)_
- **Date:** 2026-09-04
- **Deciders:** the maintainer (DM), with Claude Code
- **Related:** records the decision behind [SPEC-017](../specs/017-one-unplaced-pool.md); builds on [ADR-0009](./0009-world-tree-as-one-polymorphic-table.md) (the `parentId` tree) and [ADR-0010](./0010-entity-location-as-stored-reference.md) (the `zoneId`/`poiId` invariant this must maintain); [SPEC-005](../specs/005-place-repositioning.md) (repositioning, which this leaves alone), [SPEC-009](../specs/009-zones-as-areas.md) §7 (the placement checks), [SPEC-010](../specs/010-deleting-a-place.md) (the other writer of the edge), [SPEC-016](../specs/016-place-popover.md) T5 (un-placing); TD-85, TD-93, TD-102, TD-103

## Context

**"Where a place is" is two columns written by two disjoint sets of functions.**

- The **edge** — `zone.parentId`, or `poi.zoneId` for a landmark — says which map the place belongs to. It is written at creation (`createPlace`, `createRootPlace`, `createPoi`) and by `deletePlace`, which reparents a deleted place's children to their grandparent. Nothing else writes it, with one dormant exception noted below.
- The **coordinates** — `lat`/`lng`, plus `footprint` for an area — say where on that map it sits. They are written by `updateZonePosition`, `placeLandmark` and `unplacePlace`, none of which touch the edge.

Two facts follow, and they are the whole of this decision's context.

**First: the two columns are not independent, though the code treats them as if they were.** A latitude/longitude pair in this application is not a position on Earth — it is a position inside one map image, interpreted against that place's parent's `mapBounds` ([ADR-0008](./0008-map-image-storage.md), SPEC-009). The same pair means a different spot on every map, and nothing at all on a map it was not measured against. So a coordinate is only meaningful _relative to an edge_, and writing one without the other produces a row that is internally coherent and factually nonsense.

**Second: nothing in the application re-parents anything**, which the DM hit on 2026-08-30 while testing the map. "Posiziona luogo" derives its list from the edge — `useUnplacedChildren` filters `fetchPlaceChildren(parentId)` down to the rows with no coordinates — so a city created under the wrong region can be positioned on that region's map and on no other. The DM's framing: the per-map pool is not merely inconsistent, it is a cage, and the single pool _is_ how the missing capability gets delivered — picking a pooled place while viewing map X should write `parentId = X`.

Constraints that mattered:

- **A dormant second writer already exists.** `updatePoi` spreads `...(zoneId !== undefined && { zoneId })` into its update — the capability to move a landmark between zones is already in the mutation, and it maintains none of ADR-0010's follow-through. It is unreachable today: its only caller, `usePOIManager`, never sends the key (`usePOIManager.ts:255`). Dormant, not safe.
- **ADR-0010's invariant is application-level and always will be.** Whenever an entity's `poiId` is set, its `zoneId` must equal that landmark's own zone. Postgres cannot express that without a trigger, and Prisma 7.9.1 has no `@@check` at all. `deletePlace` maintains it by hand across seven writes in one transaction; a landmark that changes zones is the second place that agreement has to be kept.
- **A cycle is representable.** `zone.parentId` is a self-referencing foreign key: Postgres will happily accept "Terra's parent is Regno di Kang" while Kang is under Terra, cutting the subtree off the root. `fetchZoneDescendantIds` already carries a `seen` guard for exactly this reason. No invariant refuses it today because, until now, nothing could write the edge from the UI.
- **TD-93 established how a placement refuses.** The pre-state travels inside `updateMany`'s `where` (`{ id, lat: null }`), so Postgres refuses a second placement rather than a client-side list that may have been read minutes ago.
- **`poi.zoneId` is `NOT NULL`; `zone.parentId` is nullable only for the root.** Both are `onDelete: Restrict`.
- **One maintainer, 41 unplaced places on the live database, and a strong preference for no migration** where the same behaviour is reachable without one.

## Decision

**Placing a place is what writes its parentage.** Positioning a place from the unplaced pool sets its edge — `zone.parentId`, or `poi.zoneId` for a landmark — to the map it is being placed on, in the same write that sets its coordinates. The edge stops being a value fixed at creation and becomes part of what a placement means.

Three clauses follow from it, and are part of the decision rather than implementation detail:

1. **Placement is the only act that re-parents.** There is no free-standing "move to another parent" operation. The tree edge changes in exactly three ways: creation, deletion's reparenting (SPEC-010 rule 2), and placement. Repositioning an already-placed place (SPEC-005) still never touches it — that is what keeps a drag from silently moving a place between maps.
2. **An unplaced row keeps its previous edge, and nothing reads it as truth.** `lat IS NULL` remains the single definition of "unplaced"; the stale edge is provenance — where the place came from — surfaced only as the pool row's "da «X»" label, and overwritten by the next placement. No column is made nullable and no migration is needed.
3. **A placement whose dependent writes must not happen unless the placement itself succeeds runs as one interactive transaction** — `prisma.$transaction(async (tx) => …)`. This is forced, not chosen: the guard from clause 1 is a conditional (`updateMany … where: { id, lat: null }`, then a count of zero means refused), and the array form of `$transaction` cannot branch on it. Introduced here as a pattern, so it is recorded here rather than discovered in a diff.

And one refusal that has to exist for the tree to remain a tree: **a place may not be placed onto itself or onto any of its descendants.** Like ADR-0010's invariant, this is enforced at the mutation boundary, in a shared helper, not by the database.

## Alternatives considered

### A separate `movePlace(id, newParentId)` mutation, orthogonal to placement

The conventional shape, and the one a reviewer will ask about first: re-parenting is its own operation, placement stays what it is, and moving does not require a map to be open. It would also allow moving an already-placed place without un-placing it first.

Rejected on the coordinates. A move that does not write coordinates leaves the row holding a `lat`/`lng` pair measured against the old parent's map image — a number that is still valid, still rendered, and now means a different spot, or a spot outside the new map's bounds entirely. The alternatives are to clear the coordinates (which is un-placing, so the operation collapses back into "un-place, then place") or to keep them (which produces the wrong pin, silently). The two columns are one fact; the mutation that writes them should be one mutation.

It is also a second way to change where a place is, next to a rule the DM already stated and TD-93 already enforces at the database: remove it from where it is before placing it elsewhere.

### Make the edge nullable — `parentId`/`zoneId` null while a place is in the pool

The honest model of "in the pool, belonging to nothing", and it would make the stale value in clause 2 unnecessary.

Rejected on cost and on precedent. It is a migration on a `NOT NULL` column that every read of `poi` currently trusts — `fetchPlaceChildren`, `checkPlacement`'s sibling query, `deletePlace`'s reparent, ADR-0010's follow-through — and it introduces a second representation of "unplaced" alongside `lat IS NULL`, two columns able to disagree about one fact. That is the exact failure shape ADR-0009 was written against (`location` vs `residence`) and that ADR-0010 was written to keep from returning. It also buys the pool nothing: the pool is `lat IS NULL` either way.

### Keep the per-map pool; add "move under another map" to the place popover

Genuinely plausible, and cheaper-looking: a destination picker in the popover SPEC-016 already built, no change to what a placement means.

Rejected because it asks the DM to choose a destination from a list of place names, blind, when what they want is to look at the target map and click where the thing goes — and because it needs the same cycle refusal and the same entity follow-through anyway, so the cost is not lower, only spent on a surface nobody asked for. Worth being fair to it: there is no admin list or tree view for places today (a place can only be created by right-clicking a map), and if one ever exists, re-parenting away from a map becomes natural. This ADR does not block that; see _Revisit when_.

### A pre-read plus the array-form transaction, instead of an interactive one

Read the row, check `lat IS NULL` in application code, then run the array-form `$transaction` the codebase already uses in six places.

Rejected because it reopens the window TD-93 closed: the check and the write stop being one act, and a concurrent placement between them is exactly how a second placement gets through. Its argument in favour is real — one transaction idiom instead of two — and is the reason the interactive form is named in the decision rather than left to the implementer.

## Consequences

**Positive**

- Moving a place from one map to another becomes possible at all, with no schema change, no migration and no new column.
- A place can no longer hold coordinates belonging to a map it is not on: the only write that sets one sets the other.
- One pool means the picker's contents and `countUnpositionedPlaces` finally describe the same set, which is what TD-103's interim fix could not deliver — it stopped the entry from lying about availability without deciding what the pool should contain.
- The dormant `zoneId` in `updatePoi` gets resolved rather than left as a second, invariant-breaking door to the same state change (SPEC-017 T6).

**Negative**

- **A third invariant with no database enforcement.** Cycles join ADR-0010's `zoneId`/`poiId` agreement and TD-93's one-place-one-position as rules that live in a mutation. The check goes in a shared helper for that reason; a future second writer of the edge would still have to remember to call it.
- **A second transaction idiom.** The interactive form holds a connection for the duration of the callback and is easy to misuse (long-running work inside a transaction). Six existing call sites keep the array form; this is not a licence to convert them.
- **A stale edge on every unplaced row**, meaning "where it came from" with no UI showing it except the pool's provenance label. Anyone reading `parentId` on an unplaced row without checking `lat` will read it as current and be wrong.
- **Re-parenting is reachable only from a map.** No map open, no move. Acceptable while places are created from maps and nowhere else, and recorded here so the constraint is a decision rather than an accident.
- **Placement of a zone gets a descendant walk** — the whole `zone` table read once and traversed in memory, the shape `fetchZoneDescendantIds` and `fetchPlaceAncestryChain` already use. Cheap at tens of rows; the first thing to look at if the tree ever reaches thousands.

**Neutral / follow-up work**

- ADR-0009's closed, code-declared `kind` vocabulary is untouched. This ADR says nothing about which kinds may nest inside which, and deliberately introduces no such rule.
- ADR-0010's invariant gains a second maintainer: `placeLandmark` joins `deletePlace` in carrying an entity's `zoneId` along with its landmark. Two hand-maintained copies of one agreement is the ceiling — a third is the signal to extract it.
- SPEC-017 T10 (a landmark's missing "sposta nei luoghi non posizionati") is the symmetric door into the pool. It is cuttable without reopening this decision; cutting it means the pool stays one-way for landmarks.
- `updatePoi`'s `zoneId` should be dropped from the update schema rather than taught the follow-through: nothing sends it, and deleting an unreachable capability is cheaper than maintaining an invariant across two writers.

## Revisit when

- **An admin list or tree view for places exists.** That is when re-parenting away from a map becomes natural, the third alternative above returns on its merits, and clause 1 ("placement is the only act that re-parents") is the clause to reopen — not the decision as a whole.
- **A second writer of `parentId`/`zoneId` appears.** The cycle refusal and the entity follow-through are each in one place today; a second writer is the moment that stops being true, and both belong in shared helpers before it happens rather than after.
- **The pool outgrows a dropdown** (SPEC-017 puts that at roughly a hundred rows). Changing the surface may reopen how a destination is chosen, which is the same question the third alternative asks.
- **Prisma or Postgres makes the invariants declarable** — schema-level check constraints, or a decision to accept triggers in this project. Cycles and ADR-0010's agreement would both move to the database, and two of the three "no enforcement" consequences above would go away.
