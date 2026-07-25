# D&D 5e combat — mechanics reference

- **Status:** 🚧 Stub — to be filled from a research pass (Cowork/Chat over the SRD 5.1)
- **Source:** restate from the SRD 5.1 (Creative Commons). Mechanics only, no rulebook prose.
- **Used by:** [`docs/specs/001-combat-tracker.md`](../specs/001-combat-tracker.md)

> This file is a **skeleton**. Each section names what belongs in it so a
> research session knows exactly what to produce. Fill it with the rules
> restated in plain words — turn order, action economy, dice — not manual text.
> Keep it to what a combat-tracker feature actually needs; this is not a rules
> compendium.

---

## 1. Terminology

The handful of terms the UI and the code will use, each defined in one line so
identifiers and labels stay consistent. Candidates: initiative, round, turn,
action, bonus action, reaction, movement, AC (armour class), HP (hit points),
saving throw, ability check, condition, advantage/disadvantage.

## 2. The combat round

How a round is structured and how it ends. What "initiative order" means and how
ties are handled. The distinction between a _round_ (everyone acts once) and a
_turn_ (one combatant's slice).

## 3. Initiative

How initiative is rolled and ordered. What determines the sequence, and whether
it is rolled once per combat or re-rolled. Enough to drive a turn queue.

## 4. Action economy

What a combatant may do on their turn: one action, one bonus action, one
reaction (off-turn), plus movement. The rule the tracker must enforce — you
cannot spend the same slice twice.

## 5. Dice mechanics

The `NdM+mod` notation and how a roll resolves. Advantage / disadvantage (roll
two d20, take higher / lower). Where modifiers come from at a high level. This is
the section the automatic dice roller is built directly against — be precise
about inputs and outputs, since it becomes a pure function with unit tests.

## 6. Hit points and damage

Tracking HP down from a maximum, what 0 HP means, and how healing works at the
level the tracker needs to display and mutate.

## 7. Conditions

The status effects a tracker should be able to attach to a combatant
(e.g. prone, poisoned, stunned) and, briefly, what each changes. A list plus a
one-line effect each — not the full text.

## 8. What a combat tracker needs, and what it does not

A short boundary: the subset of the above that a turn-and-dice tracker must
model, versus the rules that are out of scope (spell resolution, the full
condition catalogue, encounter balancing). Keeps the feature from swelling into
a rules engine.
