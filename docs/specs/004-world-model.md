# SPEC-004: The world model — one tree of places

- **Status:** Draft — not agreed
- **Date:** 2026-08-06
- **Phase:** 3
- **Related:** supersedes the plan in [SPEC-003](./003-real-relations.md) (its analysis stands); builds on [SPEC-002](./002-map-poi-persistence.md)'s `poi` table and polymorphic entity link; `ROADMAP.md` Phase 3 items "Real relations", "Locations as first-class entities" and "Multi-campaign support"; TD-61 (validators, ships independently)

---

## 1. Problem

**This app is a tool for one specific campaign, and the campaign is written into the source code.**

- The 33 places of the setting are a TypeScript enum, [`Location.ts`](../../app/lib/definitions/enums/geography/Location.ts).
- The 21 factions are another, [`Faction.ts`](../../app/lib/definitions/enums/npc/Faction.ts).
- The four maps are an array literal in [`geography/page.tsx`](../../app/[locale]/dashboard/geography/page.tsx), pointing at four files committed to `public/maps/`. The DM has roughly sixty more maps in Inkarnate with nowhere to put them.

Adding a place, a faction or a map means editing source and redeploying. The DM cannot build a world; they can only use the one that was compiled in.

**The hierarchy the DM actually thinks in already exists in the codebase — twice — and neither copy is readable by the program.**

The four maps _are_ the tiers, in order, as a flat dropdown with no relationship between them:

```
piani-esistenza.jpg → mondo-materiale.jpg → regno-di-kang.jpg → skreebars.jpg
     (universe)            (plane)              (region)          (city)
```

Clicking the material world on the universe map does nothing. And in `Location.ts` the type of each place is recorded **as comments** — `//Luoghi Divini` (9), `//Luoghi Fatati` (2), `//Città` (20), `//Dungeon` (2) — because the flat option list had nowhere to put it.

**A concrete defect that follows from the model, not from a coding mistake.** `poi` has no column identifying which map a pin belongs to, and `fetchPois` reads `prisma.poi.findMany({ orderBy: { createdAt: "asc" } })` with no filter. **Every POI therefore renders on every map.** Pin a tavern in Skreebars, switch to the universe map, and the tavern is still there at the same coordinates. Maps-as-a-hierarchy is not an enhancement on top of the current data model; it is the piece the current data model is missing.

## 2. Goal

A DM starts with an empty installation and builds their universe from nothing — uploading maps, placing planes, regions, cities and dungeons inside one another, authoring factions, and placing NPCs and deities in the world — with no source edit and no redeploy.

## 3. Non-goals

- **Campaigns and adventures.** A campaign is a _story that takes place inside_ the universe, and the concept does not exist yet in any form. What exists today are the raw materials — spells, magic items, NPCs, deities, the map. Plot, sessions and encounters come later and are not modelled here. **This also corrects `ROADMAP.md`'s "Multi-campaign support" entry**, which assumed a campaign was a scoping boundary around every entity; it is not, and no `campaignId` is added by this spec.
- **More than one universe.** Each DM authors exactly one, and it is the mandatory root of everything. Multi-tenant hosting stays explicitly rejected (`ROADMAP.md`, "Explicitly not planned").
- **Regions as drawn areas.** A region is a pin like any other navigable place in this spec. Selecting a rectangle or polygon on the parent map and attaching the zoomed map to _that shape_ is a later, additive feature — the model must not preclude it (§6), but no geometry beyond a point ships here.
- **Re-theming the POI categories.** The 14 current ones are generic (`food-drink`, `transport`, `religion`) but map onto the setting well enough for now — an inn, a boat in Skreebars' harbour, the Temple of Helios. They are kept as-is and renamed in a later pass.
- **Combat grids.** A dungeon is a place with a map like any other. The playable miniature grid is Phase 4 (`001-combat-tracker.md`).
- **Deleting the legacy option lists in this spec.** `locationList` and `factions` stay in the codebase until their data has been migrated and verified; removal is the last task, not the first.

