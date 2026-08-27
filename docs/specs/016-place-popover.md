# SPEC-016: The place popover

- **Status:** **Shipped 2026-08-27** — T1–T10 all landed (PRs #217–#224, #227 and this one); see §11, and TD-85/TD-96 closed with it. _(Agreed 2026-08-21: all three §9 open questions decided with the DM: a single click always opens the popover (descend lives inside it as "Apri mappa", no double-click shortcut); a zone's popover lists only its direct attachments (each landmark's popover lists its own); un-placing asks no confirmation (deletion keeps its own).)_
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

- [x] Clicking a positioned place opens the popover; it no longer descends directly, and "Apri mappa" descends instead
- [x] "Apri mappa" is disabled, with a label, for a positioned place that has no map yet
- [x] The popover lists exactly the entities attached directly to the clicked zone (or to the clicked landmark), with an empty state when there are none
- [x] The X detaches an entity back to the unattached pool, from a zone and from a landmark alike, and the popover updates without reopening
- [x] "Collega personaggio" opens the SPEC-008 modal pre-filled with the clicked place, and a completed attach appears in the popover
- [x] "Sposta nei luoghi non posizionati" clears the place's position (marker or area) and it reappears in the "Posiziona luogo" dropdown with the count incremented
- [x] "Rimuovi definitivamente" behaves exactly as SPEC-010 specifies, confirmation included
- [x] A landmark's popover reaches the existing edit and delete flows (closes TD-85's remainder)
- [x] The right-click "Collega un personaggio esistente" entry is gone; no catalogue key was orphaned by it (closes TD-96 — see T8)
- [x] Marker drag never opens the popover; measurement mode suppresses it
- [x] Every new mutation rejects an unauthenticated request
- [x] Every new mutation rejects invalid input with field-level errors
- [x] The popover passes the axe check in `e2e/a11y.spec.ts` (same bar SPEC-015 set for the grid panel)
- [x] Coverage has not dropped

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

