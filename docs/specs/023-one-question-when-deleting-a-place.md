# SPEC-023: One question when deleting a place

- **Status:** Draft — needs the DM's agreement, and §5 carries a decision only they can make
- **Date:** 2026-09-22
- **Phase:** 4
- **Related:** [SPEC-010](./010-deleting-a-place.md) (the delete rules this spec revisits) · [SPEC-016](./016-place-popover.md) (T5 unplace, T6 delete, T7 landmark delete) · [SPEC-017](./017-one-unplaced-pool.md) (where an unplaced place goes) · [ADR-0010](../adr/0010-entity-location-as-stored-reference.md) · TD-140 (the landmark confirmation)

---

## 1. Problem

Removing a place from a map is two entries in the popover — "Sposta nei luoghi
non posizionati" and "Rimuovi definitivamente" — and the DM has to know the
difference before clicking. What they described wanting is **one question asked
at one moment**: "this place is going away — do you mean off this map, or gone
for good?"

Underneath the wording there is a real disagreement about what "gone for good"
means. Today it means SPEC-010 rule 2: the place is deleted and its children
move up to the grandparent, losing their coordinates. The DM's phrasing —
"cancelliamo tutto" — describes a **cascade**: the place and everything under it.
Those are different operations with different consequences, and the app currently
offers only the first while the confirmation dialog explains it in a sentence
most people will not read twice.

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
- As a DM, I want "elimina definitivamente" to remove the branch I am pointing
  at, so that clearing out a region I have abandoned does not leave its contents
  scattered one level up.
- As a DM, I want to be told exactly what will disappear before I confirm it, so
  that a cascade is never a surprise.

## 5. Behaviour

**Main flow**

1. The popover offers one destructive entry per place, working name "Rimuovi".
2. It opens a dialog that states the place's name and offers two outcomes as two
   explicit choices, not as a checkbox:
   - **Rimuovi dalla mappa** — the place keeps existing and returns to the
     unplaced pool (today's "Sposta nei luoghi non posizionati", unchanged).
   - **Elimina definitivamente** — the place is destroyed. What that takes with
     it is the decision below.
3. Each choice names its consequences before it is taken: how many children are
   affected and what happens to them, how many entities lose their location, how
   many landmarks are involved.
4. Confirming performs one transaction; cancelling changes nothing.

**The decision this spec cannot make for the DM.** "Elimina definitivamente" is
one of two operations:

| Option                               | What happens to the children                                                            | Cost and consequence                                                                                                                                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A — keep SPEC-010 rule 2** (today) | Move up to the grandparent, unpositioned, and survive.                                  | Nothing to build beyond the dialog. Deleting a region leaves its towns in the unplaced pool, which the DM reads as "it did not do what I asked".                                                                                     |
| **B — cascade**                      | Deleted with the place, recursively, along with their landmarks and their own children. | `zone.parent` and `poi.zone` are `onDelete: Restrict`, so the recursion is written by hand in one transaction, deepest first. Entities under the whole branch lose their location. A mis-click destroys a night's work irreversibly. |

If **B** is chosen, the dialog must count the branch before asking — "Skreebars
and the 14 places inside it, 9 landmarks, 23 characters lose their location" —
and B does not replace A: the dialog offers both, since "just this place, keep
what is inside it" stays a thing a DM wants. That makes three outcomes, and
whether three is one question too many is itself worth the DM's opinion.

**Landmarks.** Parity already exists and is not a gap: the popover offers a
landmark its own unplace and its own delete, and TD-140 gave the delete a
confirmation. What this spec changes for a landmark is only that its two entries
become the same single question, worded for a landmark (which has no children, so
its dialog has two outcomes whatever is decided above).

**Edge cases**

| Situation                                 | Expected behaviour                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| The place has no children and no entities | The dialog still asks, with the counts reading zero rather than being hidden — the two outcomes still differ. |
| The place is the root                     | No destructive entry is rendered (SPEC-010 rule 1).                                                           |
| The place is already unplaced             | Reached from the pool, not the map: "Rimuovi dalla mappa" is not offered, only the delete.                    |
| A child is itself unplaced                | Under option B it is deleted with the branch; under A it stays, reparented. Named in the counts either way.   |
| The transaction fails halfway             | Nothing is deleted; the dialog reports the failure with the shared error copy.                                |
| Two tabs delete the same place            | The second finds it gone and says so rather than throwing a raw Prisma error.                                 |

## 6. Data model changes

None under option A. None under option B either — a cascade is written in the
application layer, in one transaction, exactly as `deletePlace` already
maintains ADR-0010's invariant across several writes. Switching the foreign keys
from `Restrict` to `Cascade` is **not** proposed: `Restrict` is what makes an
accidental delete impossible to perform silently, and the recursion needs to
count rows before it removes them anyway.

## 7. Metadata changes

None. The dialog is a component concern; the counts come from the data layer.

## 8. Acceptance criteria

- [ ] A place's popover has exactly one destructive entry.
- [ ] Its dialog names the place and offers the agreed outcomes as separate,
      labelled choices.
- [ ] The dialog states the number of children, landmarks and entities affected
      by the chosen outcome before it is confirmed.
- [ ] "Rimuovi dalla mappa" behaves exactly as today's unplace, and the place
      appears in the unplaced pool afterwards.
- [ ] "Elimina definitivamente" behaves as decided in §5, in one transaction.
- [ ] Cancelling leaves every row unchanged.
- [ ] Deleting the root is impossible from the UI and refused by the action.
- [ ] A landmark's popover has one destructive entry with the same shape.
- [ ] Both copies exist in `messages/it.json` and `messages/en.json`.
- [ ] Every new mutation rejects an unauthenticated request.
- [ ] Every new mutation rejects invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Fill in after the sections above are agreed._

**Open questions for the DM**

- Option A or option B — and if B, are three outcomes acceptable, or does
  "elimina definitivamente" simply become the cascade with no third choice?
- Should the dialog list the affected places by name, or only count them?

## 10. Task breakdown

_Fill in after §9._

## 11. Outcome

_Fill in at close._
