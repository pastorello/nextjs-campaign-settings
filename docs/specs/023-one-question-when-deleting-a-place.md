# SPEC-023: One question when deleting a place

- **Status:** ✅ Shipped 2026-09-24 — §5's open decision answered by the DM the same day (option A: no cascade)
- **Date:** 2026-09-22 · decided and implemented 2026-09-24
- **Phase:** 4
- **Related:** [SPEC-010](./010-deleting-a-place.md) (the delete rules this spec revisits) · [SPEC-016](./016-place-popover.md) (T5 unplace, T6 delete, T7 landmark delete) · [SPEC-017](./017-one-unplaced-pool.md) (where an unplaced place goes) · [ADR-0010](../adr/0010-entity-location-as-stored-reference.md) · TD-140 (the landmark confirmation)

---

## 1. Problem

Removing a place from a map is two entries in the popover — "Sposta nei luoghi
non posizionati" and "Rimuovi definitivamente" — and the DM has to know the
difference before clicking. What they described wanting is **one question asked
at one moment**: "this place is going away — do you mean off this map, or gone
for good?"

Underneath the wording there was a real disagreement about what "gone for good"
means. It means SPEC-010 rule 2: the place is deleted and its children move up
to the grandparent, losing their coordinates. The DM's phrasing — "cancelliamo
tutto" — could instead have described a **cascade**: the place and everything
under it. Those are different operations with different consequences, and the
app offered only the first while the confirmation dialog explained it in a
sentence most people will not read twice. **The DM settled it on 2026-09-24:
no cascade** (§5). What was left was the dialog.

## 2. Goal

Removing a place asks one question with clearly named outcomes, and "delete
everything" means what the DM expects it to mean.

## 3. Non-goals

- **Undo.** A delete stays irreversible; this spec makes the question clearer,
  not the action recoverable.
- **Deleting the root.** SPEC-010 rule 1 is unchanged: the world always exists.
- **Changing what unplacing does.** Unplacing already works and SPEC-017 already
  defines where the place goes. This spec only moves it into the same dialog.
- **Reassigning entities.** SPEC-010 rule 3 stands: an NPC whose place is deleted
  loses its location rather than being moved somewhere the DM did not choose.
- **A bulk "reset the geography" command.** Refused in SPEC-010 §4 and still refused.

## 4. User stories

- As a DM, I want one question when I remove a place, so that I do not have to
  remember which of two menu entries is the destructive one.
- ~~As a DM, I want "elimina definitivamente" to remove the branch I am pointing
  at, so that clearing out a region I have abandoned does not leave its contents
  scattered one level up.~~ **Not delivered, by decision (§5, 2026-09-24):** the
  contents do land one level up, in the unpositioned pool, and the dialog says so
  in advance rather than the DM discovering it afterwards. The story is what a
  cascade spec would be written from, if one ever is.
- As a DM, I want to be told exactly what will disappear before I confirm it, so
  that nothing a delete does is a surprise.

## 5. Behaviour

**Main flow**