- [x] **T1** — `fetchEntitiesAtPlace` + `unplacePlace`, with the detach path confirmed as existing `assignLocation({zoneId: null, poiId: null})` _(test: unauthenticated rejected, invalid input rejected with field errors, root un-place refused, footprint cleared with the point, entities-at returns direct attachments only)_
- [x] **T2** — Popover shell replacing descend: click opens it (marker and rectangle), "Apri mappa" descends, disabled-with-label when the place has no map, Esc/outside close, one at a time, drag guard, measurement suppression; e2e specs that clicked-to-descend updated in the same commit _(test: unit for open/close/guard states; the updated e2e navigation path green)_ — no e2e spec clicked a navigable marker to descend before this landed (`map.spec.ts` says so explicitly), so file 7 of §9 had nothing to update
- [x] **T3** — Entities list with X-to-detach and empty state, from a zone and from a landmark _(test: detach clears both references and the list updates without reopening; empty state rendered)_ — extracted as `PlaceEntityList`, keyed by the same `{zoneId} | {poiId}` discriminant `fetchEntitiesAtPlace` takes, so T7's landmark popover reuses it unchanged; the popover wires the zone branch. No e2e touched: nothing in `e2e/` reaches the popover yet (T5-T7 and T10 add that).
- [x] **T4** — Attach control opening SPEC-008's modal pre-filled with the clicked place; completed attach appears in the popover _(test: modal receives the pre-fill; list refreshes)_ — reused `AttachEntityButton` unchanged (its `zoneId` prop is the pre-fill), added a `refreshKey` counter `PlaceEntityList` re-runs its fetch effect on since a completed attach has no local row to fold in the way a detach does. Found and fixed a real bug while wiring it: `AttachEntityButton`'s modal is Headless UI, which portals to `document.body` — outside `popoverRef` in the DOM — so the popover's own outside-click handler was reading a click inside the attach modal as "outside" and closing itself out from under it; the handler now excludes clicks inside `[data-headlessui-portal]`. No e2e touched: nothing in `e2e/` reaches the popover yet (T5-T7 and T10 add that).
- [x] **T5** — "Sposta nei luoghi non posizionati" wired, no confirmation; the place reappears in "Posiziona luogo" with its count _(test: e2e — un-place then find it in the dropdown, count incremented)_ — `handleUnplace` calls the T1 mutation and bumps `placesRefetchToken`, the same convention `handleContextMenuPositionPlace` uses in reverse. **Initially over-built:** added a client-side `unpositionedCountBonus` on the assumption that `unpositionedCount` (§6: "a page-load snapshot with no live-refresh path") needed a manual correction — real e2e testing (not just unit tests) caught this double-counting the pool, because `unplacePlace` already calls `revalidatePath("/dashboard/geography")`, exactly like `updateZonePosition` does, and Next.js already re-fetches that Server Component prop on the client after the action resolves. Reverted; `unpositionedCount` is passed straight through, unmodified, matching how `handleContextMenuPositionPlace` already treated it. New e2e spec `map-unplace.spec.ts` — the first in-app path that can produce a coordinate-less zone, closing the gap `map-place-repositioning.spec.ts` used to document (its docblock updated in the same commit).
- [x] **T6** — "Rimuovi definitivamente" wired to the SPEC-010 flow, confirmation intact _(test: existing deletion e2e reached from the popover)_ — embeds `DeletePlaceButton` directly inside `PlacePopover`, unchanged, the same reuse shape T4 used for `AttachEntityButton`: local `isDeleteOpen` state opens its confirmation dialog, pre-filled with the clicked place and a new `parentTitle` prop (the place currently being viewed, i.e. the clicked place's own parent — for the dialog's reparent message). `isRoot` is hardcoded `false`, correctly, since the root never gets a popover in the first place (§5's edge cases already make it unreachable). Only the post-success bookkeeping bubbles up, through a new `onDeleted` callback mirroring T5's `onUnplace` split: `WorldMap` bumps `placesRefetchToken` and closes the popover, the same two effects `handleUnplace` produces, for the same reason — the deleted place is a child of the one being viewed, not the one being viewed itself, so there's no navigation stack to pop. `map-unplace.spec.ts`'s cleanup step — the only e2e path that reached the real SPEC-010 mutation — now deletes through the popover's own button instead of descending via "Apri mappa" and `MapOptionsButton`; its docblock note about T6 not having landed yet is gone.
- [x] **T7** — Landmark popover variant: edit and delete reachable (TD-85's remainder) _(test: e2e — edit a landmark's title from the popover; delete one)_ — `PlacePopover` widened to a `target: {kind:"zone"|"poi"; ...}` discriminated union rather than forked into a second component, matching §5's "same popover, adjusted." Clicking a landmark marker now opens it too: `usePOIManager` gained an `onPOIClick` callback (mirroring `useNavigableChildren`'s own `onPlaceClick`), the same per-marker `justDragged` guard, and dropped its `bindPopup` native popup — fully superseded, the same way T2 superseded click-to-descend. Added one more guard native zones don't need: the click handler checks `serverIdsRef.current.has(poi.id)` first, since a landmark clicked in the brief optimistic window before its `createPoi` round trip resolves has no database id yet, and every consumer of the click (`fetchEntitiesAtPlace`, edit, delete) needs one — caught by the e2e spec itself, which had to retry its first click rather than assume a fixed delay. "Modifica"/"Elimina" both delegate to `WorldMap` (unlike T6's embedded `DeletePlaceButton`) since what they reach — `MapPOIPanel`, `usePOIManager`'s mutations — are singletons already owned there, not something the popover could mount a second copy of. `MapPOIPanel` gained one new prop, `editTarget`, so "Modifica" can seed its edit form from outside for the first time — previously `handleEditMode` was only ever called from `POIListItem`'s own row, unreachable per TD-85's finding. "Elimina" stays exactly as unconfirmed as `usePOIManager.deletePOI` already was — no new confirmation dialog, matching §5's "deleting and re-creating a landmark is cheap." `AttachEntityButton` gained an optional `poiId` prop (passed through to `AssignLocationModal`'s existing `currentPoiId`) so "Collega personaggio" pre-fills a landmark's popover with the landmark itself, not just its enclosing zone — an extension of T4's existing control, not a second mechanism. New e2e spec `map-landmark-popover.spec.ts`; `map-poi-crud.spec.ts`'s own list-view CRUD coverage is untouched (it never clicks a marker) and stays as a secondary, still-valid path — T9 is where the list view's fate as a whole gets decided. **§9's "the click-semantics change breaks every test that navigates by clicking a marker" came true once, and cost more than a test update:** `map-place-repositioning.spec.ts` read its "after" coordinates out of the native Leaflet popup this task removed, so it went red on CI (and took `map-poi-crud.spec.ts` with it — that spec failed only because the first one died before its cleanup, leaving rows whose extra markers covered the context menu). Moving both of its readings onto the panel row, per §9's "never loosened to pass both ways", exposed that its assertion had always been vacuous — it compared `formatDecimalDegrees(…, 4)` against the popup's `toFixed(6)`, two formattings of the same numbers that could never be equal — and that the drag it claimed to prove does not fire at all. Confirmed **not** a T7 regression by reverting `usePOIManager.ts` alone to pre-T7 `main` and watching the same assertion fail. That spec is `test.fixme` and the finding is TD-101; T7 only removed what was hiding it.
- [x] **T8** — Remove the right-click "Collega un personaggio esistente" entry and its keys from both catalogues (TD-96) _(test: menu no longer shows it; CI key-set check green; no orphaned key references)_ — the entry, its `onAttachEntity`/`attachEntityLabel` props, its handler and the `UserPlus` icon are gone from `MapContextMenu`, and with them `WorldMap`'s own `AttachEntityButton` instance and `isAttachEntityOpen` state: the right-click entry was that instance's only trigger, and `PlacePopover` mounts its own (T4/T7), pre-filled with the _clicked_ place rather than the currently-viewed parent. **No key was orphaned, contrary to §8's and TD-96's expectation** — the entry never had a label key of its own. `WorldMap` passed it `geography.attachEntity.trigger`, which `AttachEntityButton` also reads as its modal's title (line 107), so both catalogues are untouched and deliberately so; removing the key would have blanked the modal heading, not cleaned up drift. TD-96's "check whether their message keys are referenced anywhere else" is exactly the check that caught this. No e2e spec drove the menu through the entry, so none needed updating. The two unit tests that exercised it are replaced by one regression guard each — `MapContextMenu.test.tsx` asserts the entry is absent, `WorldMap.test.tsx` that no `AttachEntityButton` is mounted (its now-unused stub removed with it). **Consequence worth stating:** the place _currently being viewed_ can no longer be attached to from its own map — only from its marker's popover one level up, or the admin list's per-row button. That is TD-96's intent ("attaching to a location you cannot see the contents of"), and it makes the root unattachable from the map entirely, consistent with §5's edge case that the root never gets a popover.
- [x] **T9** — `MapPOIPanel` list view: grep for remaining callers, delete it as its own commit if orphaned, or record why it stays _(test: suite green after whichever outcome)_ — **it stays, and it was never orphaned; TD-85's "no entry point" was true of _opening_ the panel in list mode, not of reaching the view.** Nothing sets `poiPanelMode` to `"list"` to open the panel — `handleContextMenuAddPOI` and `handleAreaDrawn` force `"add"`, T7's "Modifica" forces `"edit"` — but the panel drives that transition itself once open: `resetFormAfterSave` and the form's back button both call `setViewMode("list")`, which under `WorldMap`'s controlled `mode`/`onModeChange` pair lands the caller in the list with the panel still open. `e2e/map-poi-crud.spec.ts` has been walking that path all along — add, save, then edit and delete from the row it lands on — so deleting the view would have taken a green spec with it. Two further reasons beyond reachability: the row actions the popover now duplicates are not all of it (Import, Export, Clear all and fly-to exist nowhere else in the app), and the view is the only thing the add form has to return _to_. **One part of it did go**, in this task's second commit: the unplaced-children picker, withdrawn by the DM on 2026-08-18 (TD-85, [SPEC-005 §3](005-place-repositioning.md)) in favour of "Posiziona luogo" and held back only until that entry demonstrably worked — which PR #190 and T5's `map-unplace.spec.ts` (the dropdown, with its count) now show. So the answer to §5's "may have no callers left" is: the view has callers, the picker inside it has a replacement.
- [x] **T10** — Axe check on the popover in `e2e/a11y.spec.ts`; TD-85 and TD-96 flipped closed in the register; ROADMAP updated; §11 filled _(test: a11y spec green)_ — the scan is scoped to the open popover with `.include('[role="dialog"]')`, the same shape SPEC-015 T8 used for the grid panel and for the same reason: the geography page as a whole is not in `a11y.spec.ts`'s `PAGES`, since the Leaflet canvas is its own accessibility story. Zero violations, no allowlist. **The zone variant is the one scanned** — it renders strictly more than the landmark variant (the indigo "Apri mappa" primary and the two destructive actions, on top of the title, close button, entities list and attach control the two share) — so the fixture costs a map image at creation, and it is deleted again through the popover's own "Rimuovi definitivamente" (T6). Not scanned, deliberately and stated in the spec's docblock: the landmark variant's two extra buttons (same classes as the zone actions beside them) and a _populated_ entities list, whose icon-only X would need an attached NPC in the e2e database; that row's `aria-label` is covered in `PlaceEntityList.test.tsx`. **T1's checkbox was flipped here too** — it shipped as [PR #217](https://github.com/pastorello/nextjs-campaign-settings/pull/217) and was never ticked.

## 11. Outcome

- **Shipped:** everything in §5, 2026-08-27, as ten tasks
  ([#217](https://github.com/pastorello/nextjs-campaign-settings/pull/217)–[#224](https://github.com/pastorello/nextjs-campaign-settings/pull/224),
  [#227](https://github.com/pastorello/nextjs-campaign-settings/pull/227), and
  this one): the two data functions, the popover replacing click-to-descend for
  zones and landmarks alike, the entities list with X-to-detach, the pre-filled
  attach control, un-placing, deletion through SPEC-010's own flow, the landmark
  variant, the right-click entry's removal, the POI panel decision, and the axe
  scan. **TD-85 and TD-96 are closed with it** — both had been `part` in the
  register precisely because their remainder was waiting for this surface — and
  **TD-93 is unblocked**: refusing a second placement is now reasonable, because
  un-placing is one click away.
- **Deviations from spec and why:**
  - **§9's file 9 came out the opposite way, on evidence (T9).** The list view
    was expected to be orphaned once the popover duplicated its row actions. It
    was not: nothing _opens_ the panel in list mode, but the panel transitions
    there itself after a save and on backing out of the add form, and
    `e2e/map-poi-crud.spec.ts` had been walking that path all along. Deleting it
    would have taken a green spec with it. What did go, in the same task, is the
    unplaced-children picker — TD-85's own withdrawal order, held back until
    "Posiziona luogo" demonstrably worked.
  - **§8's "no catalogue key was orphaned" was written as a check and came back
    as a correction (T8).** The right-click attach entry never had a label key of
    its own: `WorldMap` passed it `geography.attachEntity.trigger`, which
    `AttachEntityButton` also reads as its modal title. Removing that key would
    have blanked the modal heading, not cleaned up drift, so both catalogues are
    untouched.
  - **T5 was over-built first, and only real e2e caught it.** A client-side
    `unpositionedCountBonus` was added on §6's "page-load snapshot with no
    live-refresh path" reading; `unplacePlace` already calls `revalidatePath`,
    so the pool was counted twice. Unit tests were happy with it. Reverted.
  - **§9's click-semantics risk came true — one task later than expected, and it
    cost more than a test update (T7).** No e2e spec clicked a marker to descend,
    so T2 had nothing to update; but `map-place-repositioning.spec.ts` read its
    "after" coordinates out of the native Leaflet popup T7 removed. Moving those
    readings onto the panel row, rather than loosening the assertion, exposed
    that the assertion had always been vacuous (`formatDecimalDegrees(…, 4)`
    compared against `toFixed(6)`) and that the drag it claimed to prove does not
    fire at all. Confirmed not a T7 regression by reverting `usePOIManager.ts`
    alone against pre-T7 `main` and watching the same assertion fail.
  - **The popover was widened, not forked (T7)** — a `target: {kind: "zone" | "poi"}`
    discriminated union, per §5's "same popover, adjusted." The landmark branch
    needed one guard native zones do not: a click is refused until the POI has a
    resolved database id, since everything the popover reaches (the entities
    read, edit, delete) needs one and a freshly-drawn landmark has none for the
    length of its `createPoi` round trip.
  - **§9's "scope pull toward TD-93" was resisted, as written.** The placement
    invariant is not built here; only the removal half it depends on is.
- **Follow-up debt created:**
  - **TD-101** — marker drag repositioning never fires `dragend`, uncovered
    rather than caused by T7 (see above). `map-place-repositioning.spec.ts` is
    `test.fixme` until it is fixed, which is the honest state: the spec used to
    be green on an assertion that could not fail.
