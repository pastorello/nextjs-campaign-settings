# SPEC-025: Typed coordinates for a place

- **Status:** Shipped 2026-09-22
- **Date:** 2026-09-22
- **Phase:** 4
- **Related:** TD-133 (this is its remaining half) · [SPEC-015](./015-map-grid-and-scale.md) (the grid, if coordinates are to be expressed in squares) · [SPEC-016](./016-place-popover.md) · [SPEC-017](./017-one-unplaced-pool.md) · TD-15 (accessibility baseline)

---

## 1. Problem

A position on a map can only be pointed at. TD-133's keyboard work shipped the
entry points — Shift+F10 or the context-menu key opens "Aggiungi luogo" at the
map's centre, markers are focusable and Enter opens their popover — but the form
behind it still says "Click to select location on map" and offers no fields to
type into. So the map's centre is the only position a keyboard user can ever
choose, and every subsequent place lands on top of the last one.

It is not only an accessibility gap. A pointing device places a marker
approximately; there is no way to put a place at an exact point, to nudge one a
few pixels, or to copy a position from one place to another.

## 2. Goal

A place's position can be typed and corrected as numbers, wherever it can be set
by clicking.

## 3. Non-goals

- **A coordinate system with meaning.** These are pixel-space positions in the
  map image's own reference frame, not latitude and longitude — ROADMAP's
  2026-09-18 decision on the vendored Earth-geometry helpers still holds.
- **Replacing click-to-place.** Clicking stays the primary way; typing is the
  second way, and the two write the same value.
- **Typing a footprint.** An area's shape is drawn. If SPEC-024 ships first, the
  keyboard question for polygons is answered there.
- **Importing coordinates in bulk.** A GeoJSON import path already exists and is
  a different feature.
- **Moving the map viewport by typing.** This positions a place, not the camera.

## 4. User stories

- As a DM using only the keyboard, I want to type where a place goes, so that I
  can build the world without a mouse.
- As a DM, I want to correct a marker that is a few pixels off, so that I do not
  have to drag it repeatedly and hope.
- As a DM, I want to see the position of the place I am looking at, so that I can
  reproduce it elsewhere.

## 5. Behaviour

**Main flow**

1. The place form — the one reached from "Aggiungi luogo" and from a place's
   edit surface — shows two numeric fields for the position, filled in when a
   position already exists and empty when it does not.
2. Clicking on the map fills those fields; typing in them moves the marker.
   Neither is a mode: the fields and the map are two views of one value.
3. Saving validates the pair together — both present or both absent — and
   refuses a position outside the map's bounds with a field-level message.

**Which numbers.** The open question for the DM, and the reason this is a spec
rather than a debt fix. Three candidates:

| Form                        | Reads as                     | Cost                                                                                                          |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| The stored `lat`/`lng` pair | `-42.318`, `17.004`          | None — it is the value already stored. Meaningless to a person, and easy to mistype by an order of magnitude. |
| Percent of the map image    | `63.2%` across, `41.8%` down | A conversion at the boundary, stable when the image is replaced by a larger one at the same aspect ratio.     |
| Grid squares (SPEC-015)     | column 14, row 9             | Only available on maps that have a grid, so it cannot be the only form.                                       |

**Decided: percent of the image**, with the stored value unchanged underneath.
It is the only form that is both always available and legible to a person, and
it survives a map image being re-exported at a different resolution. A comma is
accepted as the decimal separator, since the UI ships in Italian.

**Edge cases**

| Situation                                | Expected behaviour                                                                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One field filled, the other empty        | Refused on save, naming both fields. A half-position is not a position.                                                                                                                             |
| A value outside the map's bounds         | Refused with a field-level message saying the permitted range.                                                                                                                                      |
| Both fields cleared on an existing place | The place becomes unplaced, and the dialog says so — this is the same operation as SPEC-016's unplace, so it must not become a second, quieter way to do it. Alternatively refuse it; decide in §9. |
| The map has no image yet                 | The fields are disabled with the reason given, as the click path already refuses.                                                                                                                   |
| Typing while the marker is being dragged | The last write wins; no locking.                                                                                                                                                                    |
| Precision                                | One decimal place in percent is finer than a pin can be clicked; state the rounding rather than storing whatever the input produced.                                                                |

