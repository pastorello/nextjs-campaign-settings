# SPEC-016: The place popover

- **Status:** Draft
- **Date:** 2026-08-20
- **Phase:** 4
- **Related:** TD-93 (placement invariant — sequenced **after** this spec ships), TD-85 (remainder: POI edit/delete reachability), TD-96 (remainder: the "Collega un personaggio esistente" menu entry), SPEC-005 (repositioning — unaffected), SPEC-008 (entity location reference — the attach modal and the two presence cases), SPEC-010 (deleting a place — the deletion semantics this popover must reuse, not reinvent), [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md)

---

## 1. Problem

Four DM reports, recorded in `ROADMAP.md` on 2026-08-18, are one missing surface:

- **There is no way to see what lives at a place.** An NPC attached directly to a zone has no marker of its own (SPEC-008 §5); the only record of its presence is a field on the NPC's admin page.
- **Attaching an entity happens from the wrong place.** The right-click menu's "Collega un personaggio esistente" asks the DM to attach an entity to a location whose contents they cannot see (TD-96).
- **Un-placing does not exist.** A positioned place can be deleted or dragged elsewhere, but not returned to the unpositioned pool; an attached entity can be re-attached elsewhere but not simply detached. Both gaps feed TD-93: the DM's rule is "remove it from where it is before placing it elsewhere", and today the removal half is missing.
- **A landmark POI cannot be edited or deleted once created** — the panel view carrying those buttons is unreachable (TD-85's open remainder).

There is also no way to read a place's description from the map: clicking a positioned place immediately descends into its map (`useNavigableChildren.ts`).

## 2. Goal

Clicking a place on the map opens a popover that shows what it is and who is there, and carries every action on that place — enter its map, attach and detach entities, un-place it, delete it — so that nothing about a place requires leaving the map or guessing at an invisible state.

## 3. Non-goals

- **The placement invariant itself.** Blocking a second placement of an already-placed thing is TD-93 (a DB-level constraint plus a refusal message), stays in the register, and lands **after** this spec ships — the constraint needs the un-place action to exist first.
- **Editing a zone's fields from the popover.** The popover shows the description; changing it stays on the admin page. (Landmark POIs are the exception — §5 — because the admin page equivalent does not exist for them and TD-85 left their edit/delete unreachable.)
- **Repositioning.** Dragging a marker (SPEC-005) is untouched; the popover adds no "move" action.
- **Any change to how entities are assigned.** The popover opens SPEC-008's existing assignment modal pre-filled; it does not introduce a second assignment mechanism.
- **New deletion semantics.** "Rimuovi definitivamente" calls the SPEC-010 flow exactly — reparenting, coordinate clearing, root refusal and all. If the popover needs something SPEC-010's mutation does not do, that is a spec amendment conversation, not an inline divergence.

## 4. User stories

- As a DM, I want to click the Taverna del Gallo Robin and see its description and who is inside, so that I can run the scene without opening five admin pages.
- As a DM, I want to attach a character to the place I am looking at, from that place, so that I can see what is already there before adding to it.
- As a DM, I want to send a misplaced place back to the unpositioned pool without deleting it, so that fixing a placement mistake does not destroy data.
- As a DM, I want to detach an entity from a place with one click, so that moving someone means removing them first, the way I already think about it.
- As a DM, I want to edit or delete a landmark I created, which today I cannot do at all.

## 5. Behaviour

**Main flow — a positioned zone (marker or drawn area)**

1. The DM clicks the marker (or the rectangle). Instead of descending, a popover opens anchored to it, showing:
   - the place's **title and description** (description possibly truncated with "show more" if long);
   - **"Apri mappa"** — the descend action that clicking used to perform. Disabled with an explanatory label when the place has no map of its own yet (today's grey ❔ marker state);
   - the **entities present** (NPCs and deities attached directly to this zone), each with an **X** that detaches it — the entity returns to the unattached pool (`zoneId` and `poiId` both cleared);
   - **"Collega personaggio"** — opens SPEC-008's assignment modal pre-filled with this zone as the target;
   - **"Sposta nei luoghi non posizionati"** — clears the place's position on the parent map; it reappears in the "Posiziona luogo" right-click entry's dropdown and count (TD-85);
   - **"Rimuovi definitivamente"** — the SPEC-010 deletion flow, behind the same confirmation it has today.
2. Clicking anywhere outside, or Esc, closes the popover. One popover at a time; clicking another place moves it.

**Main flow — a landmark POI**

Same popover, adjusted for what a landmark is: title and description; the entities attached **to this landmark**; the same X-to-detach and pre-filled attach control; **"Modifica"** and **"Elimina"** (the existing `MapPOIPanel` edit/delete machinery, finally reachable — TD-85); no "Apri mappa" (landmarks have no map) and no "sposta nei luoghi non posizionati" (deleting and re-creating a landmark is cheap; un-placing one has no meaning distinct from that today).

**After it ships, in the same spec:**

- The right-click menu's **"Collega un personaggio esistente" entry is removed** (TD-96's remainder), message keys deleted from **both** catalogues in the same commit.
- **`MapPOIPanel`'s list view is re-examined** (TD-85's closing note): with positioning in the context menu and edit/delete in the popover, the list view may have no callers left. Decide with evidence — grep for what still opens it — and delete it only as its own commit if truly orphaned.