## 4. User stories

The DM's own walkthrough, from an empty installation:

1. As a DM starting with nothing — no map, no NPC, no pin — I want to upload the map of my universe, which is the mandatory root of everything.
2. As a DM, I want to drop a pin on the universe map, mark it as a **plane of existence**, and give it its own map, so that clicking it takes me inside.
3. As a DM, I want to place a deity in that plane — Helios resides at a place called Paradiso on the map of the planes.
4. As a DM, I want to add either a **city** directly, or a **region** (a zoom on a specific zone) and then a city inside it.
5. As a DM, I want to create an NPC and place them in that city — Dexter Nemrod is a pin on the Skreebars map.
6. As a DM, I want to create a **faction** by hand and assign the NPC to it.
7. As a DM, I want a place like the "Taverna del Gallo Robin" — an inn inside Skreebars — to be able to **contain** Dexter, so that a place holds its people.

## 5. Behaviour

**Main flow — building downward**

1. An empty installation shows one prompt: create the universe. Name plus a map image. Nothing else in the app is reachable until it exists.
2. On any map, right-click → add a place. The place gets a name and a **kind**. Navigable kinds (plane, region, city, dungeon) offer a map upload; leaf kinds (inn, temple, shop, …) do not.
3. A place that has a map is navigable: clicking its pin opens that map, and the pins of its children render there. Breadcrumbs show the path back to the universe.
4. A place with no map is a leaf: clicking it opens its detail panel, which lists what it contains.
5. NPCs and deities are placed by pinning them — either directly on a map, or inside a leaf place such as the tavern.
6. **A record's location is derived, never typed.** Dexter's sheet shows "Skreebars" because his pin sits on the Skreebars map; if he is inside the tavern, it shows the tavern, and Skreebars above it. There is no location dropdown to keep in sync.

**Edge cases**

| Situation                                         | Expected behaviour                                                                                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty installation                                | Only the "create your universe" flow is offered. Spells, items, NPCs and deities remain usable as raw materials — they do not require a world to exist.                                 |
| Attempt to create a second universe               | Rejected: exactly one root. Enforced at the Zod boundary and by a partial unique index on `kind = 'universe'`.                                                                          |
| Delete a place that contains others               | Blocked while it has children, the same way SPEC-003 argued for `onDelete: Restrict`. Deleting Skreebars must not silently orphan its taverns and NPCs.                                 |
| Place whose parent has no map                     | Carries no coordinates. Dexter inside the tavern is _contained_, not positioned — `lat`/`lng` are null, and that is a valid state, not missing data.                                    |
| Unplaced place (migrated, never positioned)       | Valid and expected: it has a parent but no coordinates. Rendered in a "not yet placed" list beside the map so the DM can drag it on. This is the state all 33 migrated places start in. |
| Navigable place with no map uploaded yet          | Allowed. It is a container with no canvas: children can be attached to it but have no coordinates until a map exists.                                                                   |
| A place's map is replaced with a different image  | Children keep their coordinates. Bounds may differ, so the DM is warned that pins may need repositioning — the app does not attempt to rescale them.                                    |
| Linked NPC or deity is deleted                    | Unchanged from SPEC-002: no DB cascade, the pin resolves to unlinked rather than throwing.                                                                                              |
| Two places at the same coordinates                | Allowed. Pins overlap; no uniqueness constraint.                                                                                                                                        |
| Very deep nesting                                 | No enforced depth limit, but the tree must be read with a bounded query (§9) rather than by recursing per level, or a deep world costs one round trip per tier.                         |
| Cycle in the tree (a place made its own ancestor) | Rejected at the mutation boundary — reparenting validates that the new parent is not a descendant. Postgres will not catch this; a self-referencing FK permits cycles.                  |

## 6. Data model changes

### One tree, not two concepts

