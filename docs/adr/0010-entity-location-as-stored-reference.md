# ADR-0010: Store an entity's location as a direct reference, not derive it from a pin

- **Status:** Accepted. _(Marked Proposed from 2026-08-08, this ADR's own date, until the 2026-08-17 Phase 3 closure audit noticed the status line had simply never been updated — the decision it records was implemented as [SPEC-008](../specs/008-entity-location-reference.md), shipped and closed the same day it was drafted, and every spec/ADR built since (SPEC-009, SPEC-010, SPEC-011) treats the `zoneId`/`poiId` model as settled fact, not a live proposal.)_
- **Date:** 2026-08-08
- **Deciders:** the maintainer (DM), with Claude Code
- **Related:** partially supersedes [ADR-0009](./0009-world-tree-as-one-polymorphic-table.md); records the decision behind [SPEC-008](../specs/008-entity-location-reference.md); SPEC-004 (the tree this still builds on), SPEC-002 (`poi.category` markers, which become the `poi`/landmark half of this split)

## Context

ADR-0009 chose to never store an entity's location on the entity itself — `npc.location`/`deities.location`/`deities.residence` were dropped (SPEC-004 T5b) specifically because two independent stored columns (`location` and `residence`) could silently disagree, and the fix was to make the fact derivable from a single pin instead of stored twice.

That decision has a real cost the DM ran into immediately after T5b shipped: an admin list sorted or filtered by a derived value needs to walk the whole tree in memory for every request, because there is no column for the database to sort or filter on. Restoring that capability without reintroducing a stored column seemed, at first, like a contradiction — but the actual bug ADR-0009 was protecting against was **two** independent columns able to disagree, not stored data per se. A single foreign key is exactly as single-sourced as a derived pin walk; it just puts the one fact in a different place.

Separately, the DM stated a stronger requirement than ADR-0009 anticipated: an entity's location must always be a reference to something that already exists and has its own identity (a Zone or a named landmark), never an arbitrary coordinate. Today's pin mechanism (`poi.linkedType`/`linkedId`, an entity's own `lat`/`lng`) allows exactly the arbitrary-point placement the DM does not want — a pre-migration audit found this was never actually used in practice (all 124 existing entity pins have null coordinates, only a parent), which suggests the freeform-coordinate capability was cost without benefit from day one.

## Decision

**An NPC or deity stores its location as two nullable references, `zoneId` and `poiId` — never an independent coordinate — where `zoneId` is always the sort/filter key and `poiId` is a strictly optional refinement.** Settled 2026-08-08 on the DM's own "provincia/città" framing: a POI belongs to exactly one Zone, so whenever `poiId` is set, `zoneId` is set alongside it to that POI's own zone — there is no case where the two disagree, and no case where only `poiId` is meaningfully set without `zoneId`. This replaces the "derive by walking the pin" approach for entities specifically. It does not change how Zones and landmark POIs are positioned relative to each other (SPEC-004's tree, SPEC-005's repositioning) — only how entities point at that tree.

The `poi` table (SPEC-004's single polymorphic table) splits into two: `zone` (the self-referential, map-carrying containment tree ADR-0009 established) and `poi` (SPEC-002's category-marker landmarks, now always belonging to exactly one `zone`). This also resolves ADR-0009's own named weakness — "a raw `SELECT * FROM poi` is less self-explanatory than four narrower tables would be" — for the two shapes (containment node vs. leaf landmark) that most needed the distinction: a `poi` row can no longer have children even by accident, because the schema no longer gives it a `parentId` to have them with.

## Alternatives considered

### Keep deriving from a pin, and just add database-level support for sorting/filtering on it

Considered and rejected. A derived value can be indexed for filtering only by materializing it somewhere (a generated column, a cache table) — which reintroduces exactly the "second place the same fact lives" shape ADR-0009 rejected, now with an extra synchronization mechanism to keep it correct. A direct FK is the simpler single source of truth, not a compromise of the original principle.

### A polymorphic `(locationType, locationId)` pair, mirroring today's `linkedType`/`linkedId`

Rejected specifically because SPEC-002's own comments already flag that pattern as "not a foreign key" — Postgres cannot enforce referential integrity against "one of these two tables" with a single column pair. Two separate, single-target foreign keys (`zoneId`, `poiId`) get real integrity instead of an app-level convention, at the cost of two columns instead of one.

### `zoneId`/`poiId` as mutually-exclusive alternatives, with a check constraint enforcing exactly one

The spec's first draft (2026-08-08, before this ADR's Decision above was reached): one FK for "attached to a Zone directly" and the other for "attached to a specific POI," never both, enforced by a `CHECK (num_nonnulls("zoneId", "poiId") <= 1)`. Rejected once sorting/filtering entered the picture: with the two treated as alternatives, "sort by location" means sorting by whichever of two relations is populated — `ORDER BY COALESCE(zone.title, poi.title)`, which Prisma's query builder cannot express, forcing a choice between raw SQL (a new pattern for this codebase), a denormalized label column (reintroducing the very "second place the same fact lives" risk this ADR exists to avoid), or splitting the UI into two separate sortable columns. Making `zoneId` always-present-when-anything-is-known instead of an alternative to `poiId` removes the ambiguity at its root — there is always exactly one relation to sort by. Also technically moot in its original form: `@@check` does not exist in Prisma 7.9.1's schema DSL at all (confirmed empirically), so it would have needed raw SQL regardless.

### Keep entities inside the single `poi` table as a `kind: "npc"`/`"deity"` row, just add a locationId elsewhere

Rejected as strictly worse than the two-table split: it keeps every downside ADR-0009 already named (wide table, ambiguous columns per kind) while gaining nothing the split doesn't also gain. Once landmarks (`poi.category` rows) and containment nodes (zones) are pulled apart because they behave differently (a landmark cannot have children; a zone can), leaving entity-linked rows behind in the old shape has no argument left in its favour.

## Consequences

**Positive**

- Sorting and filtering an entity list by location becomes a plain indexed query — no in-memory tree walk for every admin-list request.
- "A leaf cannot have children" becomes a schema-enforced invariant (no `parentId` column on `poi`) rather than an application convention, closing ADR-0009's own named structural gap.
- Real Postgres foreign-key integrity for entity placement, replacing the `linkedType`/`linkedId` pair's app-level-only guarantee.
- Matches how the DM actually uses the system today: zero of 124 existing entity pins have ever used freeform coordinates.

**Negative**

- An entity can no longer be placed at an arbitrary point independent of a named Zone or landmark — a deliberate loss (§3 of SPEC-008), not an oversight, but a real capability reduction from what SPEC-004 shipped.
- Two tables (`zone`, `poi`) plus two FK columns on every location-bearing entity is more schema surface than one polymorphic table — accepted because it makes the leaf/container distinction structural rather than conventional.
- The `zoneId = poi.zoneId` consistency, whenever `poiId` is set, is an application invariant maintained by a single write path, not a database constraint — Postgres cannot express a `CHECK` against another table's column without a trigger. Same trust boundary as every other mutation in this codebase (Zod + `requireSession()` at the one entry point), not a new risk class, but worth naming since it is new _state_ to keep consistent, unlike a single-column FK.

**Neutral / follow-up work**

- ADR-0009's decision to keep the containment tree closed-vocabulary and code-declared (`kind`) is unaffected and still holds for `zone`.
- SPEC-006 (table-backed options) remains a separate, general mechanism, and this ADR ends up not needing it at all: location assignment turned out to need no new `PageMeta` `controlType` — SPEC-008 §5/§7 settled on a dedicated modal outside the form/metadata layer entirely, once the DM's actual workflow (place entities long after creating them, from the map or the list, never from the creation form) made an inline form control the wrong shape regardless of how its options were sourced.
- SPEC-007 (placement backlog) simplifies once this ships: "unplaced" becomes `zoneId IS NULL` (which implies `poiId IS NULL` too, given the consistency rule above), a column check instead of a tree-walk-derived state.

## Revisit when

If the DM later wants precise, entity-specific coordinates independent of any named landmark (e.g., "twelve guards scattered around the courtyard, each at their own exact post") — at that point the non-goal in SPEC-008 §3 becomes the actual blocker, and an optional `lat`/`lng` pair alongside `poiId` (position _within_ a landmark, not instead of one) is the smallest change that would restore it without reopening freeform placement everywhere.