**Edge cases**

| Situation                                      | Expected behaviour                                                                                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Place with no entities                         | The entities section shows a short empty state, not nothing — absence should be legible, same principle as TD-85's disabled menu entry.                                                 |
| Marker drag                                    | A drag still repositions and must not open the popover on drop — the existing `justDragged` guard in `useNavigableChildren` now suppresses the popover instead of the descend.          |
| Measurement mode active (SPEC-015)             | Map clicks belong to the measure tool; clicking a marker while measuring must not open the popover. Ending or cancelling the measurement restores normal behaviour.                     |
| Un-placing a zone drawn as an area (SPEC-009)  | Clears its footprint on the parent map along with `lat`/`lng` — an unpositioned place has no position of either kind. Its own map, and its children's coordinates on it, are untouched. |
| Detaching an entity attached to a landmark     | The X on the landmark's popover clears **both** `poiId` and `zoneId` — back to the unattached pool, not "still in the zone, just not at the landmark" (SPEC-008 T8's two cases).        |
| The root                                       | The root is not a marker on any map, so it never has a popover; its two destructive actions are therefore unreachable for it by construction, consistent with SPEC-010's root refusal.  |
| Concurrent edit (place deleted in another tab) | The mutations already fail cleanly (SPEC-010); the popover surfaces the existing error toast and closes.                                                                                |
| Long entity list                               | The list scrolls within the popover; the actions stay visible.                                                                                                                          |

## 6. Data model changes

**None.** Every column involved is already in place and nullable where needed: `zone.lat`/`zone.lng` (and the SPEC-009 area bounds), `npc.zoneId`/`npc.poiId`, `deities.zoneId`/`deities.poiId`. What is new is two small mutations — **un-place** (null a zone's position) and **detach** (null an entity's location reference) — both of which check auth and validate input like every other mutation (rules 1 and 2). No migration, no backfill.

## 7. Metadata changes

**None.** The popover is map UI inside the maps module, not a domain form — the ADR-0011 test applies (no list page, no header filters of its own). All copy goes through `messages/{it,en}.json`; no field is hardcoded that the metadata layer already declares.

## 8. Acceptance criteria

- [ ] Clicking a positioned place opens the popover; it no longer descends directly, and "Apri mappa" descends instead
- [ ] "Apri mappa" is disabled, with a label, for a positioned place that has no map yet
- [ ] The popover lists exactly the entities attached directly to the clicked zone (or to the clicked landmark), with an empty state when there are none
- [ ] The X detaches an entity back to the unattached pool, from a zone and from a landmark alike, and the popover updates without reopening
- [ ] "Collega personaggio" opens the SPEC-008 modal pre-filled with the clicked place, and a completed attach appears in the popover
- [ ] "Sposta nei luoghi non posizionati" clears the place's position (marker or area) and it reappears in the "Posiziona luogo" dropdown with the count incremented
- [ ] "Rimuovi definitivamente" behaves exactly as SPEC-010 specifies, confirmation included
- [ ] A landmark's popover reaches the existing edit and delete flows (closes TD-85's remainder)
- [ ] The right-click "Collega un personaggio esistente" entry is gone, its keys removed from both catalogues (closes TD-96)
- [ ] Marker drag never opens the popover; measurement mode suppresses it
- [ ] Every new mutation rejects an unauthenticated request
- [ ] Every new mutation rejects invalid input with field-level errors
- [ ] The popover passes the axe check in `e2e/a11y.spec.ts` (same bar SPEC-015 set for the grid panel)
- [ ] Coverage has not dropped

## 9. Implementation plan

_Fill in after the sections above are agreed._

**Open questions**

1. **Click semantics.** The DM said "clicking a place opens a popover", and today clicking descends. Proposed: single click always opens the popover and descend moves inside it as "Apri mappa" — one consistent interaction, one extra click to navigate. Alternative: double-click still descends directly as a shortcut. Which?
2. **Does a zone's popover also show entities attached to its landmarks?** Proposed: no — it lists only direct attachments, and each landmark's own popover lists its own; a "grouped" view can come later if the DM misses it. Confirm.
3. **Confirmation on "sposta nei luoghi non posizionati".** Deletion keeps its confirmation. Un-placing is cheap to reverse (the positioning flow already exists), so proposed: no confirmation dialog. Confirm.

## 10. Task breakdown

_Fill in after §9 is agreed._

## 11. Outcome

_Fill in at close._
