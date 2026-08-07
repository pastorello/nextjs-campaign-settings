# ADR-0009: Model the world as one polymorphic `poi` tree, not a table per place type

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** the maintainer (DM), with Claude Code
- **Related:** [SPEC-004](../specs/004-world-model.md) (the design this records), supersedes the schema direction in [SPEC-003](../specs/003-real-relations.md) (analysis kept, plan dropped), builds on [SPEC-002](../specs/002-map-poi-persistence.md)'s `poi` table, [ADR-0008](./0008-map-image-storage.md) (map image storage this model depends on), TD-61 (option-membership validation, shipped independently)

## Context

The setting's geography existed three times, in incompatible shapes: `Location.ts` (a 33-entry enum, place _type_ recorded only in a comment), `celestialPlanes` (a 7-entry enum for `deities.residence`), and four map images wired together by nothing but their file names —

```
piani-esistenza.jpg → mondo-materiale.jpg → regno-di-kang.jpg → skreebars.jpg
     (universe)            (plane)              (region)          (city)
```

— a hierarchy the DM plainly thinks in, that no table expressed. [SPEC-003](../specs/003-real-relations.md) set out to fix the narrower problem — `npc.location`/`npc.faction` are bare `Int`s nothing validates — by giving `location` and `faction` their own flat tables with foreign keys. Mid-review the DM's actual intent surfaced: this is meant to become a tool for **building** a world, not referencing one campaign's fixed geography — uploading maps, nesting planes inside the universe, regions inside planes, cities inside regions, with no source edit and no redeploy. A flat `location {id, name}` table is not a step toward that; the table needs `parentId`, `kind`, coordinates and a map of its own, which is most of the design SPEC-003 was trying to avoid committing to yet.

[SPEC-004](../specs/004-world-model.md) is the spec that replaced it. This ADR records the one decision inside it that shapes everything else: **how many tables the tree needs.**

Constraints that mattered:

- **A record's location must be derivable, not typed.** `deities.residence` and `deities.location` are two independent columns today, and nothing keeps them consistent — the seed itself has Helios's `residence: Cieli` and `location: Paradiso` agreeing only by luck, with no constraint that would catch the pair disagreeing. A second stored column is exactly the shape of bug this needs to not reintroduce.
- **Containment must be arbitrarily deep and cheap to query.** Universe → plane → region → city → dungeon → room → NPC is realistic, and a naive per-level query would cost one round trip per tier.
- **The DM does not want place types proliferating into custom values** — decided explicitly 2026-08-06. `kind` needed to be closed, not a table the DM could grow without a code change.
- **This had to stay additive for its first shippable slice** (SPEC-004 §5.1) — no dropped column, no migrated data, nothing that works today breaking, so the MVP could be built, used and reshaped before anything irreversible happened.

## Decision

**One table, `poi`, models every kind of place and every pin on it.** A universe, a plane, a city, a tavern, and the marker for an NPC or a deity are all rows in the same table, distinguished only by:

- `kind` — a string validated against a fixed, code-declared set (`universe`, `plane`, `region`, `city`, `dungeon`, plus the existing 14 leaf categories, plus `npc`/`deity` for entity pins). Not a database enum and not a lookup table — a closed vocabulary enforced at the Zod boundary, inheriting TD-61's option-membership pattern. `navigable` (does clicking this open a map?) is derived from `kind` in code, not a column, so a row cannot claim `kind: "city", navigable: false` — a state a boolean column could represent but nothing would mean.
- `parentId` — self-referential, `onDelete: Restrict` so deleting a place with children is rejected outright rather than silently orphaning them. Null only for the single universe root.
- `lat`/`lng` — nullable, and nullable for two different reasons that look identical: the parent has no map to be positioned on (_contained_, not _positioned_ — an NPC inside a tavern), or nobody has placed this row on the map yet (_unplaced_, the state every migrated legacy place starts in). The UI tells the two apart by checking whether the parent has a map, not by a separate flag.
- `mapImage`/`mapBounds`/`mapInitialView`/`mapInitialZoom` — a place's own map, meaningful only for navigable kinds, null otherwise.
- `linkedType`/`linkedId` — unchanged from SPEC-002, and now carrying a `@@unique` constraint: one pin per NPC or deity. A travelling NPC gets moved, not duplicated.

