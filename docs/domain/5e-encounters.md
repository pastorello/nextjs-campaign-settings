# D&D 5e — encounter difficulty reference

The 5e rules that [SPEC-031](../specs/031-encounter-builder.md)'s encounter
summary is built against, restated in our own words: how much XP a creature is
worth for its challenge rating, and how much XP a party can face before a
fight becomes low, moderate or high difficulty. It holds **no instances** — no
creature from the SRD, not even the ones its worked examples use — and no SRD
prose. Creatures, with their challenge and XP, are data the DM enters on a
fight's rows. Why the line sits there is [`licensing.md`](./licensing.md) §3
and §7.

---

## Sources and versions

| Source      | Version                                                                                                                                                                                                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rules**   | System Reference Document **5.2.1** (the 2024 rules), [PDF](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf), 364 pages. Read for this file on 2026-10-02; never committed. §1 is from _Monsters_ ("Experience Points", p. 256); §2–§3 from _Gameplay Toolbox_ ("Combat Encounters", pp. 202–203). |
| **Licence** | Creative Commons Attribution 4.0 International ([CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode)). The attribution statement is below and in the repository's [`NOTICE.md`](../../NOTICE.md).                                                                                                            |

**Re-check when the SRD changes.** Every number in this file was read from
5.2.1, by extracting the PDF's text and comparing it cell by cell, not
recalled. A later SRD version is re-checked table by table against it, and the
table above is updated in the same change.

**Attribution.** The tables in §1 and §2 are SRD material, and so is the code
that restates them ([`encounterBudget.ts`](../../app/lib/config/dnd5e/encounterBudget.ts)).
Wherever they are used, the licence asks for this statement and no other
attribution to Wizards:

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

---

## 1. A creature's XP — set by its challenge rating

Every creature has a **challenge rating** (CR): a rough measure of the threat
it poses to a group of four characters whose level equals it. The CR is one of
34 values — **0, 1/8, 1/4, 1/2**, then every whole number from **1 to 30** — and
fixes the XP the creature is worth:

| CR  | XP      | CR  | XP     | CR  | XP      |
| --- | ------- | --- | ------ | --- | ------- |
| 0   | 0 or 10 | 10  | 5,900  | 21  | 33,000  |
| 1/8 | 25      | 11  | 7,200  | 22  | 41,000  |
| 1/4 | 50      | 12  | 8,400  | 23  | 50,000  |
| 1/2 | 100     | 13  | 10,000 | 24  | 62,000  |
| 1   | 200     | 14  | 11,500 | 25  | 75,000  |
| 2   | 450     | 15  | 13,000 | 26  | 90,000  |
| 3   | 700     | 16  | 15,000 | 27  | 105,000 |
| 4   | 1,100   | 17  | 18,000 | 28  | 120,000 |
| 5   | 1,800   | 18  | 20,000 | 29  | 135,000 |
| 6   | 2,300   | 19  | 22,000 | 30  | 155,000 |
| 7   | 2,900   | 20  | 25,000 |     |         |
| 8   | 3,900   |     |        |     |         |
| 9   | 5,000   |     |        |     |         |

**CR 0 has two values.** The table gives "0 or 10" and says no more; which one
applies is written in each creature's own statistics. So a CR alone cannot
determine a CR 0 creature's XP — the DM types it. (In 5.2.1's own creatures,
CR 0 is mostly 10 XP: 27 of the 30 CR 0 statistics blocks say 10, three say
0.)

A creature's XP is what it is worth for being defeated or otherwise dealt
with, and also what it costs in an encounter budget (§2). A creature's
statistics state its XP alongside its CR; when the two disagree — a weakened
villain — the creature's own XP is the one that counts.

## 2. An encounter's difficulty — an XP budget per character

Difficulty has three named grades:

- **Low** — a scare or two; the characters should win without anyone falling,
  though some may spend healing.
- **Moderate** — without healing and other resources it could go badly; a
  weaker character may drop, and a death is possible but unlikely.
- **High** — potentially lethal for one or more characters; winning needs good
  tactics and some luck.

The budget for a grade is the **per-character XP** for the party's level,
**times the number of characters**:

| Party level | Low   | Moderate | High   |
| ----------- | ----- | -------- | ------ |
| 1           | 50    | 75       | 100    |
| 2           | 100   | 150      | 200    |
| 3           | 150   | 225      | 400    |
| 4           | 250   | 375      | 500    |
| 5           | 500   | 750      | 1,100  |
| 6           | 600   | 1,000    | 1,400  |
| 7           | 750   | 1,300    | 1,700  |
| 8           | 1,000 | 1,700    | 2,100  |
| 9           | 1,300 | 2,000    | 2,600  |
| 10          | 1,600 | 2,300    | 3,100  |
| 11          | 1,900 | 2,900    | 4,100  |
| 12          | 2,200 | 3,700    | 4,700  |
| 13          | 2,600 | 4,200    | 5,400  |
| 14          | 2,900 | 4,900    | 6,200  |
| 15          | 3,300 | 5,400    | 7,800  |
| 16          | 3,800 | 6,100    | 9,800  |
| 17          | 4,500 | 7,200    | 11,700 |
| 18          | 5,000 | 8,700    | 14,200 |
| 19          | 5,500 | 10,700   | 17,200 |
| 20          | 6,400 | 13,200   | 22,000 |

**Building to a grade:** add each creature's XP (§1), one per creature —
three of the same creature cost three times its XP — and spend as much of the
chosen grade's budget as possible without going over. Leaving a little unspent
is fine.

The SRD's method is a **builder**: pick a grade, then spend up to it. Reading it
backwards — given a fight, which grade is it? — is the app's use (SPEC-031 §5.B)
and is our derivation, not an SRD rule: a fight's total XP at or under the low
budget is low, over low up to moderate is moderate, over moderate up to high is
high, and over high is beyond the table. 5.2.1 applies no multiplier for the
number of creatures, so a fight's XP is the plain sum.

Worked example (numbers only): four level-1 characters have a low budget of
50 × 4 = 200 XP. One CR 1 creature (200 XP) spends it exactly; six CR 1/8
creatures (25 XP each, 150 XP) leave 50 unspent.

## 3. Caveats the SRD attaches

None of these change the arithmetic; they are why the result is a guide, not a
verdict.

- **Many creatures.** More than about two creatures per character raises the
  chance of a lucky streak dealing unexpected damage; such fights should
  include creatures that drop quickly, especially at levels 1–2.
- **CR 0 creatures** — especially the 0 XP ones — are for sparing use; many of
  them are better run as one swarm.
- **A creature whose CR is above the party's level** can take a character out
  with a single action, whatever the budget says.
- **Adjusting on the fly is expected.** A player's absence may call for
  removing creatures to hold the intended grade, and a fight can be eased
  (creatures flee) or hardened (reinforcements arrive) as it runs. SPEC-031's
  on-the-fly party size and counts are this caveat made into controls.
- **Stat blocks.** Fights that need more than two or three different
  creatures' statistics at once are hard to run.

---

No SRD prose is reproduced here, and none should be added. The two tables are
the SRD's numbers; everything else is a restatement.