Everything pinned in the world is the same kind of thing: a **node with a parent, optionally a position, and optionally a map of its own**. A universe, a plane, a city, a tavern and an NPC's marker differ only in their `kind`, whether they carry a map, and whether they link to a domain record.

This extends SPEC-002's `poi` table rather than introducing a rival concept — `lat`/`lng` and the polymorphic `linkedType`/`linkedId` are already there and already correct.

```prisma
model poi {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  kind        String   // universe | plane | region | city | dungeon | inn | temple | …

  // Containment. Null only for the single universe root.
  parentId    Int?
  parent      poi?     @relation("PoiTree", fields: [parentId], references: [id], onDelete: Restrict)
  children    poi[]    @relation("PoiTree")

  // Position on the parent's map. Null when the parent carries no map
  // (contained, not positioned) or when not yet placed.
  lat         Float?
  lng         Float?

  // Its own map. Null for leaf places.
  mapImage       String?
  mapBounds      Json?
  mapInitialView Json?
  mapInitialZoom Int?

  // Unchanged from SPEC-002.
  linkedType  String?
  linkedId    Int?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([parentId])
  @@unique([linkedType, linkedId])   // one pin per NPC or deity — see §9 q5
}
```

**`category` becomes `kind`.** The 14 existing category ids survive unchanged as leaf kinds; the structural kinds (`universe`, `plane`, `region`, `city`, `dungeon`) are added alongside them. One field, because a city is not a category-plus-a-type — it is a kind of place.

### The `kind` set is closed

`kind` is **a validated string against a fixed set declared in code — not a table, and not user-extensible.** Decided 2026-08-06: place types must not proliferate into custom values. This is exactly the "closed vocabulary" class SPEC-003 §6 identified, and it inherits TD-61's membership validator rather than inventing its own check.

The shape already exists in this module and is followed rather than replaced — `POICategory` is a string union and `POI_CATEGORIES` an array of configs (`id`, `name`, `color`, `bgColor`, `icon`). `PlaceKind` extends that pattern with the one property the tree needs:

```ts
{ id: "city",   navigable: true,  … }   // may carry a map; clicking enters it
{ id: "inn",    navigable: false, … }   // leaf; clicking opens its panel
```

**`navigable` belongs in the kind declaration, not in a column.** A boolean column beside `kind` could contradict it — a row claiming `kind: "city", navigable: false` has no meaning, and nothing would reject it. Deriving it from the kind makes that state unrepresentable. Whether a place _has_ a map is a separate, genuine question (`mapImage` null or not): a city with no map uploaded yet is navigable in principle and empty in practice.

**One consequence worth stating:** a closed set means adding a place type is a code change and a deploy, in a tool whose whole point is that the DM authors their world without one. That is accepted deliberately — the set describes the _structure_ of a world, which is the app's model, while the DM authors the _contents_. If that line ever chafes, the escape hatch is a `kind` table, and the interface above is what makes swapping to it cheap.

**`title` becomes `name`,** matching every other entity in the schema.

**Why the region stays a point.** `lat`/`lng` position a place on its parent's map. Attaching a zoomed map to a _shape_ later means adding a nullable `bounds Json?` and treating a place with bounds as an area — additive, no rewrite of existing rows, which is the constraint §3 imposes on this design.

**`@@unique([linkedType, linkedId])` relies on Postgres treating NULLs as distinct,** which it does by default: every unlinked place carries `(null, null)` and none of them collide, while `("npc", 7)` can exist only once. The constraint costs nothing for the many places that link to nothing, and it makes a second pin for the same NPC impossible rather than merely discouraged. It also supplies the index that lookups by link would otherwise need.

**Coordinates are nullable, deliberately, and mean two different things.** Null because the parent has no map (contained), or null because nobody has placed it yet (migrated). Both are legitimate; the UI distinguishes them by looking at the parent, not by a flag.

### What this removes

