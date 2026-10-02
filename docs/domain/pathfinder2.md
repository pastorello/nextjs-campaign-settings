# Pathfinder Second Edition — mechanics reference

The Pathfinder 2e rules that a future PF2 spec (a sibling of
[SPEC-018](../specs/018-game-systems.md)'s Daggerheart slices) will be built
against, restated in our own words. This file is the **structure** of the game:
its action economy, its numeric ladders and its closed vocabularies. It holds
**no instances** — no class, ancestry, feat, spell, creature or item from any
book, not even by name — and no rulebook prose. Those are data the DM enters in
the private database. Why the line sits there is
[`licensing.md`](./licensing.md) §4 and §7.

**Status: a skeleton.** Nothing below has been checked against the wiki yet.
The headings say what each section is for; the figures come from general
knowledge of the system and carry a `verify` marker until a spec needs them and
someone reads the matching wiki page. Do not build against a `verify` figure.

---

## Sources and versions

| Source      | Version                                                                                                                                                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rules**   | [Golarion Insider](https://pf2.altervista.org/wiki/Pagina_principale), the Italian community wiki for Pathfinder Second Edition (main page read 2026-10-02; nothing else yet). It lists Rules, Classes, Skills, Equipment, Magic, Game Master and Bestiary sections.       |
| **Edition** | The wiki's main page does not say whether it follows the Remaster. **Unverified** — settle it before relying on any number, because the Remaster changed names and some values.                                                                                            |
| **Licence** | The wiki states its own terms (Paizo's Community Use Policy and the OGL). Those are the volunteers' terms to Paizo, not a licence to this repository — [`licensing.md`](./licensing.md) §4 records why. Rules content is ORC (Remaster) or OGL 1.0a (older), per §4 there. |

**Use the wiki as a terminology and lookup reference, never as a source to
copy.** Its text is Paizo's or its volunteers'; restate mechanics here, and
never mirror or paste pages. The Italian terms the UI will need belong in
`messages/it.json`, not in this file.

**Re-check when the source changes.** Any figure read from the wiki records the
page and the date next to it.

---

## 1. The three-action economy `verify`

A creature's turn gives it three actions and one reaction (per round). An
activity can cost one, two or three actions; some are free. Nothing carries
over between turns.

What a schema can rely on: an action cost is one of a closed set (free,
reaction, 1, 2, 3 actions) — the same shape SPEC-018's closed vocabularies use.

## 2. Degrees of success `verify`

A check compares a d20 plus modifiers to a difficulty class and lands in one of
four degrees: critical failure, failure, success, critical success. Beating or
missing the DC by 10 moves the degree one step, and a natural 20 or 1 moves it
one step more.

## 3. Levels and proficiency `verify`

Characters, creatures, hazards and items all have a **level**, 1–20 for
characters (creatures run from −1 up). A proficiency bonus is the character's
level plus a rank bonus (untrained, trained, expert, master, legendary); an
untrained character adds no level.

## 4. Traits and rarity `verify`

Almost everything carries **traits** (a closed, growing vocabulary) and one
**rarity**: common, uncommon, rare, unique. Rarity gates availability, which is
what a catalogue field needs to store.

## 5. Encounters — XP budgets `verify`

The system's difficulty model is a budget, like Daggerheart's Battle Points:

- the party's level and size set a budget in five bands (trivial, low,
  moderate, severe, extreme);
- each creature costs XP according to its level **relative to the party's**;
- the budget is adjusted when the party is larger or smaller than four.

The figures — the band budgets, the cost per level difference and the per-
character adjustment — are deliberately not written here until they are read
from the wiki. SPEC-031's encounter summary for 5e is the shape to mirror once
they are.

## 6. Treasure `verify`

Treasure is given per level on a schedule (permanent items by level, plus
currency). **Not started.** The adventure-path method transfers to 5e; the XP and
treasure maths of the Pathfinder spreadsheet it came from do not.

---

## Not in this file

Conditions, the skill list, class features, spell lists and the bestiary.
Nothing in the app needs them as structure; where one does, add a section with
its page and date, as above.
