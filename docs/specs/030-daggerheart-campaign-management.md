# SPEC-030: Daggerheart — campaign management

- **Status:** Draft, 2026-09-30. Written by Claude from SPEC-018 §6 and §9, for the DM to review. Two questions are open (§9); the first is the decision SPEC-018 reserved for this slice.
- **Date:** 2026-09-30
- **Phase:** 4
- **Related:** [SPEC-018](./018-game-systems.md) T8 (§6 "what a Daggerheart campaign counts … is decided in its own slice"; §9 on reversing the authored-values rule) · [SPEC-013](./013-campaign-management.md) (campaign → adventure → scene, the 5e counting this slice parallels) · [`campaign-design-method.md`](../domain/campaign-design-method.md) §6 (the authored-values rule) · [`daggerheart.md`](../domain/daggerheart.md) §3, §5, §6 · [SPEC-028](./028-daggerheart-adversaries-and-environments.md) and [SPEC-029](./029-daggerheart-weapons-armor-and-loot.md) (the catalogues a scene draws on; both are prerequisites)

---

## 1. Problem

A Daggerheart campaign exists (SPEC-018 T3), but its adventures and scenes
count in 5e's terms:

- an XP target, and XP awarded per scene;
- creatures priced in XP each;
- currency in silver;
- loot drawn from the 5e magic items and treasure catalogue;
- a "hero point" flag.

Daggerheart has none of these. The party levels up at narrative milestones,
fights are budgeted in Battle Points, gold is handfuls, bags and chests, and
loot comes from SPEC-029's catalogue.

## 2. Goal

A campaign under `daggerheart` plans its adventures in Daggerheart's own terms:
milestones instead of XP, fights built against a Battle Point budget from
SPEC-028's adversaries, gold targets in Daggerheart's denominations, and loot
from SPEC-029's catalogues. A 5e campaign is unchanged.

## 3. Non-goals

- **Running the fight**: no Fear pool, no HP, no initiative (`CLAUDE.md`,
  2026-09-22). The encounter builder stays because it is prep.
- **Characters.** The party is a size (`campaign.partySize`), as in SPEC-013.
- **Converting a campaign between systems.** A campaign's system is fixed at
  creation (SPEC-018 T3).
- **Environments on scenes.** A scene has a place, and an environment has
  places (SPEC-028), so a scene at a place can already show that place's
  environments. A direct scene → environment link is a later change if that
  is not enough.

## 4. User stories

- As a DM running a Daggerheart campaign, I want to mark the scenes after which
  the party levels up, so that the adventure's target level is planned rather
  than guessed.
- As a DM, I want to build a fight from my adversaries and see it against its
  Battle Point budget, so that I know before the session whether it is easy or
  deadly.
- As a DM, I want to hand out gold and loot in Daggerheart's own units and
  items, and tick them off when they are taken, as I do for 5e.

## 5. Behaviour

**Under `daggerheart`, compared with SPEC-013's 5e pages:**

| SPEC-013 (5e)                                 | Daggerheart                                                                                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adventure: XP target                          | Hidden. The adventure keeps its target level (1–10) and shows its tier (`daggerheart.md` §3)                                                                          |
| Scene: XP award, "awarded"                    | **Milestone**: a scene may be marked as the one after which the party levels up, and ticked when played. The adventure totals planned and reached milestones          |
| Scene: grants a hero point                    | Hidden                                                                                                                                                                |
| Fight scene: creatures with level and XP each | **Adversaries** from SPEC-028, each row an adversary and a quantity (a Minion row is a group). Each row costs Battle Points by the adversary's type                   |
| —                                             | **Budget**: 3 × party size + 2, plus the adjustments the DM ticks from `daggerheart.md` §5's list. Shown as spent / budget, like SPEC-013's totals                    |
| Currency target and loot values in silver     | **Gold** in handfuls, shown as chests, bags and handfuls (10 : 1), with coins only if the optional rule is on                                                         |
| Loot: magic item or treasure link             | Loot: a SPEC-029 weapon, armor or loot link, or free text. Items and consumables count toward the adventure's two targets, as 5e's permanent items and consumables do |

- **How Battle Points are counted** is open question 1 (§9). The table above
  assumes the draft's proposal: computed.
- A creature row may still link an NPC as well as an adversary, so a named
  villain keeps their world record.
- Every other part of SPEC-013 (adventure order, status, scenes and their kinds,
  places, the calendar links) is the same under both systems.

**Edge cases**