`npc.location`, `deities.location` and `npc.faction` are the columns SPEC-003 proposed to turn into foreign keys. Under this model **the two `location` columns are deleted instead**: a record's place is derived by walking up from its pin, so a stored location column would be a second, divergent source of truth. `faction` is unaffected by the tree and does become a real table:

```prisma
model faction {
  id   Int    @id @default(autoincrement())
  name String
  npc  npc[]
}
```

### Migration strategy

The DM's world must survive. 119 NPCs reference locations today.

1. Create the `faction` table, seeded from `factions.ts` preserving its ids (including the gaps at 9 and 20, per SPEC-003 §6's reasoning — no row is rewritten). Add the FK on `npc.fazione`.
2. Create the universe root from the current `piani-esistenza.jpg`, and the other three maps as its descendants, reproducing the chain the file names already imply: universe → material world (plane) → kingdom of Kang (region) → Skreebars (city). Their `bounds`/`initialView`/`initialZoom` move out of `page.tsx` into the rows.
3. Seed the 33 places from `locationList`, **parented by the section they sit in inside `Location.ts`** — `//Luoghi Divini` under the universe, `//Città` and `//Dungeon` under the material world — with null coordinates. Every one starts unplaced.
4. For each NPC and deity, create a pin (`linkedType`/`linkedId`) whose parent is the place their `location` column names, with null coordinates.
5. Only then drop `npc.luogo` and `deities.luogo`.

- **Backfill needed?** Yes, and it is the bulk of the work — steps 2–4 are a data migration, not a schema change.
- **Reversible?** Up to step 5, entirely. After step 5 the location columns are gone and reversal means recomputing them from the tree — possible, but write the down migration before shipping step 5, not after.

## 7. Metadata changes

The `location` field is removed from `npcMeta` and from the deity page's field list, along with its `locationList` options and its `npc.locations.*` catalogue keys. Because `pageMetaFields` is a flat registry keyed by field name (SPEC-003 §1), that single removal affects both domains at once — there is no per-domain variant to miss.

`faction` keeps its `PageMeta` entry but its options become database rows, which is the async-options problem SPEC-003 §7 raised and did not solve. It is unchanged here and remains the main unresolved design question (§9).

Places themselves are **deliberately kept outside the metadata layer**, exactly as SPEC-002 argued for POIs: a place is a map annotation edited from a panel, not a browsable catalogue with filters and list columns. It does not belong in `pagesConfig`.

## 8. Acceptance criteria

- [ ] A fresh installation with an empty database offers the create-universe flow, and refuses to create a second universe.
- [ ] A place with a map is navigable: clicking its pin opens that map and renders its children's pins.
- [ ] **A pin appears only on its parent's map** — the defect in §1 is gone, verified by a test that creates pins under two different parents and asserts each map shows only its own.
- [ ] A place with no map can contain other places, including NPC pins, and those have null coordinates.
- [ ] An NPC's sheet displays its location derived from the tree, with no location field stored on the NPC.
- [ ] A faction can be created, renamed and assigned to an NPC without a source edit.
- [ ] All 33 legacy places exist after migration, parented per their `Location.ts` section, listed as unplaced, and every NPC and deity still resolves to the place it referenced before.
- [ ] Deleting a place with children is refused; deleting a linked NPC leaves the pin unlinked rather than broken.
- [ ] A second pin for an NPC or deity that already has one is rejected; moving one is an edit to the existing pin. Many unlinked places coexist without tripping the constraint.
- [ ] A place's `kind` outside the declared set is rejected at the Zod boundary; a leaf kind cannot be given a map.
- [ ] Reparenting a place under its own descendant is rejected.
- [ ] Every new mutation rejects an unauthenticated request and validates input with a Zod schema.
- [ ] Reading a map's children costs one query regardless of tree depth.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Not filled in — the open questions below block it._

**Risks**

- **This is much larger than SPEC-003, and it deletes columns.** Steps 2–4 of the migration encode the DM's own knowledge of their world; a wrong parent guess is not a crash, it is a world that comes back subtly wrong. Step 5 must not run until the DM has confirmed the migrated tree looks right — it is the point of no easy return.
- **Image upload is now a dependency, not a Phase 5 nicety.** Sixty maps cannot live in `public/maps`. Storage and access are settled by [ADR-0008](../adr/0008-map-image-storage.md); what remains is the upload endpoint itself, which needs a size limit, a content-type allowlist and app-generated filenames — a new attack surface in an app that has not had one before.
- **The async-options problem is inherited from SPEC-003 §7 and still unsolved** for `faction`.
- The tree must be read with a recursive CTE or a materialized path; a naive per-level query makes a deep world slow in a way that only shows up once the DM has built one.

**Open questions**

1. ~~Where do uploaded map images live?~~ **Answered by [ADR-0008](../adr/0008-map-image-storage.md) (2026-08-06):** the local filesystem under `UPLOAD_DIR`, served through an authenticated route handler rather than from `public/`, behind a `MapImageStore` interface so object storage remains a one-file swap. That ADR also records that the four existing maps are currently served **unauthenticated** — `proxy.ts` excludes `.jpg` from the auth gate per TD-36 — and closes that exposure by moving them out of `public/`.
2. ~~`kind`: a database enum, a validated string, or a table?~~ **Answered 2026-08-06: a validated string, and a deliberately closed set.** Not a table — the DM does not want place types proliferating into custom values. See §6, "The `kind` set is closed".
3. **Does the deity's residence (`celestialPlanes`, 7 values) become a place reference too?** SPEC-003 classed it as vocabulary pending this model. Under this model a plane of existence _is_ a place, so `deities.residence` looks like the same derived-from-the-tree treatment as `location`. Confirm before migrating.
4. **What arranges the 33 legacy places into a tree, exactly?** Their `Location.ts` sections give a first parent guess, but "Isola dei Druidi" or "Monte An-ki" being cities under the material world is an assumption. The DM should review the proposed tree before step 3 runs.
5. ~~Should an NPC be placeable in more than one place over time?~~ **Answered 2026-08-06: no — one pin per record.** A travelling NPC is moved by the DM by hand, which is an edit to the existing pin, not a second one. The link stays one-to-one, and `@@unique([linkedType, linkedId])` enforces it (§6).

## 10. Task breakdown

_Provisional — depends on the open questions above._

- [ ] **T0** — Agree the model _(image storage resolved: [ADR-0008](../adr/0008-map-image-storage.md))_
- [ ] **T1** — `faction` table + seed + FK on `npc.fazione`, no tree yet _(test: migration preserves every NPC's faction; a faction can be created and assigned)_
- [ ] **T2** — Extend `poi` into the tree: `kind`, `parentId`, map columns; `category` → `kind`, `title` → `name` _(test: migration applies; existing POIs survive with their category as kind)_
- [ ] **T3** — Pins render only on their parent's map; navigation into a child map; breadcrumbs _(test: the §8 two-parent case; e2e for click-through)_
- [ ] **T4** — Create-universe flow and map upload _(test: empty DB offers it; a second universe is refused)_
- [ ] **T5** — Migrate the four maps and the 33 places into the tree, DM-reviewed _(test: every legacy place exists with its expected parent)_
- [ ] **T6** — NPC/deity pins; derive and display location from the tree _(test: an NPC's sheet shows the right place; a contained NPC shows its container)_
- [ ] **T7** — Drop `npc.luogo` / `deities.luogo`; remove `locationList` and its catalogue keys _(test: TD-21 key-set check green; no import of the deleted files remains)_
- [ ] **T8** — Docs: ADR for the tree model, `ARCHITECTURE.md`, close the ROADMAP items, correct the multi-campaign entry

## 11. Outcome

_Fill in at close._
