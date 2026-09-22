# SPEC-025: Typed coordinates for a place

- **Status:** Draft — needs the DM's agreement
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

**Recommendation:** percent of the image, with the stored value unchanged
underneath. It is the only form that is both always available and legible to a
person, and it survives a map image being re-exported at a different resolution.

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

_Fill in after the sections above are agreed._

**Open questions for the DM**

- Which numbers: percent, raw pair, or grid squares where a grid exists?
- Does clearing both fields unplace the place, or is that refused?
- Should landmarks get the same fields at the same time, or does the place come
  first?

## 10. Task breakdown

_Fill in after §9._

## 11. Outcome

_Fill in at close._
