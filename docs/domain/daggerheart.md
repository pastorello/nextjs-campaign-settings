# Daggerheart — mechanics reference

The Daggerheart rules that [SPEC-018](../specs/018-game-systems.md)'s slices are
built against, restated in our own words. This file is the **structure** of the
game: its dice, its currencies, its numeric ladders and closed vocabularies. It
holds **no instances** — no class, subclass, ancestry, community, domain card,
adversary, environment, weapon, armor or loot entry from the SRD, not even by
name — and no SRD prose. Those are data the DM enters in the private database.
Why the line sits there is [`licensing.md`](./licensing.md) §5 and §7.

---

## Sources and versions

| Source                   | Version                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rules**                | Daggerheart SRD **2.0**, dated **2026-08-25** ([PDF](https://www.daggerheart.com/wp-content/uploads/2026/08/DH_SRD_2_2026_08_25.pdf), 224 pages). Read for this file on 2026-09-11; never committed.                                                                                                    |
| **Licence**              | Darrington Press Community Gaming License **2.0**, text marked "Last Updated 8/05/2026", posted on the [licence page](https://darringtonpress.com/license/) on 2026-08-26 ([PDF](https://darringtonpress.com/wp-content/uploads/2026/08/DPCGL_2.0_AUG_26_2026.pdf)).                                    |
| **What 2.0 adds on 1.0** | A tenth domain beyond the core set's nine, classes outside the core set, transformations (one optional card per character that pairs a benefit with a drawback), and a chapter of supplemental campaign mechanics (faction tracking among them). Only the first two touch SPEC-018's catalogues so far. |

The SRD's first page declares the whole document **Public Game Content** under
the DPCGL, _including_ the one campaign frame it contains — which the licence
text itself contradicts; [`licensing.md`](./licensing.md) §5 records how. Either
way it does not relax §7 rule 1: the shared sections hold the DM's own world,
whatever a licence would allow.

**Re-check when the SRD changes.** Every number in this file was read from 2.0.
A later SRD version is re-checked section by section against it, and the table
above is updated in the same change.

---

## 1. Action rolls — the Duality Dice

An action roll is two d12s of different colours, one for **Hope** and one for
**Fear**. Sum both, add the trait and any other modifier, and compare the total
with a **Difficulty** the GM sets (or a feature states). A roll is only called
for when the outcome is uncertain and failure is interesting.

The outcome has two independent axes — did the total reach the Difficulty, and
which die came up higher:

| Total vs Difficulty | Hope die higher                                                               | Fear die higher                                                               |
| ------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Meets or beats**  | Success with Hope: PC gains 1 Hope, players keep the spotlight                | Success with Fear: success at a cost, GM gains 1 Fear and takes the spotlight |
| **Falls short**     | Failure with Hope: minor consequence, PC gains 1 Hope, GM takes the spotlight | Failure with Fear: major consequence, GM gains 1 Fear and takes the spotlight |

**Matching dice are a critical success** whatever the total: an automatic
success with a bonus, 1 Hope gained, 1 Stress cleared, and critical damage if it
was an attack. A crit counts as "with Hope".

Variants on the same roll:

- **Reaction rolls** (avoiding or withstanding something) generate neither Hope
  nor Fear and cannot be helped. A crit on one only negates the effect.
- **Group action:** one PC leads; each helper makes a reaction roll, adding +1
  to the leader for each success and −1 for each failure.
- **Tag team:** once per session, each player may spend 3 Hope to have two PCs
  roll separately and keep one result for both. With Hope, every PC involved
  gains 1 Hope; with Fear, the GM gains 1 Fear per PC involved. On an attack,
  both damage rolls are summed into a single source.
- **Advantage / disadvantage** is one d6 added or subtracted. Never more than
  one die; advantages and disadvantages cancel one for one. The exception is
  _Help an Ally_: each helper rolls their own d6, and only the highest counts.

There is **no initiative and no fixed action economy**. The spotlight moves to
whoever the fiction or a triggered mechanic points at; a roll "with Fear" or a
failure hands it to the GM.

## 2. Hope and Fear — the two metacurrencies

|                      | **Hope** (per PC)                                                                                                       | **Fear** (GM)                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Start**            | 2 at character creation                                                                                                 | —                                                                                                                              |
| **Cap**              | 6                                                                                                                       | 12                                                                                                                             |
| **Between sessions** | Carries over                                                                                                            | Carries over                                                                                                                   |
| **Gained**           | Rolling with Hope; a crit                                                                                               | A PC rolling with Fear; 1d4 on a short rest; 1d4 + the number of PCs on a long rest                                            |
| **Spent on**         | Help an Ally (1); using an Experience (1 each); a tag team (3); Hope features — a **class** Hope feature always costs 3 | A GM move, or making one stronger; spotlighting each adversary after the first; Fear features; ending a temporary spell effect |

The Hope gained on a roll can be spent immediately on a Hope feature used by
that same action.

## 3. Levels and tiers

Ten levels in four tiers. The whole party levels together, when the GM judges a
narrative milestone has been reached — the SRD suggests roughly every three
sessions. There is no XP.

| Tier | Levels |
| ---- | ------ |
| 1    | 1      |
| 2    | 2–4    |
| 3    | 5–7    |
| 4    | 8–10   |

The tier is always derived from the level. It gates what a character can reach:

- **Equipment** — a character cannot equip a weapon or armor of a higher tier
  than their own. Adversaries and environments are tiered too, 1–4.
- **Domain cards** — each card has a level, 1–10; a character can only take
  cards at or below their level, from their class's **two** domains.
- **Advancements** — each level offers choices from the character's tier or
  below.

Each level-up, in order:

1. **Tier achievement**, at levels 2, 5 and 8 only: a new Experience at +2 and
   +1 Proficiency; at 5 and 8, the trait marks are also cleared.
2. **Two advancements** — +1 to two unmarked traits, an extra HP or Stress slot,
   +1 to two Experiences, an extra domain card, +1 Evasion, the next subclass
   card (foundation → specialization → mastery), or +1 Proficiency or a
   multiclass (these two cost both picks). Multiclassing opens at level 5, gives
   one of the new class's domains, and caps that domain's cards at half the
   character's level, rounded up.
3. **All damage thresholds +1.**
4. **A new domain card** at or below the new level.

**Loadout and vault.** At most five domain cards are active (the loadout); the
rest wait in the vault. Moving a card from vault to loadout mid-play costs its
**recall cost** in Stress; at the start of a rest it is free. Subclass,
ancestry, community and transformation cards never count toward the five.

A domain card has a **type**: ability (usually mundane), spell (magical) or
grimoire (a bundle of lesser spells; one domain only).

## 4. Damage, Hit Points and thresholds

Damage is never subtracted from a pool. It is sorted against two thresholds,
**Major** and **Severe**, and marks a fixed number of Hit Points:

| Final damage                           | HP marked |
| -------------------------------------- | --------- |
| 0 or less                              | 0         |
| Below Major                            | 1         |
| At or above Major, below Severe        | 2         |
| At or above Severe                     | 3         |
| At or above 2 × Severe (optional rule) | 4         |

The ladder only works if **Major < Severe**.

**Where thresholds come from.**

- **A PC:** the equipped armor's base Major and Severe, **plus the character's
  level**. Unarmored, Major equals the level and Severe twice the level. Any
  bonus from features stacks on top. Changing armor recalculates them.
- **An adversary:** stated directly on its stat block, as its HP is.

**Armor slots.** An armor's base **Armor Score** is how many Armor Slots it
gives. When hit, a PC may mark one slot to drop the damage one step down the
ladder (Severe → Major → Minor → nothing). Armor Score is capped at 12; at 0,
no slot can be marked. **Direct damage** cannot be reduced this way.

**HP and Stress.** A PC's starting HP and Evasion come from their class; every
class starts with 6 Stress slots. Both HP and Stress slots can grow to 12. Marking
the last HP means a **death move** (one final crit, or unconsciousness with a
risk of a permanent scar, or a Duality roll for everything). Marking the last
Stress makes the PC Vulnerable; Stress that must be marked but cannot becomes 1
HP instead.

**Rolling damage.**

- A damage expression is `dN+k`. For a **weapon**, the number of dice is the
  character's **Proficiency** (1 at level 1); the flat `k` is added once and is
  never multiplied. Unarmed is Proficiency × d4.
- Damage "using the Spellcast trait" rolls as many dice as the trait's value;
  at +0 or below, none.
- **Critical damage** adds the maximum the dice could show on top of the roll.
- Simultaneous damage from several sources is summed before the thresholds.
- Two **damage types**: physical and magic. Mundane weapons and unarmed deal
  physical; spells deal magic; only a character with a Spellcast trait can
  wield a magic weapon. **Resistance** halves damage of that type before the
  thresholds (it does not stack); **immunity** ignores it; damage that is both
  types is only resisted by a creature resistant to both.

**Evasion vs Difficulty.** A roll against a PC uses the PC's **Evasion** as its
Difficulty. A roll against an adversary uses the adversary's **Difficulty**.

## 5. Encounters — Battle Points

The GM budgets a fight in **Battle Points**:

**Budget** = 3 × the PCs in the fight + 2, then adjusted:

| Adjustment                                              | Points |
| ------------------------------------------------------- | ------ |
| An easier or shorter fight                              | −1     |
| Two or more Solo adversaries                            | −2     |
| Every adversary's damage boosted by +1d4 (or a flat +2) | −2     |
| An adversary from a lower tier                          | +1     |
| No Bruiser, Horde, Leader or Solo in the fight          | +1     |
| A harder or longer fight                                | +2     |

**Cost per adversary, by type:**

| Cost | Adversary type                                                 |
| ---- | -------------------------------------------------------------- |
| 1    | Social, Support; or one group of Minions as large as the party |
| 2    | Horde, Ranged, Skulk, Standard                                 |
| 3    | Leader                                                         |
| 4    | Bruiser                                                        |
| 5    | Solo                                                           |

The table covers all ten adversary types. **Minions** alone are priced per
group rather than per creature, which is why a Minion group is sized by the
party.

An adversary has **actions**, **reactions** and **passives**; some of them are
**Fear features**, which cost the GM Fear to use. An adversary's stat block also
lists motives and tactics, a Difficulty, thresholds, HP, Stress, an attack
modifier, one standard attack and its Experiences. Adversaries marking their
last HP are defeated — however the table narrates it.

Environments are the other GM-side stat block: tiered, typed as **exploration,
social, traversal** or **event**, with a Difficulty and their own features.

## 6. Gold

Wealth is abstract, counted in three denominations:

| Unit      | Worth                                        |
| --------- | -------------------------------------------- |
| 1 bag     | 10 handfuls                                  |
| 1 chest   | 10 bags                                      |
| 1 handful | 10 coins — only under the optional coin rule |

A character carries at most **one chest**. A tenth handful becomes a bag and the
handfuls are erased; a tenth bag becomes the chest the same way. With every
slot full, gold must be spent or stored somewhere before more can be taken.
Prices are the GM's to set; the SRD offers a reference scale in which equipment
cost climbs with its tier. Tables that prefer not to track gold at all let the
PCs pick from a short list when shopping.

## 7. Other vocabularies the catalogues use

- **Traits (six):** Agility, Strength, Finesse, Instinct, Presence, Knowledge.
  A weapon names the one it attacks with; a subclass may name one as its
  **Spellcast** trait.
- **Ranges:** Melee, Very Close, Close, Far, Very Far — and Out of Range, which
  cannot be targeted. A stated range is a maximum.
- **Weapon:** primary or secondary (at most one of each equipped); **burden** 1
  or 2 hands, and a character's equipped weapons never exceed 2 hands in total. An equipped weapon
  can be thrown at Very Close range with Finesse.
- **Subclass cards:** foundation, specialization, mastery — taken in that order.
- **Loot:** items and consumables, each with a rarity — common, uncommon, rare,
  legendary.
- **Rests:** short or long, each letting every PC make two downtime moves. After
  three short rests in a row, the next must be long.

## 8. Invariants a schema can rely on

Facts of the rules, not product decisions — what a validator can safely
enforce:

- Level ∈ 1–10; tier ∈ 1–4, and the tier of a level is the table in §3.
- Hope ∈ 0–6; Fear ∈ 0–12; HP slots, Stress slots and Armor Score ≤ 12.
- A class has exactly two **distinct** domains.
- A domain card's recall cost is a Stress count, ≥ 0.
- Major < Severe, for adversaries and for armor bases alike.
- Adversary types are the ten of §5; environment types the four of §5; traits
  the six of §7; damage types two.
- A class Hope feature always costs 3 Hope, so the cost needs no column.
