# SPEC-004: The world model — one tree of places

- **Status:** Draft — model agreed 2026-08-06, MVP scope agreed (§5.1); implementation not started
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

## 5.1 MVP scope

Agreed 2026-08-06. The full model above is the destination; this is the first shippable slice, and its defining property is that **it is purely additive — no column is dropped, no existing data is migrated, nothing that works today stops working.**

**The MVP is complete when** the DM can open an empty installation, upload the map of the planes, and build downward from it: adding regions that open their own maps, pinning deities and NPCs, and marking places of interest — navigating by clicking rather than by a map switcher.

### The four kinds, and what each requires

The DM's own list, and it replaces the current "always a category, optionally a link" shape. `kind` is the discriminator that decides what else the place carries:

| `kind`   | Carries a map | Links to a record | Category | Clicking it…            |
| -------- | ------------- | ----------------- | -------- | ----------------------- |
| `region` | **required**  | no                | no       | opens its map           |
| `deity`  | no            | **required**      | no       | opens the deity's sheet |
| `npc`    | no            | **required**      | no       | opens the NPC's sheet   |
| `poi`    | no            | no                | yes      | opens its detail panel  |

Plus the root, which is a `region` with no parent.

`region` is deliberately the **only** navigable kind in the MVP. The richer vocabulary of the full model — plane, city, dungeon — is the same thing with a more specific label, and adding those values later is purely additive: more entries in a closed set, no migration, no reshaping. Shipping one navigable kind first avoids asking the DM to classify every node correctly before the navigation itself has been proven.

This is a discriminated union, and the codebase already models one — `PageMeta` became a discriminated union on `fieldType` under TD-08. Same approach: the kind decides which fields are required, and the validator rejects the combinations that make no sense (a `deity` with a map, a `region` with no map, a `poi` with a link).

### What the MVP builds

1. **Upload the root map.** An empty installation offers exactly one action: name your world and upload its map. Storage and authenticated serving per [ADR-0008](../adr/0008-map-image-storage.md).
2. **Add a place, from the map.** The existing `MapPOIPanel` already has the type→entity cascading select that `deity` and `npc` need — [`fetchLinkableEntities`](../../app/lib/data/maps/fetchLinkableEntities.ts), built for SPEC-002. It gains the `kind` selector and, for `region`, a map upload. This is an extension of a working panel, not a new one.
3. **Navigate by clicking.** Clicking a `region` opens its map and renders that region's children. **The four-button map switcher in [`geography/page.tsx`](../../app/[locale]/dashboard/geography/page.tsx) is removed** — it is replaced by the tree itself. One "up" button returns to the parent; full breadcrumbs are explicitly not in the MVP.
4. **Pins render only on their parent's map** — the defect in §1, fixed as a consequence of the tree rather than as a separate patch.

### What the MVP deliberately leaves alone

- **`npc.location`, `deities.location`, `deities.residence` stay exactly as they are**, with their dropdowns and their data. The tree is built alongside them, and the DM populates it at their own pace. Deleting those columns (§6) happens only once the tree holds the real world and the DM has confirmed it — a separate, later, and far riskier step.
- **The 33 legacy places and the four existing maps are not migrated.** The MVP is exercised by building a world from nothing, which is the DM's own stated starting point. Migrating the existing world is its own task, informed by whatever the MVP teaches.
- **The `faction` table.** Unrelated to maps; it can ship before, after, or never alongside this.
- **The 14 POI categories**, kept as-is under `kind: "poi"` and re-themed later (see also TD-62, which notes their labels are hardcoded English).

**Why additive matters here.** The full model deletes three columns and rewrites what "where is this NPC" means. That is worth doing, and it is not worth doing before the navigation has been used against a real world. An MVP that only adds can be abandoned, rebuilt or reshaped without a down migration and without risking the DM's existing data.

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

`npc.location`, `deities.location`, `deities.residence` and `npc.faction` are the columns SPEC-003 proposed to turn into foreign keys. Under this model **the three place columns are deleted instead**: a record's place is derived by walking up from its pin, so a stored location column would be a second, divergent source of truth.

**`deities.location` and `deities.residence` turn out to be two tiers of this very hierarchy, stored as independent columns.** The seed makes it plain:

| Deity   | `residence` (plane) | `location` (place within it) |
| ------- | ------------------- | ---------------------------- |
| Helios  | Cieli               | Paradiso (Sole)              |
| Elune   | Cieli               | Elysium (Luna)               |
| Gork    | Inferi              | Inferno                      |
| Labasu  | Selva Oscura        | L'Abisso                     |
| Venerys | Selva Fatata        | Isola dei Druidi             |

Paradiso is _inside_ the Heavens; the Isle of Druids is _inside_ the Fae Wood. The pair is a parent and a child, and **nothing enforces that they agree** — `location: Paradiso` with `residence: Inferi` is accepted and displayed today without complaint, the same integrity gap SPEC-003 §1 found everywhere else. One pin at Paradiso yields both: the place directly, the plane by walking up.

