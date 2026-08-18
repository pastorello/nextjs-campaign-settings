# SPEC-008: Entity location as a direct reference

- **Status:** Done. T1–T9 implemented and merged to `spec-008-entity-location-reference` (PR #135 docs, #136 code) as of 2026-08-08; see §11 for outcome.
- **Date:** 2026-08-08
- **Phase:** 3
- **Related:** amends [ADR-0009](../adr/0009-world-tree-as-one-polymorphic-table.md) via [ADR-0010](../adr/0010-entity-location-as-stored-reference.md); supersedes SPEC-004 §5 point 6 and §10's "the map is the only way to place a record"; builds on SPEC-002 (map POI persistence, the `poi.category` markers this spec calls landmarks); SPEC-005 (place repositioning — unaffected, still how a Zone or a landmark POI itself gets moved); unblocks the sort/filter need SPEC-004 §10 deferred as "a separate feature if it is ever wanted"; distinct from SPEC-006 (table-backed options, which targets `faction` and other `PageMeta` form controls generally — this spec's location assignment is a bespoke modal outside the form/metadata layer entirely, not a consumer of SPEC-006's mechanism, since SPEC-006 is still Draft and unstarted)

---

## 1. Problem

A DM wants to know, at a glance and sorted, where every NPC and deity is — and wants to ask "who is in Skreebars?" as easily as filtering by any other field. Neither works today: an entity's location is never stored, only derivable by walking its map pin up the world tree, so the admin list can display it (SPEC-004 T4/T5a) but cannot sort or filter by it without recomputing the whole tree in memory for every request.

Placing an entity is also looser than the DM wants. Today, giving an NPC a location means clicking an arbitrary point on some zone's map — any pixel, anywhere. Nothing stops two DMs (or the same DM on two days) from placing "the blacksmith" at two unrelated, unnamed points that both happen to be inside the same tavern, with no way to later discover they meant the same place. The DM wants every entity's location to be a specific, already-named thing — a zone or a landmark someone deliberately created — never a bare coordinate with no identity of its own.

## 2. Goal

An NPC or deity's location is a stored reference to an existing Zone — optionally refined to a specific landmark POI within it — assignable from a list at creation or later, sortable and filterable by zone like any other field, and it is never possible to place one at an arbitrary, unnamed point.

## 3. Non-goals

- **Freeform, pixel-precise per-entity placement.** Explicitly rejected by the DM (2026-08-08): if two entities are at "the same spot" they are at the same landmark, full stop — there is no per-entity coordinate independent of an existing Zone or POI.
- **Changing how Zones nest or render their own maps.** SPEC-004's tree (Zone → Zone, each navigable Zone carrying its own map image) is untouched by this spec.
- **Repositioning a Zone or a landmark POI on its parent's map.** That is SPEC-005, already shipped, and continues to work exactly as it does today — this spec only changes how _entities_ reference a Zone/POI, not how Zones/POIs are placed on each other.
- **Table-backed options for `faction` or other fields.** SPEC-006's problem, separately scoped. The location-assignment modal (§5) is its own bespoke flow, not a `PageMeta`-driven form control at all — see §7 for why it does not even need SPEC-006's async-options mechanism.
- **Migrating `poi.category` markers that are not landmarks a DM would place an entity at** (if any such use ever exists) — out of scope; every existing `poi.category` row becomes a landmark under this spec's model.
- **A location field inside `NpcForm`/`DeityForm`.** Decided 2026-08-08 (§5): the DM's own workflow creates entities before deciding where they go, so location assignment is a separate, dedicated flow (a modal, reachable from the list and from the map), never a step in creating or editing an NPC/deity's traits.

## 4. User stories

- As a DM, I want to assign an NPC's location by picking an existing zone or landmark from a list, so that I never end up with two unnamed, un-discoverable pins that are secretly the same place.
- As a DM, I want the NPC and deity admin lists sortable by location, so that I can group everyone in the same region without scrolling.
- As a DM, I want to filter the NPC list to "everyone in Skreebars," so that I can prepare a session without hunting through every row.
- As a DM, I want to create an NPC without deciding their location yet, and place them later, so that I am not blocked mid-brainstorm by a decision I am not ready to make.
- As a DM, I want to assign a location to an existing NPC either from the admin list or from the map itself, so that I can place people in whichever context I happen to be working in.
- As a DM, I want to narrow "everyone in Skreebars" down to "everyone exactly at the Locanda del Cinghiale Rosso," so that a Zone that has grown crowded with NPCs is still easy to search.

## 5. Behaviour

**Design confirmed with the DM 2026-08-08, and it changes the shape of this section from the first draft:** the DM's actual workflow is to design a batch of NPCs first, entirely without thinking about location, and only later — deliberately, on the map — go place the ones that exist. Placement is not something that happens while filling in an NPC's traits. Consequently:

- **`NpcForm`/`DeityForm` gain no location field at all.** Every entity is created with `zoneId`/`poiId` both `null` ("Sconosciuta" — see below), and location is never part of what those forms edit.
- **Assignment happens through a dedicated modal**, not the entity form. The DM reaches it from two places: a button on the admin list (per row — "assign/change location" for that specific NPC or deity) and a button on the map itself (contextual — pick an existing NPC/deity and attach it to the zone or landmark currently in view). Both open the same modal and call the same mutation; the map entry point differs only in pre-filling the target zone/POI from what the DM is currently looking at.

  > **The map entry point is superseded, 2026-08-18.** The DM found that
  > attaching an entity from a right-click on empty map space asks them to file
  > something into a location whose current contents they cannot see. It is
  > replaced by the same operation inside the place's own popover, which lists
  > what is already there and offers a per-entity removal — recorded in
  > `ROADMAP.md`, with the menu entry's removal tracked as TD-96 and explicitly
  > blocked on the popover shipping, so the operation is never unreachable in
  > between. **The admin-list entry point and the modal itself are unaffected**,
  > as is everything this spec decided about where an entity's location is
  > stored (ADR-0010).

- This is a new, bespoke flow — distinct from `MapPOIPanel.tsx`'s existing "create a new place/landmark here" actions and from SPEC-005's repositioning (which moves a Zone/POI itself, not what points at it).

**Confirmed with the DM 2026-08-08: the order is always place-first, entity-second.** A Zone or landmark POI is created (from the map, as today — `MapPOIPanel.tsx`'s existing flow, updated to write `zone`/`poi` instead of the old single `poi` table), and only afterward can an NPC or deity be attached to it, since entities never carry their own coordinates. This retires one specific piece of today's map UI: `AddPlaceInput`'s `kind: "npc"`/`"deity"` variants (`app/modules/maps/components/map/MapPOIPanel.tsx`), which today let a DM click a spot on the map and create a brand-new pin linked to an existing NPC/deity, complete with its own `lat`/`lng`. That variant is removed entirely — creating a new _entity_ is never something the map does, and attaching an _existing_ one to a place goes through the assignment modal instead, which takes no coordinate. The "create a new Zone/landmark here" variants of `AddPlaceInput` are unaffected.

**"Sconosciuta" — presentation only, never a stored row.** Confirmed with the DM: `zoneId`/`poiId` stay genuinely `NULL` when nothing is assigned — no sentinel row is created in `zone` or `poi`. "Sconosciuta" is copywriting: wherever a location would render (list column, modal's current-value display), a `null` renders as `t("common.location.unknown")`, resolved at the same render boundary every other field's label already goes through (ADR-0007). The geography tree itself never contains a fake "Unknown" place a DM could stumble into while browsing real geography.

**Admin list — sorting is always by Zone; filtering starts at Zone and can narrow to a POI within it.** Settled 2026-08-08, using the DM's own analogy: Zone is the "provincia," POI the "città" — you sort by province, since a POI belongs to exactly one Zone and nothing is lost keying `ORDER BY` on `zoneId` alone, but you may still want to search down to a specific "città" once a "provincia" is already crowded (see the second bullet below):

- A "Location" column, sortable via a plain `ORDER BY zone.title` (one join, one relation — no ambiguity about which of two relations to sort by, because there is only ever one that matters for ordering). It _displays_ the more precise POI title when one is set (falling back to the zone's own title, falling back to "Sconosciuta"), but that display choice never affects sort order.
- A filter control scoped to Zones first: picking a Zone filters to every entity whose `zoneId` matches that zone _or any of its descendants_. Descendant-inclusive filtering reuses the same tree-walk `fetchPlaceChildren` already does for the map's "who is here" panel — just applied to a `WHERE zoneId IN (…)` instead of a `poi.parentId`.
- **Confirmed with the DM 2026-08-08 (in scope, not deferred): once a Zone is picked, a second, narrower control appears offering the POIs inside that Zone specifically** — the DM's own stated reason is that a popular Zone can accumulate enough NPCs that "who's here" stops being enough; "who's exactly at the Locanda del Cinghiale Rosso" needs to be answerable too. This is `WHERE poiId = X`, layered on top of the Zone filter rather than replacing it (a POI's zone is implied, but the UI still shows the Zone selection as context). The filter control mirrors the assignment modal's own two-step shape (§5) — Zone first, POI second and optional — rather than being a separate design.
- "Sconosciuta" is itself a filter option, equivalent to `WHERE zoneId IS NULL` — this is SPEC-007's placement-backlog need, met as a side effect of this filter rather than as separate work (see §3).

**Map rendering**

- An entity pointed at a landmark POI appears at that POI's own marker position — it does not get an independent dot.
- An entity pointed directly at a Zone (no specific landmark inside it) has no marker at all; it is listed as present in that Zone's "who is here" panel, the same UI SPEC-005/SPEC-004 already use for unplaced-but-contained rows.

**Edge cases**

| Situation                                                    | Expected behaviour                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No location assigned                                         | Renders as "Sconosciuta" (a label, never a stored row); filterable as its own option, which is SPEC-007's need met without SPEC-007's own view                                                                                                                             |
| Referenced Zone or POI deleted                               | Rejected outright (`onDelete: Restrict`), same pattern as the tree's own `parentId` today — a DM must reassign every entity pointed at a place before that place can be deleted                                                                                            |
| Zone filter on a Zone with many descendants                  | One query resolves the whole descendant id set (`fetchPlaceChildren`'s existing approach), then a single indexed `WHERE zoneId IN (…)` — not one query per level                                                                                                           |
| An entity's Zone or POI is itself moved (SPEC-005)           | No effect on the entity's reference — `zoneId`/`poiId` are stable ids, unaffected by the referenced row's own `lat`/`lng` changing                                                                                                                                         |
| Sorting by location                                          | Always `ORDER BY zone.title`; "Sconosciuta" (`zoneId IS NULL`) sorts as its own group — position (first/last) still to be decided at implementation, but the mechanism is settled                                                                                          |
| `poiId` set but a stale `zoneId` disagrees with `poi.zoneId` | Should never occur — the assignment mutation is the only writer of both, and always sets `zoneId := poi.zoneId` in the same write when a POI is chosen. Not enforced by a DB constraint (see §6); an inconsistency would be an application bug, not a reachable user state |

## 6. Data model changes

**Split today's single `poi` table into two:**

```prisma
model zone {
  id             Int      @id @default(autoincrement())
  title          String
  description    String?
  kind           String   // "universe" | "plane" | "region" | "city" | "dungeon" — closed vocabulary, code-declared, same pattern as today's PlaceKind
  parentId       Int?
  parent         zone?    @relation("ZoneTree", fields: [parentId], references: [id], onDelete: Restrict)
  children       zone[]   @relation("ZoneTree")
  lat            Float?   // position on the parent zone's map; null only for the universe root or an unplaced zone
  lng            Float?
  mapImage       String?
  mapBounds      Json?
  mapInitialView Json?
  mapInitialZoom Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([parentId])
}

model poi {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  category    String   // POI_CATEGORIES, unchanged from SPEC-002
  zoneId      Int      // required — a landmark always belongs to exactly one zone, never null
  zone        zone     @relation(fields: [zoneId], references: [id], onDelete: Restrict)
  lat         Float
  lng         Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([zoneId])
}
```

`npc` and `deities` each gain two nullable foreign keys, **not mutually exclusive** — this changed 2026-08-08 from the first draft, which had them as alternatives with a `@@check` XOR constraint. The DM's "provincia/città" framing settled it differently: `zoneId` is the field everything sorts and filters on, always present whenever any location is known at all; `poiId` is a strictly optional refinement, and whenever it is set, `zoneId` is _also_ set, to the same value as `poi.zoneId` — because a POI belongs to exactly one zone, there is nothing else `zoneId` could correctly hold once a POI is chosen.

```prisma
model npc {
  // ...existing fields...
  zoneId Int?
  zone   zone? @relation(fields: [zoneId], references: [id], onDelete: Restrict)
  poiId  Int?
  poi    poi?  @relation(fields: [poiId], references: [id], onDelete: Restrict)
}
```

This consistency (`poiId` set ⇒ `zoneId = poi.zoneId`) is **not enforced by a database constraint** — there is exactly one write path (the assignment modal's mutation, §9), and it always sets both together. This is the same trust boundary every other mutation in this codebase already relies on (Zod validation + `requireSession()` at the one entry point, not a DB-level belt-and-braces), not a new risk class. A `CHECK` constraint comparing `npc.zoneId` to a value on the _referenced_ `poi` row cannot be expressed in Postgres without a trigger regardless — this was one of the reasons the earlier "one column, XOR" design's `@@check` (confirmed absent from Prisma 7.9.1's schema DSL, 2026-08-08 — "Attribute not known") was going to need a trigger or raw SQL anyway; the two-column, non-exclusive design removes the need for that constraint entirely rather than working around its absence.

**Migration strategy — and why it is nearly free.** A pre-migration audit (2026-08-08) found all 124 existing entity pins (119 NPCs, 5 deities) already have `lat`/`lng` null and only a `parentId` — nobody has ever dragged an entity to a precise point since the pin mechanism shipped. So:

1. Every `poi` row with `kind` in the navigable set (or `kind: "poi"` at the root) becomes a `zone` row, keeping its existing `id` (explicit id insert, sequence reset after).
2. Every `poi` row with `kind: "poi"` (the category-marker landmarks) becomes a `poi` row in the new table, `parentId` renamed to `zoneId`, keeping its `id`.
3. Every `poi` row with `linkedType`/`linkedId` set (the 124 entity pins) is read once: `npc.zoneId` / `deities.zoneId` is set to that pin's `parentId`, then the pin row is discarded — no `poiId` ever gets set by this migration, since none of the 124 point at a landmark.
4. The old `poi` table is dropped once both new tables are populated and verified (a verifier script in the same spirit as SPEC-004 T5a's, re-run immediately before the drop).

- **Backfill needed?** Yes, but it is a straight `INSERT ... SELECT`, not a judgement call — every source row maps to exactly one destination row, unlike SPEC-004 T3's legacy-places migration, which needed the DM's manual review.
- **Reversible?** In principle, until entities start being pointed at landmark POIs (that information does not exist in the old shape and could not be reconstructed). Practically irreversible once used, same as every migration since TD-63.

## 7. Metadata changes

**No new `ControlType` is needed after all.** Because §5 settled on a dedicated modal rather than a field embedded in `NpcForm`/`DeityForm`, `location` never needs to render as a form control — it follows the same split `formFields.ts` already documents for `spells.savingThrow`/`concentration`: a real column, present in `pagesConfig` (so `buildEntitySchema`'s read-side `resultFieldValidators` can validate it coming back from Prisma, and the write-side schema knows the field exists), but **absent from `formFields`** (no `field(...)` call renders it in either form). The modal's own mutation (§9) is what actually writes `zoneId`/`poiId` — a bespoke server action outside `buildEntitySchema`'s generic create/update path, the same way `createPoi.ts` already sits outside it for the same reason (SPEC-002 §7).

`npcMeta.ts`/`deityMeta.ts` gain a `location` `PageMeta` entry whose `getDatum` resolves the POI's title if `poiId` is set, else the Zone's title if `zoneId` is set, else `t("common.location.unknown")` — read-only in effect, since nothing ever writes through it via the form. Sorting and filtering (§5) key on `zoneId` alone, regardless of what `getDatum` displays.

`queryFields`/`listConfig` gain the filter/column entries described in §5, both keyed on `zoneId`. `formFields` gains nothing.

## 8. Acceptance criteria

- [ ] An NPC/deity can be created with no location, and edited later to add one
- [ ] The location picker only ever offers existing Zones and POIs — no free text, no arbitrary coordinate entry
- [ ] The admin list sorts by Zone via a real `ORDER BY zone.title`, not an in-memory computation
- [ ] Filtering the admin list by a Zone returns every entity in that Zone and its descendants
- [ ] Once a Zone filter is active, a secondary filter narrows to one specific POI inside that Zone
- [ ] Assigning a POI always sets `zoneId` to that POI's own zone, in the same write
- [ ] The map's "create a new pin linked to an NPC/deity here" flow (`AddPlaceInput`'s `kind: "npc"`/`"deity"` variants) is removed; creating a new Zone/landmark from the map is unaffected
- [ ] Deleting a Zone or POI referenced by any entity is rejected, not silently orphaning
- [ ] The migration is lossless for all 124 existing entity pins (verified by a script before the old `poi` table is dropped, same discipline as SPEC-004 T5a)
- [ ] Every new mutation rejects an unauthenticated request
- [ ] Every new mutation rejects invalid input with field-level errors
- [ ] Coverage has not dropped

## 9. Implementation plan

**Order follows SPEC-004's own proven shape: additive first, destructive last.** The old `poi` table (kind-discriminated, `linkedType`/`linkedId`) keeps working completely unchanged through the additive half — nothing breaks mid-implementation — and only the final tasks touch anything that could lose data. This also means the table cannot be literally renamed `poi` mid-build (the name is still in use by the old shape); the new landmark table is named `poi` only from the migration that drops the old one onward.

**Representative files, grouped by what changes** (the maps module has ~20 files reading `poi.kind`/`linkedType`/`linkedId` in some form — `usePOIManager.ts`, `useLinkedEntityMarkers.ts`, `useNavigableChildren.ts`, `useUnplacedChildren.ts`, `MapPOIPanel.tsx`, `createPlace.ts`, `createPoi.ts`, `updatePoi.ts`, `fetchPois.ts`, `fetchPlaceChildren.ts`, `fetchDerivedAncestry.ts`, `deriveEntityAncestry.ts`, `placeSchema.ts`, `poiSchema.ts`, `app/modules/maps/types/poi.ts` among them — each gets touched once the underlying table shape changes; listed here as a class, not enumerated line by line, per the pattern this file itself follows elsewhere):

| #   | Area                        | Representative files                                                                                                                                                                            | Change                                                                                                                                                                                                                                                                                                                                                |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Schema (additive)           | `prisma/schema.prisma`                                                                                                                                                                          | New `zone` table; `npc`/`deities` gain nullable `zoneId`/`poiId`. Old `poi` table untouched.                                                                                                                                                                                                                                                          |
| 2   | Backfill (additive)         | new one-off script, `app/seed/migrateZoneTableT1.ts`-style                                                                                                                                      | Populate `zone` from the old `poi` table's navigable-kind rows (same id-preserving approach as T5b's migration); populate `npc.zoneId`/`deities.zoneId` from each entity's current pin's `parentId`. Old table unaffected, purely a read.                                                                                                             |
| 3   | Assignment modal + mutation | new files under `app/ui/components/` or a `app/modules/maps/` equivalent; a new server action (`app/lib/data/{npc,deities}/assignLocation.ts`-style)                                            | The two-step (Zone, then optional POI) picker described in §5, callable from both entry points in task 5 below.                                                                                                                                                                                                                                       |
| 4   | Admin list sort/filter      | `queryFields.ts`, `listConfig.ts`, `pageMetaFields.ts`, `fetchFilteredNpc.ts`/`fetchFilteredDeities.ts`, `getNpcCount.ts`/`getDeitiesCount.ts`                                                  | `location` `PageMeta` entry (§7); `ORDER BY zone.title` and the two-step Zone→POI filter (§5), reading the new `zoneId`/`poiId` columns already backfilled in task 2.                                                                                                                                                                                 |
| 5   | Map + list entry points     | `MapPOIPanel.tsx` (remove the `kind: "npc"`/`"deity"` variants of `AddPlaceInput`; add the "attach existing entity" trigger), `NpcLibrary.tsx`/`DeityLibrary.tsx` or the admin list row actions | Wires the modal from task 3 into both places named in §5.                                                                                                                                                                                                                                                                                             |
| 6   | Verification                | new script mirroring `verifyDerivedLocationsT5.ts`'s shape (deleted in T5b, but the pattern is worth reusing)                                                                                   | Confirms every entity's new `zoneId` matches its old pin's `parentId` for all 124 rows, before task 7 runs.                                                                                                                                                                                                                                           |
| 7   | Destructive: table split    | `prisma/schema.prisma`, a new migration, `app/lib/data/maps/**`, `app/modules/maps/**` (the full list above)                                                                                    | Rename the old `poi` table's remaining landmark rows into the new `poi` shape (`zoneId` required, no `kind`/`parentId`/`linkedType`/`linkedId`); drop those columns; every reader of the old shape is repointed to `zone`/`poi` as split. This is the "point of no easy return," same discipline as T5b: re-run task 6's verifier immediately before. |
| 8   | Docs                        | `docs/ARCHITECTURE.md` (maps section), this file's §11                                                                                                                                          | Record what shipped, same as SPEC-004 T6.                                                                                                                                                                                                                                                                                                             |

**Risks**

- The modal is new UI with no existing precedent in this codebase to extend (`MapPOIPanel.tsx` creates new places; this assigns existing entities to existing places) — budget for it as new surface, not a variant of something that exists.
- The `zoneId = poi.zoneId` consistency (§6) is an application invariant, not a DB constraint — a future direct-write bypassing the assignment mutation (a script, a different code path) could violate it silently. Worth a comment at both write sites pointing at each other, and possibly a read-time assertion in the verifier pattern SPEC-004 T5a established, if this class of bug shows up in practice.

**Resolved during spec review (2026-08-08), recorded here rather than left as open questions:**

- ~~Sorting mechanism across two relations~~ — resolved by making `zoneId` the sole sort/filter key (§5/§6); no `$queryRaw`, no denormalized label column, no split-column UI needed.
- ~~Picker UX (flat search vs. cascading)~~ — the zone/POI split settles this too: the natural shape is a two-step picker (choose the Zone first — required if choosing anything — then optionally narrow to a POI inside it), since a POI's own identity already implies its zone.
- ~~Whether `createPoi.ts`'s flow needs to change~~ — yes, in a specific, now-scoped way: it keeps creating Zones/landmarks (updated to the new tables), but loses the `kind: "npc"`/`"deity"` variants entirely (§5) — the map never creates entities, only attaches existing ones via the assignment modal.
- ~~Whether a narrower POI-level filter is wanted~~ — yes, confirmed in scope (§5): a second filter control, layered on top of the Zone filter once one is picked, anticipating that a single popular Zone can accumulate enough NPCs that Zone-level filtering alone stops being precise enough.

**Still open**

- None remaining at the product/architecture level. What's left is implementation-shaped: the exact component structure of the two-step assignment modal and the two-step filter control (likely sharing logic, both being "pick a Zone, then optionally a POI inside it"), and the null-sort position (first vs. last) noted in §5's edge cases.

## 10. Task breakdown

Mirrors §9's table, split so each task is independently reviewable and the additive half can ship (and be used) before the destructive half starts.

- [x] **T1** — `zone` table added to the schema; `npc`/`deities` gain nullable `zoneId`/`poiId`. Purely additive — nothing reads these columns yet _(test: migration applies; every existing row unaffected)_
- [x] **T2** — Backfill script populates `zone` from today's `poi` navigable-kind rows and `npc.zoneId`/`deities.zoneId` from each entity's current pin, id-preserving, idempotent, run by hand — same discipline as SPEC-004 T3/T4 _(test: re-running is a no-op; every one of the 124 entities gets a `zoneId`)_
- [x] **T3** — The assignment mutation (`assignLocation`-style, per domain): validates the DM picked an existing Zone (and optionally a POI within it), sets `zoneId`/`poiId` together, rejects unauthenticated/invalid input _(test: setting a POI sets `zoneId` to that POI's zone; rejects a POI from a different Zone context being passed without the matching zone; auth/validation gates)_
- [x] **T4** — The two-step assignment modal (Zone required, POI optional, scoped to the chosen Zone's children) _(test: picking a Zone narrows the POI options to it; clearing back to "Sconosciuta" is possible)_
- [x] **T5** — Modal wired into the admin list (a per-row action) and into the map (a new "attach existing NPC/deity here" action, replacing `AddPlaceInput`'s `kind: "npc"`/`"deity"` variants in `MapPOIPanel.tsx`) _(test: both entry points call the same mutation; the map's old create-pin-for-entity path is gone)_
- [x] **T6** — `location` `PageMeta` entry, `queryFields`/`listConfig` sort-by-Zone and the two-step Zone→POI filter on the admin list, keyed on the backfilled `zoneId`/`poiId` from T2 _(test: sorting is a real `ORDER BY`; filtering by Zone includes descendants; filtering by POI narrows further; "Sconosciuta" is its own filterable option)_
- [x] **T7** — Verification script (T5a/T5's pattern): confirms every entity's `zoneId` still matches its old pin's `parentId`, re-run immediately before T8 _(test: 124/124 lossless, same gate SPEC-004 T5a used)_
- [x] **T8** — The destructive migration: reshape the old `poi` table into the new landmark-only `poi` (drop `kind`, `parentId`, `linkedType`, `linkedId`; require `zoneId`), migrate every remaining landmark row, drop the now-redundant navigable-kind rows (superseded by `zone`, populated in T2) and entity pins (superseded by `npc.zoneId`/`poiId`, populated in T2) _(test: T7's verifier green immediately before; every `app/modules/maps/**`/`app/lib/data/maps/**` reader of the old shape updated and passing)_
- [x] **T9** — Docs: `docs/ARCHITECTURE.md`'s maps section updated to describe the `zone`/`poi` split; this file's §11 filled in

**Handoff note for T9 (2026-08-08).** T1–T8 are merged to `spec-008-entity-location-reference` (PR #136, CI green — Build/Lint/Unit/E2E). T9 is docs-only, two edits:

1. **`docs/ARCHITECTURE.md`'s maps section** — describe the `zone` (containment tree, self-referential `parentId`, carries its own map) / `poi` (landmark leaf, `zoneId` required, no children) split, replacing whatever it currently says about the old single polymorphic `poi` table (SPEC-004/ADR-0009's shape). Mention that `npc`/`deities` now carry `zoneId`/`poiId` directly rather than being derived from a pin — `deriveEntityAncestry`/`fetchDerivedAncestry` walk that FK chain now, not a `poi.parentId` chain.
2. **This file's §11 "Outcome"** — record what actually shipped vs. the plan: notably that T8's migration needed no data preservation beyond a `DELETE` (the live database had zero landmark rows at migration time), that TD-14's separate "landmark links to an entity" feature was dropped as part of T8 (confirmed with the maintainer 2026-08-08, not originally called out in this spec's prose — only implied by §6's target schema omitting `linkedType`/`linkedId`), and the `SortableHeader` sort-param bug (`fieldSort` vs. `sortFields`) found and fixed while building T6.

No code changes expected for T9. `/clear` before starting it — nothing here needs the current session's context, and `docs/ARCHITECTURE.md` plus this spec file are enough to pick it up cold.

## 11. Outcome

Shipped as planned in §9/§10, T1–T9, on `spec-008-entity-location-reference` (PR #135 docs, #136 code). Three points worth recording beyond the task table:

- **T8's destructive migration needed no data preservation beyond a `DELETE`.** The live database had zero landmark rows at migration time, so the "reshape the old `poi` table" step in practice dropped the superseded navigable-kind and entity-pin rows and required no row-by-row conversion.
- **TD-14's "landmark links to an entity" feature was dropped, not carried over.** The old `poi.linkedType`/`linkedId` pair is gone; a landmark can no longer point at an NPC or deity. This was confirmed with the maintainer on 2026-08-08 and was not called out explicitly in this spec's earlier sections — only implied by §6's target schema omitting `linkedType`/`linkedId`. `LINKABLE_ENTITY_TYPES` (`constants/linkable-entities.ts`) survived the removal, repurposed to back the new assignment modal's entity-type picker instead.
- **A pre-existing `SortableHeader` bug (`fieldSort` vs. `sortFields`) was found and fixed while building T6.** The per-column sort control was reading the wrong URL param name; unrelated to this spec's scope but blocking T6's sort-by-Zone test, so it was fixed in the same PR (commit `dc54dd2`).
