# Campaign design method

How this DM designs and runs a long campaign. This is **reference**, not product:
it describes the working method the app has to serve, so that
[`SPEC-013`](../specs/013-campaign-management.md) can describe what we build
without re-arguing the method inside the spec.

Distilled 2026-08-18 from the DM's own campaign spreadsheet — twenty sheets,
~700 rows, one campaign ("L'Ultimo Crepuscolo del Ferro") designed to completion
and played through the fourth of its twenty adventures. **The spreadsheet is the
source of the method, not of data to migrate**; see SPEC-013 §3.

---

## 1. The unit hierarchy

```
campaign                  one storyline, authored inside the DM's one universe
 └─ adventure             one per character level — 20 of them, played in order
     └─ scene             one beat: a fight, an exploration, a clue, a goal, a rest
         └─ creature      the monsters that beat puts on the table
         └─ treasure      what that beat gives up
```

An **adventure** is the unit of design. It is written as a whole before it is
played, it targets exactly one character level, and it carries its own pacing
budgets (§3). The party's level _is_ the adventure they are on.

A **scene** is the unit of play. It is what the DM ticks off at the table.

Nothing in this hierarchy is a rules concept. It is an authoring structure, and
it holds regardless of which system the campaign is run in.

## 2. Scene kinds

Six kinds, and the distinction matters because they pace differently — an
adventure made only of `fight` is a bad adventure:

| Kind      | What it is                                                                 |
| --------- | -------------------------------------------------------------------------- |
| `fight`   | A combat encounter. Carries creatures.                                     |
| `explore` | A place or situation the party investigates. May carry creatures, or none. |
| `clue`    | A discovery that unlocks understanding rather than territory.              |
| `goal`    | A milestone: the thing the adventure was about, now achieved.              |
| `dungeon` | A bounded location run as a sequence — the header of a set of scenes.      |
| `break`   | Downtime between beats: travel, funerals, a village rebuilding, rumours.   |

**Every scene happens somewhere,** and the DM writes that place as a numbered map
reference (`01A - Torrerossa`, `04D - Fogne di Skreebars` — the number is the
adventure, the letter the map within it). In the app this is not a string: it is
the place in the world tree, which already carries the map image.

**Creatures belong to the scene above them**, which in a spreadsheet is true only
by row position. Made explicit, it is a parent/child relation with an order.

## 3. Pacing budgets

The DM designs an adventure against four targets, set per adventure and checked
while writing it:

| Budget          | What it counts                                                           |
| --------------- | ------------------------------------------------------------------------ |
| Experience      | Total XP the adventure hands out.                                        |
| Currency        | Total value of non-magical wealth to be found.                           |
| Permanent items | How many lasting magic items the party should come away with.            |
| Consumables     | How many single-use items (potions, scrolls) they should come away with. |

The last three come from a habit the DM brought from Pathfinder 2, whose GM
guidance publishes, per level, how much wealth and how many permanent and
consumable items a party is expected to acquire. **The concept transfers; the
numbers do not** (§5). What the DM needs from a tool is not the table — it is the
running comparison, and it has three terms, not two:

- **target** — what this level is supposed to yield (the DM sets it),
- **assigned** — what the DM has actually written into the adventure's scenes,
- **found** — what the party actually walked away with.

`target − assigned` is a _design_ question, answered while writing: what is left
to place. `assigned − found` is a _play_ question, answered afterwards: what they
missed, and therefore what has to reach them another way. Collapsing the two into
one number loses the reason the DM tracks them at all.

**The last three budgets are disjoint inventories, not three views of one
number.** A magic item counts against the permanent or consumable target and its
worth never enters the currency total; a non-magical valuable — a coin, an art
object, a gem — counts against the currency total and nothing else. The DM's
spreadsheet is consistent on this across every adventure: a jade pendant worth 80
sits in the silver column with no item count beside it, while a magic powder sits
in the consumable column with no value beside it. A haul containing both is two
rows.

**Currency has one scale and two names.** The DM reasons in silver through the
early levels — the campaign is poor and silver is the people's coin — and in gold
from level 8. Ten silver to the gold, in both the system the campaign came from
and the one the app targets, so this is a label on a single scale rather than two
units to reconcile.

A fifth budget is narrative rather than material: roughly a dozen beats per
adventure award a **hero point** (a metacurrency the party spends to reroll).
Being a count of scenes, it is derived, not stored — the DM's spreadsheet kept it
by hand and it had already drifted by one in the second adventure.

## 4. Tracking play

Two marks, kept independently per row, and independent for a reason:

- **experience awarded** — the beat was played and the XP handed out;
- **treasure taken** — the party actually found and kept that loot.

They diverge constantly: a party can win a fight and never search the room. The
gap between them is the number the DM's spreadsheet computed as _loot non
goduto_, and it is what tells them how much wealth to route back in later.

Both are recorded **at the table, mid-session**, not filled in afterwards.

## 5. Planned events

The DM plans a campaign partly as a calendar: what the antagonists do on each
day, in parallel with whatever the party is doing. The first adventure of the
spreadsheet is written this way — dated entries for the witch's plan, the
smugglers' shipment, the boat's arrival — and the technique is deliberate, not
incidental: it is what makes the world act rather than wait.

Distinct from, and a precursor to, a **session diary** — a record of what
actually happened, written after play. That is a separate future feature; this
file records only that the two are different things.

## 6. What is system-specific

The method above is agnostic. Three things in the DM's spreadsheet are not, and
must not be copied into a D&D 5e app as though they were:

1. **Creature XP by level** — PF2 derives an encounter's XP from each creature's
   level relative to the party's. 5e uses challenge rating and a different
   budget maths entirely.
2. **Encounter difficulty budgets** — same reason.
3. **Wealth and item counts by level** — the per-level targets of §3 are PF2's
   numbers, and 5e's treasure guidance is not comparable.

The app therefore stores these as **authored values**: numbers the DM types,
which the app totals and compares. It computes no encounter difficulty and
derives no budget from any system's tables. Should a 5e budgeting helper ever be
wanted, it belongs in its own domain file and its own spec, built from the SRD
5.1, and it stays optional — see [`README.md`](./README.md) on sources.

No rulebook text from either system is reproduced here, and none should be added.