`faction` is unaffected by the tree and does become a real table:

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
2. Create the universe root from the current `piani-esistenza.jpg`, then the seven `celestialPlanes` as planes beneath it, then the other three maps down the chain the file names already imply: material world (plane) → kingdom of Kang (region) → Skreebars (city). Their `bounds`/`initialView`/`initialZoom` move out of `page.tsx` into the rows. **The material world is itself one of the seven planes** (`Terra`), not a sibling of them — confirm which before seeding, since it decides whether the existing map attaches to a new row or an already-seeded one.
3. Seed the 33 places from `locationList` with null coordinates — every one starts unplaced. Parentage comes from two sources, in this order of trust:
   - **The deity rows themselves**, whose `residence`/`location` pairs are direct evidence of which plane contains which place (the table above): Paradiso and Elysium under the Heavens, Inferno under the Underworld, the Abyss under the Dark Wood, the Isle of Druids under the Fae Wood.
   - **`Location.ts`'s section comments** (`//Luoghi Divini`, `//Città`, `//Dungeon`) for the rest — but only as a first guess. They are demonstrably not reliable: the Isle of Druids sits under `//Città`, yet Venerys places it in the Fae Wood, not the material world. Every parent derived this way needs DM review before step 5 runs.
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
- [ ] A deity's sheet displays both its place and the plane containing it, both derived from one pin — Helios shows Paradiso, in the Heavens — with neither column stored. The contradictory pair that is representable today is no longer expressible.
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
3. ~~Does the deity's residence become a place reference too?~~ **Answered 2026-08-06: yes.** A plane of existence is a place — the second tier of the tree — so `deities.residence` is derived from the pin's ancestry exactly as `location` is, and the column is deleted with the others. The seven `celestialPlanes` become the first places seeded under the universe root, and the deity rows' `residence`/`location` pairs supply real parentage evidence for the migration (§6).
4. **What arranges the 33 legacy places into a tree, exactly?** Their `Location.ts` sections give a first parent guess, but "Isola dei Druidi" or "Monte An-ki" being cities under the material world is an assumption. The DM should review the proposed tree before step 3 runs.
5. ~~Should an NPC be placeable in more than one place over time?~~ **Answered 2026-08-06: no — one pin per record.** A travelling NPC is moved by the DM by hand, which is an edit to the existing pin, not a second one. The link stays one-to-one, and `@@unique([linkedType, linkedId])` enforces it (§6).

## 10. Task breakdown

### MVP (§5.1) — purely additive, nothing dropped

- [x] **M1** — `MapImageStore` + upload endpoint + authenticated serving route, per [ADR-0008](../adr/0008-map-image-storage.md) _(test: an image round-trips; an unauthenticated fetch is refused; oversized and wrong-type uploads are rejected)_
- [x] **M2** — `poi` gains `kind`, `parentId` and the map columns. Existing rows keep working, their `category` intact under `kind: "poi"` _(test: migration applies; every existing POI still reads back unchanged)_
- [x] **M3** — Kind-aware validation: the discriminated union of §5.1's table _(test: a `deity` with a map, a `region` without one, and a `poi` with a link are each rejected with a field error)_
- [x] **M4** — Create-your-world flow on an empty installation _(test: an empty DB offers it and nothing else; a second root is refused)_
- [x] **M6** — Pins render only on their parent's map _(test: two parents, two maps, each showing only its own children)_
- [x] **M7** — Click a `region` to descend, one button to ascend; the four-button switcher is removed. Covered at the component level (`GeographyExplorer.test.tsx`'s "descends two levels and returns" case with mocked data), not by a real Playwright e2e spec — a genuine e2e test needs a nested `region` to click, and nothing can create one without M5's kind selector. Worth adding once M5 ships.
- [x] **M5** — `MapPOIPanel` gains the kind selector and, for `region`, the map upload. The existing type→entity select is reused for `deity`/`npc` _(test: each kind saves and reloads with the right shape)_

**Build order deviates from the numbering as of 2026-08-06.** M5 assumes a "current place" to attach a new non-root pin's `parentId` to, but nothing tracks that until M6 (parent-scoped rendering) and M7 (click-to-descend navigation) exist — before M7, `geography/page.tsx` still uses the hardcoded four-map switcher, with no notion of "which tree node is this map" at all. Discovered while scoping M5: `MapPOIPanel`'s entire data model (client `POI` type, marker colors, GeoJSON import/export, `usePOIManager`'s optimistic state) also assumes every place has a `category`, which a `region`/`deity`/`npc` kind does not — non-trivial to thread through, not a dropdown-sized addition. M6 and M7 build first, giving M5 a real parent to attach to and a smaller, better-understood blast radius by the time it lands.

### Beyond the MVP — the destructive half, only once the tree is trusted

- [x] **T1** — `faction` table + seed + FK on `npc.fazione` _(independent of everything above)_. Scoped to schema/data only, per §7: `npcMeta`'s faction field keeps reading `factions.ts`'s static list unchanged — the async-options problem stays unsolved, exactly as §7/§9 say it should for this item. `npc.faction` (the scalar column) is untouched; `factionRef` is a new, additive relation field nothing reads yet.
- [x] **T2** — The richer kind vocabulary: `plane`, `city`, `dungeon` join `region` as navigable kinds, each carrying its own map. One shared `navigableSchema` in `placeSchema.ts` (discriminated on `z.enum(NAVIGABLE_PLACE_KINDS)`) replaces the old `region`-only branch; `NAVIGABLE_PLACE_KINDS`/`isNavigablePlaceKind` in `constants/place-kinds.ts` replace every `kind === "region"` check (`createPlace.ts`, `useNavigableChildren.ts`, `MapPOIPanel.tsx`). No migration — `kind` is already `String`, closed only in code. Root creation (`createRootPlace.ts`) stays `region`-only by design, unaffected.
- [ ] **T3** — Migrate the four existing maps and the 33 legacy places into the tree, DM-reviewed against the parentage evidence in §6
- [ ] **T4** — NPC/deity pins for existing records; derive and display location from the tree
- [ ] **T5** — Drop `npc.luogo`, `deities.luogo`, `deities.residenza`; remove `locationList`, `celestialPlanes` and their catalogue keys _(the point of no easy return — write the down migration first)_
- [ ] **T6** — Docs: ADR for the tree model, `ARCHITECTURE.md`, close the ROADMAP items

## 11. Outcome

_Fill in at close._