A record's location is **never stored on the record**. `npc.location`, `deities.location` and `deities.residence` are read by walking up from the entity's own pin (`linkedType`/`linkedId` → its `parentId` → that row's title, and again for the plane above it). One pin at Paradiso yields both "Paradiso" and "the Heavens" — the contradictory pair the current schema can represent today becomes structurally impossible once those columns are gone.

`faction` is the one exception, and stays a real, separate table (`id`, `name`, `npc[]`) — it is flat, unrelated to the containment tree, and gains nothing from being folded into `poi`.

## Alternatives considered

### A table per place kind (`plane`, `region`, `city`, `dungeon`, …)

The conventional relational answer, and it was rejected mainly on the containment query. "Give me everything under this node" would mean either a table per tier with a foreign key to the tier above (rigid — adding a tier between two existing ones is a migration, not a config change) or a polymorphic parent reference spread across N tables (the query has to check all of them, and Postgres cannot enforce a foreign key against "one of these tables"). A closed, code-declared `kind` string on one table gets the same integrity SPEC-003 §6 already argued for closed vocabularies, without the join fan-out.

### SPEC-003's flat `location`/`faction` tables, kept as originally scoped

Doable, and it would have shipped TD-61's correctness fix alongside real foreign keys sooner. Rejected because it actively works against the containment hierarchy: a flat table with a foreign key from `npc` has no notion of "this location is inside that one," so the DM's stated goal — planes containing regions containing cities — would need a second migration on top of the first, throwing away the FK relationship SPEC-003 had just built. Better to not build the wrong shape once the right one was known.

### A boolean `navigable` column instead of deriving it from `kind`

Cheaper to query ("show me every navigable place" is a `WHERE` clause instead of an in-memory filter over the closed set), and rejected for exactly that convenience: a column independent of `kind` can disagree with it, and nothing would catch `kind: "city", navigable: false`. `kind` already fully determines navigability — deriving it makes the wrong state unrepresentable instead of merely unlikely. Revisit if the navigable/leaf split is ever queried at a scale where the in-memory filter shows up in a profile.

### Migrate the DM's existing 33 places and four maps as part of the same change that builds the tree

Rejected for the MVP specifically (SPEC-004 §5.1's "purely additive" constraint). Building a world from nothing is the DM's own stated starting point and the cheapest way to prove the navigation works before trusting it with real data. The legacy migration became its own later, explicitly reviewed step (T3/T4 in SPEC-004 §10) once the tree itself was working.

## Consequences

**Positive**

- One query shape for "what does this place contain," at any depth, instead of a join that grows with the number of kinds.
- The Helios-style contradiction (a place and a residence that can silently disagree) becomes impossible once the derived columns replace the stored ones — there is only one fact to be wrong about.
- Adding a richer kind (`plane`, `city`, `dungeon` alongside the MVP's `region`) is an entry in a closed set plus a UI change, not a migration — proven in practice when SPEC-004's T2 did exactly that with no schema change, `kind` already being `String`.
- The MVP shipped without touching any existing column, so it could be built, exercised, and have its first real defect (T3/T4's migration) fixed before anything irreversible ran.

**Negative**

- `poi` is now one wide table serving several different shapes of row — a leaf POI, a navigable place, an entity pin — and reading it means knowing which columns apply to which `kind`. Mitigated by `PlaceChild`/`Poi`'s TypeScript interfaces documenting the split, but a raw `SELECT * FROM poi` is less self-explanatory than four narrower tables would be.
- A closed `kind` vocabulary means adding a place type is a code change and a deploy, in a tool whose whole point is that the DM authors their world without one. Accepted deliberately: the set describes the tree's _structure_, which is the app's model; the DM authors the _contents_. The escape hatch, if this ever chafes, is a `kind` table — the `{id, navigable, …}` config shape this ADR uses is what makes that swap cheap later.
- Every read of a record's location now costs a tree walk instead of a column read. Mitigated for list views by resolving the whole `poi` table in one query and walking pointers in memory (SPEC-004 T4) rather than one query per row — see `deriveEntityLocations`.

**Neutral / follow-up work**

- `npc.location`, `deities.location` and `deities.residence` are not yet dropped (SPEC-004's T5). They stay live and correct today; deleting them is deliberately sequenced after the DM confirms the migrated tree (T3/T4) actually reflects their world, since it is "the point of no easy return" — a down migration has to exist before that step ships.
- `faction` remains outside the tree, on its own table, by design — not an oversight to reconcile later.

## Revisit when

The 33 migrated legacy places (T3) turn out to need real geographic accuracy rather than the DM's freely-reparentable starting guess — at that point the "review before T5" step this ADR assumes becomes the actual bottleneck, not a formality.

Or if `poi` genuinely needs per-kind columns that do not generalize (a dungeon's grid dimensions, a city's population) — at that scale a `kind`-specific side table (`poi_dungeon_meta`, keyed on `poi.id`) is cheaper than widening the shared table further, and does not require abandoning the one-tree model this ADR chose.
