# SPEC-026: Create a place without leaving the flow

- **Status:** Draft — needs the DM's agreement
- **Date:** 2026-09-22
- **Phase:** 4
- **Related:** [SPEC-008](./008-entity-location-reference.md) (T8 chose the model this spec works within) · [ADR-0010](../adr/0010-entity-location-as-stored-reference.md) · [SPEC-016](./016-place-popover.md) (the popover, `AttachEntityButton`, `PlaceEntityList`) · [SPEC-017](./017-one-unplaced-pool.md) (where a place with no position goes) · ROADMAP, _Also asked for on 2026-08-18_

---

## 1. Problem

The DM's example: they are writing up a character who drinks at the Taverna del
Gallo Robin, in Skreebars. The tavern does not exist in the app yet. Attaching
the character to it means leaving what they were doing, finding Skreebars on the
map, creating a place inside it, and coming back — and by then the thought they
were writing down is gone.

The model is not the problem. SPEC-008 T8 settled it: an entity has no
coordinates of its own, it lives at a place, and a place is a node in the world
tree. Attaching works from the map's popover, detaching works from
`PlaceEntityList`, and a card can assign a location through
`AssignLocationButton`. What is missing is that **every one of those pickers can
only choose a place that already exists**, and a place is only quick to create
if you are already standing on the right map.

## 2. Goal

Wherever the app asks the DM to choose a place, they can create the place they
meant instead, without losing what they were doing.

## 3. Non-goals

- **Giving entities coordinates.** SPEC-008 T8's model is not reopened: an
  entity lives at a place, never at a point.
- **Creating a place with a map image, a grid or a footprint in the dialog.** A
  place created this way is a name and a parent. Everything else is added later
  from the place's own surfaces.
- **Bulk creation.** One place at a time.
- **A new place list page.** The geography explorer and the map stay the places
  where the tree is browsed.
- **Renaming or re-parenting from the picker.** Creating is the only write this
  spec adds.

## 4. User stories

- As a DM writing an NPC, I want to create the tavern they drink at while I am
  writing them, so that a thought does not cost a detour.
- As a DM, I want the place I just created to be the one selected, so that I do
  not have to find it again in a list I just added to.
- As a DM, I want a place I created this way to appear on the right map when I
  next open it, so that quick creation does not leave me tidying up later.

## 5. Behaviour

**Main flow**

1. Any picker that lists places — `AssignLocationButton`'s, the attach dialog's,
   and the unplaced pool's filter — offers a "create a place" affordance
   alongside the list.
2. It asks for a name and a parent. The parent defaults to the most specific
   place already in context: the map being viewed, the place whose popover is
   open, or the entity's current location.
3. Confirming creates the place, closes the dialog, and selects the new place in
   the picker that opened it.
4. The new place has no position. It appears in the unplaced pool for its parent
   and is drawn on the map whenever the DM next places it (SPEC-017).

**Where the place ends up.** This is the part worth agreeing before building: a
place created this way is **unplaced by design**. The alternative — dropping it
at the centre of the current map — puts a marker somewhere the DM did not choose
and did not see, which is exactly the class of surprise SPEC-017 was written to
remove. The unplaced pool already exists to hold "real, but not drawn yet", and
the geography view already counts what is waiting there.

**Edge cases**

| Situation                                           | Expected behaviour                                                                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A sibling already has that name                     | Allowed, as it is today — the app does not enforce unique place names — but the picker shows the parent alongside each name so the two are distinguishable. |
| No parent can be inferred                           | The parent field is required and empty, with the tree browsable from the dialog. Never silently the root.                                                   |
| The dialog is cancelled                             | Nothing is created and the picker keeps whatever was selected before.                                                                                       |
| Creation fails                                      | The dialog stays open with the error and the typed name intact.                                                                                             |
| The picker was opened from a landmark               | The parent is the landmark's place, not the landmark: a landmark has no children (ADR-0010).                                                                |
| The DM creates a place and abandons the entity form | The place stays — it was created, and its creation is not part of the entity's save.                                                                        |
| The same flow reached from an unsaved new entity    | The place is created immediately; the entity is not. The dialog says so, so "it did not save" is never a surprise.                                          |

## 6. Data model changes

None. `zone` already allows a row with a parent and no coordinates — that is what
the unplaced pool is made of.

## 7. Metadata changes

None new. The dialog renders the `name` and parent fields from `zoneMeta`'s
existing declarations and reuses their validators, rather than restating them —
the same rule TD-129 applied to the map's place schemas.

## 8. Acceptance criteria

- [ ] A place can be created from every picker that lists places, without
      navigating away.
- [ ] The parent defaults to the place in context and is always shown before
      confirming.
- [ ] The newly created place is selected in the picker that opened the dialog.
- [ ] The new place is unplaced, appears in its parent's pool, and is counted by
      the unpositioned count.
- [ ] Cancelling creates nothing.
- [ ] A failed creation keeps the dialog open with the typed values.
- [ ] The dialog is reachable and operable by keyboard, with labelled fields in
      both catalogues.
- [ ] Every new mutation rejects an unauthenticated request.
- [ ] Every new mutation rejects invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Fill in after the sections above are agreed._

**Open questions for the DM**

- Should the same dialog also offer to place the new place on the current map
  straight away, or is "unplaced, place it when you draw it" the whole answer?
- Does an entity's card need a shortcut to the place it lives at, or is the map
  enough?

## 10. Task breakdown

_Fill in after §9._

## 11. Outcome

_Fill in at close._
