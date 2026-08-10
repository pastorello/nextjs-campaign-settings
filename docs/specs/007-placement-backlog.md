# SPEC-007: The world is described but not drawn

- **Status:** Agreed 2026-08-10 — third draft. The first two aimed at the wrong problem; §0 says how, because the reason matters more than the correction.
- **Date:** 2026-08-08, rewritten twice on 2026-08-10
- **Phase:** 3
- **Related:** completes the half of [SPEC-004](./004-world-model.md) M4 that only ever ran once (a place gets its map at creation and never again); consumes [SPEC-005](./005-place-repositioning.md)'s repositioning flow and TD-71's `useUnplacedChildren`; hands the area-selection half to [SPEC-009](./009-zones-as-areas.md)

---

## 0. Why this spec was wrong twice

Worth recording, because both mistakes were the same mistake and neither was visible from the prose.

**The 2026-08-08 draft** asked how to find records with no pin and spent its §7 on a design question — teach the metadata layer a derived predicate, or resolve an id list — because "unplaced" was not a column. SPEC-008 landed the same week and made it one (`npc.zoneId`), shipped the filter that uses it (`LocationFilterControl`'s "Sconosciuta", T6) **and** the per-row placement button (`AssignLocationButton`, T5). The question was withdrawn, not answered.

**The first 2026-08-10 rewrite** then aimed at the entities: a count of NPCs and deities with no zone. **That backlog is empty.** Checked against the live database the same afternoon: 119 of 119 NPCs and 5 of 5 deities have a `zoneId`. The badge would have read zero on every page it was added to.

**What the database actually says** — the numbers that should have been read first, before either draft:

| Table             | Rows | Positioned | With a map of their own |
| ----------------- | ---- | ---------- | ----------------------- |
| `zone` (places)   | 42   | **0**      | 4                       |
| `poi` (landmarks) | 0    | —          | —                       |
| `npc` + `deities` | 124  | 124        | —                       |

**The world is fully described and entirely undrawn.** Forty-two places exist in a correct parent/child tree, and not one has ever been given coordinates on its parent's map. The entities all point at zones; the zones point nowhere.

> **The habit this should install.** Two drafts in a row reasoned from a spec's description of the data instead of the data. Both were wrong within the week. **Read the schema and count the rows before planning against a spec that has been sitting in Draft** — five minutes of `psql` would have caught both.

## 1. Problem

Three things stand between the tree as it exists and a world the DM can actually navigate.

**1. Four branches cannot be drawn at all.** Positioning a child requires its parent to have a map. Of the seven places that have children, **four have no map**: _Cieli_ (2 children, 5 NPCs beneath it), _Selva Fatata_ (1 child, 4 NPCs), _Selva Oscura_ (1 child), _Inferi_ (1 child). And **a place's map can only be set when the place is created** — `createRootPlace` and `createPlace` accept `mapImage`, and no code path ever updates it. There is no `updateZoneMap`; the only place mutation that exists is `updateZonePosition`, which writes `lat`/`lng`.

Recreating those four is not an escape route: **the app has no way to delete a place.** `deletePoi` deletes landmarks, not zones, and `onDelete: Restrict` would in any case require moving nine NPCs and deleting five children first.

**2. Nothing says how much is unplaced.** `useUnplacedChildren` (TD-71) lists the unplaced children _of the place currently in view_, inside `MapPOIPanel`. With every one of 42 places unplaced, the DM has no way to see the size of the job, or which branch to start with, without walking the tree by hand.

**3. The placement flow for entities is invisible.** Verified separately, and kept in scope because it is small and was found the same day:

- On the consultation card, an unplaced record renders `props.placement?.place ?? ""` — an empty region where every other record shows a place name, indistinguishable from a rendering failure, with nothing to click.
- The admin row's entry point is labelled **"Posizione"** — a noun, between "Modifica" and "Elimina", which are verbs. Asked directly whether they could assign a location from a row, the DM's answer was _"non lo sapevo."_

This third strand affects zero records today and every record created from tomorrow: an NPC made through the form has no zone, and nothing about the UI would say so.

### Two backlogs, not one

Stated by the DM on 2026-08-10 and worth being precise about, because this spec's first two drafts confused them:

- **A place without coordinates** is a place that exists, belongs to its parent, and has never been drawn on the parent's map. Forty-two of forty-two today.
- **An entity without a place** is an NPC or deity whose `zoneId` is null. Zero today.

**An entity inside an unpositioned place is not in either backlog.** It has a place; that place simply is not drawn yet. An NPC belongs to a _location_, never to coordinates — so a place losing its position does not detach anything from it. Only deleting the place itself leaves an entity with nowhere to be.

The two counts are therefore separate numbers answering separate questions, and neither substitutes for the other.

**Both backlogs will grow, and that is the argument for building the counts now rather than when they hurt.** [SPEC-010](./010-deleting-a-place.md) sends a deleted place's children — and its landmarks, once their coordinates become nullable — into the first backlog, and its entities into the second. The DM's plan to rebuild the tree from scratch will therefore fill both at once. A count that reads zero today is the instrument that makes that day survivable.

## 2. Goal

Every place in the tree can be given a map and a position, the DM can see how much of the world is still undrawn, and a record that has no place says so where they will see it.

## 3. Non-goals

- **Zones as areas.** Drawing a zone as a rectangle rather than a pin is [SPEC-009](./009-zones-as-areas.md). This spec positions places with the mechanism that exists — a point — and does not pre-empt that decision.
- **Deleting places.** A real gap (there is no way to remove a place, ever) but a separate one, with its own `onDelete: Restrict` consequences to think through. Filed as a ROADMAP item, not smuggled in here.
- **Bulk or automatic placement.** No "scatter the unplaced children across the parent map". Where a place sits is the DM's decision and the whole point of drawing it.
- **A new placement mechanism.** SPEC-005 already positions a place by dragging it onto its parent's map, and `AssignLocationModal` already assigns an entity. This spec adds a map where one is missing, a count, and an entry point — it does not touch either flow.
- **Editing a map's bounds, initial view or zoom.** Those columns exist and default sensibly. Re-cropping a map is a separate need nobody has yet expressed.
- **No notification or nag.** A number on a page the DM already opens.

## 4. User stories

- As a DM, I want to **give a map to a place I already created**, so a branch I set up before I had the artwork is not permanently undrawable.
- As a DM, I want to **replace a map** with a better version later, without recreating the place and everything under it.
- As a DM, I want to **see how many places are still unpositioned**, so I know how much of my world is drawn.
- As a DM, I want an unplaced record to **say it is unplaced**, so I do not read a blank space as a bug.
- As a DM, I want to **place a record from wherever I noticed it was missing**.

## 5. Behaviour

**Giving a place a map**

1. Viewing a place, the DM can upload a map for it — the same upload the create-world flow uses.
2. A place that had no map becomes navigable: its children can now be positioned on it, and clicking it descends into it.
3. Uploading over an existing map replaces it. Children keep their coordinates.
4. **Removing a map without replacing it is allowed, and destroys nothing.** The place renders as empty ground with the upload control on it, and its children keep their coordinates — invisible, not lost. Uploading any new map brings them all back exactly where they were. This is the DM's own description of what removing an image should mean, and it is the reason removal is not a destructive action: coordinates belong to the child, not to the image.

**Seeing the backlog**

1. The geography view reports how many places have no position, across the whole tree — not only under the place in view.
2. From that report the DM reaches a place's parent, where SPEC-005's existing flow positions it.

**Entities**

1. The admin row's button reads **"Posiziona"** (EN: "Place").
2. An unplaced record's card shows **"Sconosciuta"** rather than nothing, and clicking it opens the assignment modal.

**Edge cases**

| Situation                                              | Expected behaviour                                                                                                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Replacing the map of a place whose children are placed | Children keep their `lat`/`lng`. **They will be in the wrong spot if the new map is not aligned with the old one** — say so before replacing rather than after.  |
| Uploading a map to a leaf place                        | Allowed. A place with a map becomes navigable whether or not it has children yet — that is how you build downward.                                               |
| Replacing a map while a child is being repositioned    | The reposition targets an id, not a map, so it still writes. The DM sees the new map on the next render.                                                         |
| Every place is positioned                              | The count reads zero and stays visible. Its absence would be ambiguous.                                                                                          |
| Empty installation, no root                            | The existing "create your world" flow answers; the count is not rendered because there is no tree to count.                                                      |
| The root itself                                        | Has no parent, so it is never "unpositioned". It has a map by construction (M4 requires one). It is excluded from the count, not counted as placed.              |
| A place whose parent has no map                        | Counted as unpositioned, and the report says the parent needs a map first — that is the actionable instruction, not "position me".                               |
| An upload that fails midway                            | No `mapImage` is written. The place keeps whatever it had, including nothing. The existing create-world flow already handles this shape (`errors.uploadFailed`). |

## 6. Data model changes

**None.** `zone.mapImage`, `mapBounds`, `mapInitialView` and `mapInitialZoom` all exist and are nullable — SPEC-004 M1/M4 put them there. What is missing is a mutation that writes `mapImage` on a row that already exists, not a column to write it to.

That is worth stating plainly because it is the whole shape of this spec: **nothing here is a schema problem.** The world is undrawable because one server action was never written.

## 7. Implementation notes

**`updateZoneMap` is the whole of task 1.** `POST /api/maps/upload` is already generic — `CreateWorldForm` posts to it and hands the returned id to `createRootPlace`. Attaching that id to an existing row is a guarded, validated `prisma.zone.update({ data: { mapImage } })`, and it needs neither bounds nor an initial view: `createRootPlace` does not set them either, and `parsePlaceMapBounds`/`parsePlaceMapInitialView`/`parsePlaceMapInitialZoom` supply defaults for null.

**The count is a tree-wide read, not a per-parent one.** `useUnplacedChildren` answers "which children of _this_ place lack coordinates" and stays as it is. The new count is `prisma.zone.count({ where: { lat: null, parentId: { not: null } } })` — every place except the root. One query, on a table of 42 rows.

**The entity-side fixes reuse what exists.** `AssignLocationButton` gains a text-trigger shape for card use — a prop or a thin wrapper on the same component, not a second implementation. The failure mode this project has paid for twice (TD-09's quartets, the metadata layer's near-forks) is two things doing one job and drifting.

**Two reads of an entity's location will need reconciling.** `EntityLibrary` uses `fetchDerivedAncestry` → `toDerivedPlacements`; `EntityList` uses `fetchEntityLocationSummaries`. Only the second carries the `zoneId`/`poiId` the modal needs. Either the card reads summaries too, or `toDerivedPlacements` starts carrying the ids — **do not add a third read.**

## 8. Acceptance criteria

- [ ] A place with no map can be given one, and becomes navigable without recreating it.
- [ ] A place with a map can have it replaced, and its children keep their coordinates.
- [ ] Replacing a map warns that already-positioned children may no longer line up.
- [ ] The upload is rejected for an unauthenticated request and the payload is validated, like every other mutation.
- [ ] The geography view reports how many places across the whole tree have no position, and the root is excluded rather than counted.
- [ ] A place whose parent has no map is reported as needing the parent's map first.
- [ ] The admin row button reads "Posiziona" / "Place" — both catalogues, TD-21's key-set check green.
- [ ] An unplaced record's card shows "Sconosciuta" rather than an empty node, and clicking it opens the assignment modal.
- [ ] The card and the admin list read a record's location through one path, not two that can diverge.
- [ ] Coverage has not dropped.

## 9. Implementation plan

**Files touched, in order**

| #   | File                                                | Change                                                                   |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | `app/lib/data/maps/updateZoneMap.ts`                | new — guarded, validated write of `mapImage` on an existing zone         |
| 2   | `app/ui/geography/` (a map-upload control)          | reuses `POST /api/maps/upload`, then calls the above; confirm on replace |
| 3   | `app/lib/data/maps/countUnpositionedPlaces.ts`      | new — `lat: null, parentId: { not: null }`                               |
| 4   | `app/ui/geography/GeographyExplorer.tsx`            | render the count beside the title                                        |
| 5   | `messages/{it,en}.json`                             | `common.table.assignLocation` → "Posiziona" / "Place", plus the new copy |
| 6   | `app/ui/buttons/AssignLocationButton.tsx`           | a text-trigger variant, same modal, same action                          |
| 7   | `EntityLibrary.tsx`, `NpcCard.tsx`, `DeityCard.tsx` | "Sconosciuta" instead of `""`, wired to the trigger; reconcile the reads |

**Risks**

- **Replacing a map silently misaligns children.** The coordinates are stored against the map's bounds, not against the image, so a differently-framed replacement moves every child relative to the terrain without changing a single number. The confirmation in task 1 is the mitigation, and it is the reason replace is a distinct action from upload rather than the same button behaving differently.
- **`SPEC-009` may change what a position is.** If a zone becomes a rectangle, `lat`/`lng` stops being the whole answer and `countUnpositionedPlaces` has to follow. Written as one small function for exactly that reason — keep the predicate in one place.
- **Renaming a label touches the e2e specs.** TD-35 made them read the catalogue rather than hardcode Italian copy, so they should follow automatically — verify rather than assume.
- **Scope creep into a placement workflow.** §3 is the guard. A queue, bulk actions or a wizard means stop and re-scope.

## 10. Task breakdown

- [ ] **T1** — `updateZoneMap` and the upload control: give a place a map, or replace one _(test: unauthenticated is rejected; a mapless place becomes navigable; children keep their coordinates across a replace; a failed upload writes nothing)_
- [ ] **T2** — `countUnpositionedPlaces` and the report in the geography view _(test: 42 of 42 today; the root is excluded; a place under a mapless parent is reported as blocked on the parent, not on itself; zero renders rather than hiding)_
- [ ] **T3** — Entity-side visibility: rename the row button, "Sconosciuta" on the cards, one read path for location _(test: TD-21's key-set check green; an unplaced record's card shows the word and opens the modal; card and list agree)_

## 11. Outcome

_Fill in at close._