## 6. Data model changes

None. `zone.lat`/`zone.lng` and `poi`'s equivalents already hold the position;
this spec adds a way to write them.

## 7. Metadata changes

Two `PageMeta` entries on `zoneMeta` for the position pair — `fieldType`,
`controlType`, `validator`, `getDatum` — so the fields render from the layer
rather than being hand-written into the map panel, and so the same validator
guards the Server Action. If the displayed form is percent while the stored form
is the raw pair, the conversion belongs in the field's `getDatum`/validator and
nowhere else; two conversions in two components is how they drift.

## 8. Acceptance criteria

- [ ] A place can be given a position by typing, with no pointer used at all.
- [ ] Typing a position moves the marker, and clicking the map updates the fields.
- [ ] An out-of-bounds value is refused with a field-level message.
- [ ] A half-filled pair is refused.
- [ ] An existing place's position is shown in the fields when its form opens.
- [ ] The keyboard path is covered end to end by an e2e test, in the shape of
      `e2e/map-keyboard.spec.ts`.
- [ ] The fields have accessible labels, in both catalogues.
- [ ] Every new mutation rejects an unauthenticated request.
- [ ] Every new mutation rejects invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

**Files touched, in order**

| #   | File                                              | Change                                                                |
| --- | ------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | `app/modules/maps/lib/utils/percentPosition.ts`   | New: the conversion both ways, the rounding, and the input parser     |
| 2   | `app/modules/maps/components/map/MapPOIPanel.tsx` | The two labelled fields, the typing draft, and the save-time refusals |
| 3   | `app/ui/geography/WorldMap.tsx`                   | Hands the displayed image's corners to the panel                      |
| 4   | `messages/{it,en}.json`                           | Labels, the unavailable note, and the two field-level messages        |

**Risks**

- **The field fighting the typist.** Rounding the stored pair back into the
  field on every keystroke would eat a half-typed `63.`. Solved with a draft the
  fields own, and a ref holding the pair this component last wrote itself, so a
  map click is adopted while the echo of one's own typing is not.
- **Validating the wrong thing.** An unusable draft never reaches the stored
  pair, so checking the stored pair at save time would silently save the
  position the field no longer shows. `handleSave` judges the draft.

**Answers to §5's open questions**

- **Which numbers:** percent. Grid squares were not taken: they exist only on
  maps that have a grid (SPEC-015), so they could never be the only form.
- **Clearing both fields** does not unplace anything. It empties the fields, and
  saving then refuses with "a position is required" — unplacing stays the
  popover's explicit action (SPEC-016 T5), not a side effect of an empty field.
- **Landmarks got the fields at the same time**, because the panel is one form
  for both: there was no version of this change that reached only places.

## 10. Task breakdown

- [x] **T1** — `percentPosition.ts` and its unit tests: both conversions, the
      corner ordering, the degenerate-bounds guard, the formatter and the
      parser. _(test: `percentPosition.test.ts`, 22 cases)_
- [x] **T2** — The fields in `MapPOIPanel`, the draft, the save-time refusals,
      the catalogues, and `WorldMap` handing over the corners.
      _(test: 8 cases in `MapPOIPanel.test.tsx`)_
- [x] **T3** — The keyboard path end to end.
      _(test: `e2e/map-keyboard.spec.ts`, "typed coordinates")_

## 11. Outcome

- Shipped: 2026-09-22
- **Deviations from spec.** §1 said the form "offers no fields for typing
  coordinates". That was true only of the empty state: once a click had set a
  position, the panel already rendered two raw `lat`/`lng` text inputs. So the
  change is narrower than drafted in one way — the empty state gains fields —
  and wider in another: those existing inputs had no labels at all, only
  placeholders, and now they do. The raw pair is still what the fields fall back
  to when no map image is loaded, rather than disabling them, because taking a
  working control away would have been a regression for that case.
- Follow-up debt created: none. TD-133 closes with this.
