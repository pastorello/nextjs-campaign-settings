# SPEC-016: The place popover

- **Status:** **Agreed 2026-08-21.** All three §9 open questions decided with the DM: a single click always opens the popover (descend lives inside it as "Apri mappa", no double-click shortcut); a zone's popover lists only its direct attachments (each landmark's popover lists its own); un-placing asks no confirmation (deletion keeps its own).
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

**None.** Every column involved is already in place and nullable where needed: `zone.lat`/`zone.lng` (and the SPEC-009 area bounds), `npc.zoneId`/`npc.poiId`, `deities.zoneId`/`deities.poiId`. No migration, no backfill.

Checked against the code on 2026-08-21:

- **Detach already exists.** `assignLocationSchema` accepts `zoneId: null, poiId: null`, so the X is a call to SPEC-008's existing `assignLocation` mutation with both nulls — no new mutation, and TD-93's future constraint composes with it unchanged.
- **Un-place is the one new mutation.** `updateZonePosition` requires finite `lat`/`lng` by design (SPEC-005 repositions, it never clears), so clearing a position is a new, separate function — auth-checked and Zod-validated like every other mutation (rules 1 and 2), clearing the footprint along with the point per §5's edge case.
- **One new read**: entities at a given zone or landmark (NPCs and deities by `zoneId`/`poiId`). Nothing existing serves it — `fetchLinkableEntities` is the opposite pool.

## 7. Metadata changes

**None.** The popover is map UI inside the maps module, not a domain form — the ADR-0011 test applies (no list page, no header filters of its own). All copy goes through `messages/{it,en}.json`; no field is hardcoded that the metadata layer already declares.

## 8. Acceptance criteria

- [ ] Clicking a positioned place opens the popover; it no longer descends directly, and "Apri mappa" descends instead
- [ ] "Apri mappa" is disabled, with a label, for a positioned place that has no map yet
- [x] The popover lists exactly the entities attached directly to the clicked zone (or to the clicked landmark), with an empty state when there are none
- [x] The X detaches an entity back to the unattached pool, from a zone and from a landmark alike, and the popover updates without reopening
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

**Files touched, in order**

| #   | File                                                                    | Change                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `app/lib/data/maps/fetchEntitiesAtPlace.ts` (new)                       | The one new read: NPCs and deities at a given zone (direct only) or landmark, one function per file as usual                                                                        |
| 2   | `app/lib/data/maps/unplacePlace.ts` (new)                               | The one new mutation: auth check, Zod validation, clears `lat`/`lng` and the SPEC-009 footprint, refuses the root                                                                   |
| 3   | `app/ui/geography/PlacePopover.tsx` (new, + test)                       | The popover itself — title/description, "Apri mappa", entities list with X, attach control, the two zone actions / the two landmark actions, empty state, Esc/outside close         |
| 4   | `app/modules/maps/hooks/useNavigableChildren.ts`                        | Marker and rectangle click stop descending and report the clicked place upward (the `justDragged` guard now suppresses the popover); descend becomes a callback the popover invokes |
| 5   | `app/ui/geography/WorldMap.tsx`                                         | Owns the open-popover state (one at a time), wires descend/attach/delete/un-place into it, suppresses it while measurement is active                                                |
| 6   | `app/ui/geography/AttachEntityButton.tsx` / `DeletePlaceButton.tsx`     | Reused from the popover, pre-filled — no forked second mechanism                                                                                                                    |
| 7   | `e2e/map.spec.ts` and any spec that navigates by clicking a marker      | Updated deliberately for the new click semantics — descend now goes through "Apri mappa"                                                                                            |
| 8   | `app/modules/maps/hooks/useMapContextMenu.ts` + `messages/{it,en}.json` | Remove "Collega un personaggio esistente" and its keys, both catalogues, same commit (TD-96)                                                                                        |
| 9   | `app/modules/maps/components/map/MapPOIPanel.tsx`                       | Evidence-based decision on the now-possibly-orphaned list view, own commit                                                                                                          |
| 10  | `e2e/a11y.spec.ts`, `docs/TECH_DEBT.md`, `docs/ROADMAP.md`, this file   | Axe check on the popover; TD-85 and TD-96 closed; §11 filled                                                                                                                        |

**Risks**

- **The click-semantics change breaks every test that navigates by clicking a marker.** That is expected, not collateral — those tests encode the old behaviour. Update them in the same task as the behaviour change (file 7), never loosened to pass both ways.
- **Leaflet/React interplay.** The popover is a React component anchored to a map position, living alongside imperative Leaflet layers; the context menu's `runWithoutClosing` and the `{ animate: false }` framing lesson from SPEC-015 T6 (deferred `moveend` closing UI on slow runners) both apply. Reuse those patterns rather than rediscovering them.
- **Scope pull toward TD-93.** The invariant ("refuse a second placement") is explicitly out of scope; the popover only builds the removal half. Resist implementing the refusal here "since we're in the file".

## 10. Task breakdown

- [ ] **T1** — `fetchEntitiesAtPlace` + `unplacePlace`, with the detach path confirmed as existing `assignLocation({zoneId: null, poiId: null})` _(test: unauthenticated rejected, invalid input rejected with field errors, root un-place refused, footprint cleared with the point, entities-at returns direct attachments only)_
- [x] **T2** — Popover shell replacing descend: click opens it (marker and rectangle), "Apri mappa" descends, disabled-with-label when the place has no map, Esc/outside close, one at a time, drag guard, measurement suppression; e2e specs that clicked-to-descend updated in the same commit _(test: unit for open/close/guard states; the updated e2e navigation path green)_ — no e2e spec clicked a navigable marker to descend before this landed (`map.spec.ts` says so explicitly), so file 7 of §9 had nothing to update
- [x] **T3** — Entities list with X-to-detach and empty state, from a zone and from a landmark _(test: detach clears both references and the list updates without reopening; empty state rendered)_ — extracted as `PlaceEntityList`, keyed by the same `{zoneId} | {poiId}` discriminant `fetchEntitiesAtPlace` takes, so T7's landmark popover reuses it unchanged; the popover wires the zone branch. No e2e touched: nothing in `e2e/` reaches the popover yet (T5-T7 and T10 add that).
- [ ] **T4** — Attach control opening SPEC-008's modal pre-filled with the clicked place; completed attach appears in the popover _(test: modal receives the pre-fill; list refreshes)_
- [ ] **T5** — "Sposta nei luoghi non posizionati" wired, no confirmation; the place reappears in "Posiziona luogo" with its count _(test: e2e — un-place then find it in the dropdown, count incremented)_
- [ ] **T6** — "Rimuovi definitivamente" wired to the SPEC-010 flow, confirmation intact _(test: existing deletion e2e reached from the popover)_
- [ ] **T7** — Landmark popover variant: edit and delete reachable (TD-85's remainder) _(test: e2e — edit a landmark's title from the popover; delete one)_
- [ ] **T8** — Remove the right-click "Collega un personaggio esistente" entry and its keys from both catalogues (TD-96) _(test: menu no longer shows it; CI key-set check green; no orphaned key references)_
- [ ] **T9** — `MapPOIPanel` list view: grep for remaining callers, delete it as its own commit if orphaned, or record why it stays _(test: suite green after whichever outcome)_
- [ ] **T10** — Axe check on the popover in `e2e/a11y.spec.ts`; TD-85 and TD-96 flipped closed in the register; ROADMAP updated; §11 filled _(test: a11y spec green)_

## 11. Outcome

_Fill in at close._