| Situation                                              | Expected behaviour                                                                                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| An adversary a scene uses is deleted                   | The row keeps its name and quantity and loses the link, and so its cost (`SetNull`, like SPEC-013's NPC link). The scene shows it as unpriced |
| An adversary of a lower tier than the adventure's      | Allowed. With a computed budget, the matching +1 adjustment (§5's list) is suggested, never applied silently                                  |
| Party size changed after fights were built             | Budgets recompute; nothing stored changes                                                                                                     |
| A 5e campaign                                          | Exactly as today: no Daggerheart field is shown or stored                                                                                     |
| A 5e field on a Daggerheart scene through a stale form | Refused by validation: the scene's campaign decides which fields exist                                                                        |

## 6. Data model changes

```prisma
// proposed — additive; every 5e column stays as it is
model scene {
  // ...existing
  milestone         Boolean  @default(false)
  battleAdjustments String[] // keys of daggerheart.md §5's adjustment list
}

model sceneCreature {
  // ...existing (name, quantity, npcId, awarded)
  dhAdversaryId Int?
  dhAdversary   dhAdversary? @relation(fields: [dhAdversaryId], references: [id], onDelete: SetNull)
}

model loot {
  // ...existing
  dhWeaponId Int?  // SetNull
  dhArmorId  Int?  // SetNull
  dhLootId   Int?  // SetNull
  gold       Int?  // in handfuls (coins when the rule is on: see §9)
}

model adventure {
  // ...existing
  goldTarget Int?  // in handfuls
}
```

- **New columns rather than reusing 5e's.** `loot.value` and
  `adventure.currencyTarget` are silver by SPEC-013's counting rule. Giving them
  a second unit that depends on the campaign's system is the kind of implicit
  meaning `CLAUDE.md`'s string-keyed warnings are about. The cost of separate
  columns is a few nulls per row.
- **A loot row links at most one catalogue record** (CHECK across the five link
  columns).
- Additive migration; no backfill. Reversible by dropping the columns.

## 7. Metadata changes

SPEC-013's scene, creature and loot editors are ADR-0011's inline collections.
Their scalar fields declare `PageMeta`s, and the new fields do too. Which
fields an editor shows follows the campaign's system. That choice is made once,
where the adventure page reads the campaign, not per field. The adventure's own
fields are in the metadata layer and gain `goldTarget` and a system condition
on `xpTarget`.

## 8. Acceptance criteria

- [ ] A Daggerheart adventure shows its target level and tier, and no XP target; a 5e adventure is unchanged.
- [ ] A scene can be marked a milestone and ticked; the adventure totals planned and reached milestones.
- [ ] A fight scene's creature rows link SPEC-028 adversaries, and the scene shows Battle Points spent against its budget per open question 1's answer.
- [ ] Gold targets and loot gold are entered in handfuls and shown as chests, bags and handfuls.
- [ ] Loot links a SPEC-029 weapon, armor or loot record, and items and consumables count toward the adventure's targets.
- [ ] Deleting a used adversary or catalogue record keeps the row, unlinked.
- [ ] No 5e field is accepted on a Daggerheart scene, and no Daggerheart field on a 5e scene.
- [ ] New UI copy lands in both message catalogues.
- [ ] Every new mutation rejects an unauthenticated request and invalid input.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Fill in once agreed. Depends on SPEC-028 and SPEC-029._

**Open — to ask the DM**

1. **Are Battle Points computed or authored?** This is the decision SPEC-018 §9
   reserved for this slice. It reverses `campaign-design-method.md` §6's rule
   for Daggerheart only.
   - (a) **Computed.** Each adversary's cost comes from its type, and the budget
     from the party size plus the ticked adjustments. The DM authors nothing
     but the fight.
   - (b) **Authored.** The DM types each row's cost and the budget, and the app
     only totals them, as it does for 5e's XP.

   The draft proposes (a). The authored-values rule exists because PF2's
   numbers were being copied into a 5e app, which does not apply here: the
   costs and the formula are Daggerheart's own. They are short, fixed, and
   already restated in `daggerheart.md` §5. The rule stays in force for 5e.

2. **The optional coin rule: on, off, or per campaign?**
   - (a) Off: handfuls are the smallest unit.
   - (b) A per-campaign switch, so that gold is entered in coins where the table
     uses them.

   The draft proposes (a), with (b) as a later change if a table asks for it.

## 10. Task breakdown

_Fill in after §9. Likely: T1 columns and the per-system editor switch; T2
milestones; T3 adversaries and the Battle Point budget; T4 gold and loot; T5
i18n, a11y and an e2e journey with invented content._

## 11. Outcome

_Fill in at close._