1. The popover offers one destructive entry per place, "Rimuovi".
2. It opens a dialog that states the place's name and offers two outcomes as two
   explicit choices, not as a checkbox, and with neither preselected:
   - **Rimuovi dalla mappa** — the place keeps existing and returns to the
     unplaced pool (today's "Sposta nei luoghi non posizionati", unchanged).
   - **Elimina definitivamente** — the place is destroyed under SPEC-010 rule 2,
     unchanged: its children and landmarks move up to the grandparent and lose
     their position, and the entities assigned to it directly lose their
     location.
3. Each choice names its consequences before it is taken: how many children are
   affected and what happens to them, how many entities lose their location, how
   many landmarks are involved.
4. Confirming performs one transaction; cancelling changes nothing.

**The decision, made by the DM on 2026-09-24: option A — no cascade.**
"Elimina definitivamente" keeps meaning SPEC-010 rule 2, so the work this spec
asks for is the dialog and nothing else. A cascade (deleting the branch
recursively, deepest first, in one transaction) was the alternative and was
**rejected**: it makes a mis-click destroy a night's work irreversibly, and
keeping the children buys the DM a recovery path — they land in the
unpositioned pool, from which the picker can put them back. If the "it did not
do what I asked" feeling this spec's §1 predicted shows up in use, that is a
new spec with the counts and the recursion designed on purpose, not a widening
of this one.

What makes A survivable is the counts: the dialog says how many places move up
and where, and how many characters lose their location, before the outcome is
taken. Nothing is a surprise even though nothing cascades.

**Landmarks.** Parity already existed and was not a gap: the popover offered a
landmark its own unplace and its own delete, and TD-140 gave the delete a
confirmation. What this spec changes for a landmark is only that its two entries
become the same single question, worded for a landmark (which has no children,
so its dialog has two outcomes).

Its dialog states **no counts**, unlike a place's. A landmark has no children to
reparent, so there is nothing for the SPEC-010 impact query to count — and the
one figure that would mean something, how many characters are assigned there,
cannot be stated honestly today: `npc.poiId`/`deities.poiId` are
`onDelete: Restrict` and `deletePoi` detaches nobody, so deleting a landmark
somebody is standing at fails in the database rather than detaching them.
Filed as **TD-147**, whose fix needs a product decision of its own (does the
character fall back to the enclosing place, or lose its location?). When that
lands, the sentence to add here is a count, not a redesign.

**Edge cases**

| Situation                                 | Expected behaviour                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| The place has no children and no entities | The dialog still asks, with the counts reading zero rather than being hidden — the two outcomes still differ. |
| The place is the root                     | No destructive entry is rendered (SPEC-010 rule 1).                                                           |
| The place is already unplaced             | Reached from the pool, not the map: "Rimuovi dalla mappa" is not offered, only the delete.                    |
| A child is itself unplaced                | It stays and is reparented, like any other child, and is named in the counts.                                 |
| The transaction fails halfway             | Nothing is deleted; the dialog reports the failure with the shared error copy.                                |
| Two tabs delete the same place            | The second finds it gone and says so rather than throwing a raw Prisma error.                                 |

## 6. Data model changes

**None**, and none were needed for the rejected cascade either: it would have
been written in the application layer, in one transaction, exactly as
`deletePlace` already maintains ADR-0010's invariant across several writes.
Switching the foreign keys from `Restrict` to `Cascade` is **not** proposed,
then or now: `Restrict` is what makes an accidental delete impossible to perform
silently, and anything that removes a branch needs to count its rows before
removing them anyway.

## 7. Metadata changes

None. The dialog is a component concern; the counts come from the data layer.

## 8. Acceptance criteria

- [x] A place's popover has exactly one destructive entry.
- [x] Its dialog names the place and offers the agreed outcomes as separate,
      labelled choices.
- [x] The dialog states the number of children, landmarks and entities affected
      by the chosen outcome before it is confirmed. **For a place.** A landmark's
      dialog states no counts — see §5's landmark paragraph and TD-147.
- [x] "Rimuovi dalla mappa" behaves exactly as today's unplace, and the place
      appears in the unplaced pool afterwards.
- [x] "Elimina definitivamente" behaves as decided in §5, in one transaction.
- [x] Cancelling leaves every row unchanged.
- [x] Deleting the root is impossible from the UI and refused by the action.
- [x] A landmark's popover has one destructive entry with the same shape.
- [x] Both copies exist in `messages/it.json` and `messages/en.json`.
- [x] Every new mutation rejects an unauthenticated request. **No new mutation:**
      both outcomes call `deletePlace`/`unplacePlace`/`deletePoi`/`unplaceLandmark`
      as they stand, each of which already begins with `requireSession`.
- [x] Every new mutation rejects invalid input with field-level errors. Same
      answer: no new mutation, and the dialog's only input is which of two
      outcomes was picked.
- [x] Coverage has not dropped — 21 unit tests across the two dialogs' own
      suites, plus the popover's rewritten wiring tests.

## 9. Implementation plan

No data layer, no metadata, no mutation: option A means every write this needs
already exists. The whole change is which components ask, and how.

**The decisions taken while building it**

- **One dialog component serves both callers.** `DeletePlaceButton` was renamed
  `RemovePlaceDialog` (it has rendered a dialog and not a button since the
  2026-08-17 usability fix) and given an **optional** `onUnplace`. With it, the
  dialog asks the question; without it, it is the delete confirmation it always
  was. That is what the map's own "Elimina questa mappa" entry passes — it acts
  on the place you are standing inside, which has no marker on this map to take
  off it — and it is also the shape §5's "already unplaced" edge case asks for.
  Forking a second component would have duplicated the impact fetch, the
  mutation and the error handling to change a label.
- **Radios, not two buttons that act on click.** Two acting buttons inside a
  dialog are the two popover entries again, one layer down. Radios plus one
  confirm is what makes §5.4's "confirming performs one transaction" true, and
  nothing is preselected, so the destructive outcome is never one stray Return
  away.
- **One impact fetch feeds both outcomes.** The same `placeCount` that says what
  a delete scatters says what an un-place keeps. No second query.
- **The message namespace moved with the component**, `geography.deletePlace` →
  `geography.removePlace`, since it now names both outcomes and not just one.

**Open questions, answered**

- _Option A or B?_ **A** (§5).
- _Should the dialog list the affected places by name, or only count them?_
  **Count them**, as SPEC-010's dialog already did. Naming them means a second
  query and an unbounded list inside a small dialog; the count plus "under
  «parent»" is what makes the outcome predictable, and the pool lists them by
  name afterwards anyway.

## 10. Task breakdown

| Task | What                                                                                                                        | Status |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| T1   | Rename `DeletePlaceButton` → `RemovePlaceDialog` and its message namespace — pure rename, its own commit                    | ✅     |
| T2   | `RemovalOutcome` + `RemovalOutcomeChoices`, the two named choices as radios                                                 | ✅     |
| T3   | `RemovePlaceDialog`: optional `onUnplace`, the two outcomes, a consequence block each, confirm disabled until one is picked | ✅     |
| T4   | `RemoveLandmarkDialog`: the same question for a landmark, absorbing TD-140's confirmation                                   | ✅     |
| T5   | `PlacePopover`: one destructive entry per kind, wired to the dialog of that kind                                            | ✅     |
| T6   | Copy in `messages/it.json` and `messages/en.json`; the superseded popover keys removed                                      | ✅     |
| T7   | Unit tests for both dialogs and the popover's wiring; the seven e2e specs moved onto the new flow                           | ✅     |

## 11. Outcome

**Shipped 2026-09-24.** Four popover entries became two — one "Rimuovi" per
zone, one per landmark — each opening a dialog that names both outcomes and
confirms neither until one is chosen. A place's dialog carries the SPEC-010
counts under the destructive outcome and the same figures, read the other way
round, under the harmless one.

What it cost: no data-layer change, no migration, no new mutation. What it did
not fix: TD-147, found on the way — deleting a landmark somebody is assigned to
fails on a foreign key, which is why that dialog states no counts.

**If the cascade comes back**, it is a new spec, not an edit of this one: §5
records the rejection and the reason, and `CLAUDE.md`'s _Decisions and rejected
approaches_ carries the one-line version so it is not re-proposed from scratch.
