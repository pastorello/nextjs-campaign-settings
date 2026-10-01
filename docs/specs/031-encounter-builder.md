# SPEC-031: Encounter builder (5e)

- **Status:** Draft 2026-10-01. Written by Claude from the ROADMAP's Phase 4 entry; four questions for the DM are in §9 and nothing is implemented until they are answered.
- **Date:** 2026-10-01
- **Phase:** 4
- **Related:** [SPEC-013](./013-campaign-management.md) (the fight scene and its creature rows: "a scene with its creatures is that encounter"; §3's "not a rules engine", which this spec would narrow) · [SPEC-030](./030-daggerheart-campaign-management.md) (Daggerheart's Battle Points, the computed budget this spec mirrors for 5e) · [SPEC-018](./018-game-systems.md) §5 and rule 3 (NPCs are identical under every system) · [`campaign-design-method.md`](../domain/campaign-design-method.md) §6 (the authored-values rule and the condition for a 5e helper) · [`licensing.md`](../domain/licensing.md) §3 (SRD 5.2.1 under CC-BY-4.0)

---

## 1. Problem

The ROADMAP keeps an encounter builder by the DM's explicit exception: composing
a fight is preparation, not play. Most of one already exists.

- **The encounter.** SPEC-013 made a fight scene the encounter: its creature rows
  hold a name, a quantity, an optional NPC and the XP each is worth.
- **Daggerheart.** SPEC-030 prices each row in Battle Points and compares the
  fight against the party's budget, live, on the scene.
- **5e.** Nothing is compared. The DM types each creature's XP by hand and has no
  way to see whether a fight is a light skirmish or a likely death for the party
  at the adventure's level, short of doing the arithmetic outside the app.

So under 5e the DM builds a fight blind: the app knows the party size and the
adventure's target level, and the creatures' XP, and never puts them together.

The ROADMAP entry reads "compose an encounter from NPCs with CR-based
difficulty". Half of that is not possible as written: SPEC-018 (rule 3) keeps
NPC records identical under every system, so a challenge rating cannot be a
field of the NPC. Where a creature's CR lives instead is question 1 of §9.

## 2. Goal

A 5e fight scene shows how hard it is for the adventure's party, from the
creatures' challenge ratings, the way a Daggerheart fight already shows its
Battle Points.

## 3. Non-goals

- **Not a rules engine beyond the budget.** No hit points, no action economy, no
  per-round damage estimate, no "deadly" prediction for a specific party build.
  The SRD method compares XP to a per-character budget, and that is all.
- **Not a combat tracker.** Initiative, hit points in a fight and conditions
  stay at the table (ROADMAP, _Explicitly not planned_, 2026-09-22). Do not grow
  the builder into one.
- **No CR on NPC records.** NPCs stay system-free (SPEC-018 rule 3). A named
  villain is linked to a creature row, as SPEC-013 already allows, and the CR
  sits on the row.
- **No change to Daggerheart.** SPEC-030's Battle Points are the Daggerheart
  encounter builder; this spec leaves them as they are.
- **No seeded monsters.** Whatever creatures exist are the DM's (the
  custom-only rule in `licensing.md` §3), even if question 2 adds a catalogue.
- **No encounter-level XP awards beyond what SPEC-013 has.** The check-off and
  the adventure's XP total keep working from each row's XP.

## 4. User stories

- As a DM preparing a 5e adventure, I want to give each creature in a fight its
  challenge rating, so that its XP is filled in for me.
- As a DM, I want the fight scene to tell me whether the fight is low, moderate
  or high for the party at the adventure's level, so that I can tune it before
  the session.
- As a DM, I want the verdict to update when I change the party size or the
  adventure's level, so that a fight planned months ago is still judged
  correctly.
- As a DM, I want to override a creature's XP, so that a homebrew creature or a
  weakened villain still counts what I decide.

## 5. Behaviour

Written for the answers recommended in §9; each place a different answer would
change it is marked.

**Main flow**

1. In a 5e fight scene, the creature form gains a **challenge rating** select:
   0, 1/8, 1/4, 1/2, then 1 to 30.
2. Picking a CR fills **XP each** from the SRD's CR-to-XP table. The field stays
   editable; a value the DM types wins and is what is stored.
3. The creature row shows its CR beside its XP.
4. The fight scene shows an **encounter summary** (5e only, fight scenes only):
   - the fight's total XP: XP each × quantity, summed over the rows;
   - the party's three budgets for the adventure's target level, low, moderate
     and high: party size × the SRD's per-character budget at that level;
   - the band the total falls in: up to low, low, moderate, high, or over high.
5. Party size comes from the campaign (`campaign.partySize`, 4 for a standalone
   adventure, as SPEC-030 does); the level is the adventure's `targetLevel`.

**Edge cases**

| Situation                                        | Expected behaviour                                                                                       |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| A row with neither CR nor XP                     | Counted apart as "no XP", as SPEC-030 counts unpriced rows; it adds nothing and is not read as zero-cost |
| A row with typed XP and no CR                    | Its XP counts; the row shows no CR                                                                       |
| CR picked after XP was typed                     | XP is replaced by the CR's value only if the field still holds the previous CR's value or is blank       |
| Target level outside 1–20                        | Clamped to 1–20 for the budget, as `tierOfLevel` clamps for Daggerheart                                  |
| A fight with no creature rows                    | Total 0, the budgets shown, no band                                                                      |
| Party size changed after the fight was built     | Budgets recompute; nothing stored changes                                                                |
| A Daggerheart scene                              | Unchanged: SPEC-030's Battle Points; no CR field, refused by `otherSystemFieldErrors` if sent            |
| A 5e scene of another kind (exploration, clue …) | No summary; the rows keep their CR and XP                                                                |

## 6. Data model changes

For question 1, answer (a): one optional column on the existing row.

```prisma
model sceneCreature {
  // …
  // SPEC-031: 5e only. One of "0", "1/8", "1/4", "1/2", "1" … "30".
  challengeRating String?
}
```

- **Migration:** additive, nullable; no backfill. A CHECK keeps the value in the
  fixed list.
- **Reversible:** dropping the column loses only CRs; every row keeps its XP.
- Answer (b) to question 1 would instead add a 5e creature catalogue (a table,
  its metadata domain, list and form pages) and a nullable link from the row,
  the way SPEC-030 links Daggerheart adversaries. That is a spec-sized change
  of its own and would be re-scoped here before implementation.

## 7. Metadata changes

- **`sceneCreatureMeta.challengeRating`:** select over a fixed option list
  (`fiveEChallengeRatings`), validator `z.enum([...]).nullable().optional()`,
  label key `sceneCreature.fields.challengeRating.label`. The creature editor
  stays outside the metadata layer (ADR-0011) and consumes this declaration.
- **`campaignSystemFields.sceneCreature.dnd5e`** gains `challengeRating`, so a
  Daggerheart write refuses it.
- **New config, not `PageMeta`:** `app/lib/config/dnd5e/encounterBudget.ts` holds
  the CR-to-XP table and the per-character budget table, restated from
  `docs/domain/5e-encounters.md`, the way `dhBattlePoints.ts` holds
  Daggerheart's.

## 8. Acceptance criteria

- [ ] A 5e creature row can be given a challenge rating from the fixed list, and picking one fills its XP, which stays editable.
- [ ] A 5e fight scene shows its total XP, the party's low, moderate and high budgets for the adventure's level, and the band the total falls in.
- [ ] Changing the party size or the target level changes the summary with nothing stored changing.
- [ ] Rows with no XP are counted apart, not as zero.
- [ ] A Daggerheart scene is unchanged, and a CR sent to one is refused.
- [ ] The numbers come from `docs/domain/5e-encounters.md`, restated from the SRD 5.2.1 in our own words, with the CC-BY attribution statement added to the repository.
- [ ] New UI copy lands in both message catalogues.
- [ ] Every new mutation rejects an unauthenticated request and invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

**Open questions for the DM**

1. **Where does a creature's CR live?**
   - **(a) On the fight's creature row** _(recommended)_. One optional column.
     A named NPC gets its CR on the row that brings it into the fight, so the
     same villain can be weaker in an early fight and stronger later.
   - (b) In a new 5e creature catalogue, a list of monsters with CR and stats,
     linked from the row, as Daggerheart's adversaries are. Reusable across
     fights, but a whole catalogue: list, form, card, search.
2. **Does 5e get a computed budget?** This narrows SPEC-013's "not a rules
   engine" and is the exception `campaign-design-method.md` §6 already allows
   for ("built from the SRD, and it stays optional").
   - **Yes, computed and shown, XP still editable** _(recommended)_.
   - No: the CR only fills XP, and no difficulty is computed.
3. **Which difficulty method?**
   - **SRD 5.2.1 (2024 rules): XP budget per character, low/moderate/high**
     _(recommended)_. It is in the CC-BY SRD, so the numbers can be restated
     and shipped with the attribution statement, and it has no multiplier.
   - The 2014 method (thresholds easy/medium/hard/deadly and a multiplier for
     the number of monsters). Its tables are in the _Dungeon Master's Guide_
     and, as far as known, not in SRD 5.1 (T1 would confirm), so the app
     would rely on mechanics the licence does not cover.
4. **Is an encounter only a fight scene?**
   - **Yes** _(recommended)_. SPEC-013's decision: the fight scene is the
     saved encounter, and copying a scene's rows covers reuse.
   - No: a separate library of reusable encounters, copied into scenes.

**Files touched, in order** _(for the recommended answers)_

| #   | File                                                        | Change                                                            |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | `docs/domain/5e-encounters.md`, `NOTICE`                    | The method and its two tables in our own words; CC-BY attribution |
| 2   | `prisma/schema.prisma`, migration                           | `sceneCreature.challengeRating` with its CHECK                    |
| 3   | `app/lib/config/dnd5e/encounterBudget.ts`                   | CR → XP, level → per-character budgets                            |
| 4   | `app/lib/utils/dnd5e/encounterDifficulty.ts`                | Total, budgets and band; pure, unit-tested                        |
| 5   | `sceneCreatureMeta`, `campaignSystemFields`, the two writes | The field, its validator, the per-system rule                     |
| 6   | `SceneCreatureForm`, `SceneCreatureList`                    | CR select filling XP; CR on the row                               |
| 7   | `EncounterSummary` (new), `SceneList`, the adventure page   | The summary on 5e fight scenes                                    |
| 8   | `messages/{it,en}.json`, an e2e journey                     | Copy in both catalogues; invented content                         |

**Risks**

- **The SRD numbers.** They must be checked against the SRD 5.2.1 text when
  the domain file is written, not recalled; the domain file records the
  version, as `daggerheart.md` does for its SRD.
- **XP and CR drifting apart.** A typed XP that no longer matches the CR is
  deliberate (a weakened villain), so the row shows both and nothing "corrects"
  it.

## 10. Task breakdown

_For the recommended answers; rewritten if the DM answers otherwise._

- [ ] **T1** — `docs/domain/5e-encounters.md` from the SRD 5.2.1, and the attribution statement. _(review: numbers checked against the SRD text)_
- [ ] **T2** — The column, its CHECK, the meta, the per-system rule. _(test: a 5e write keeps a valid CR; a Daggerheart write refuses one; an invalid CR is refused)_
- [ ] **T3** — The budget tables and `encounterDifficulty`. _(test: totals, budgets per level and party size, bands, unpriced rows, clamping)_
- [ ] **T4** — The creature form and row, and the encounter summary. _(test: picking a CR fills XP; a typed XP survives; the summary's band)_
- [ ] **T5** — i18n, a11y, an e2e journey with invented content; close the spec and update `campaign-design-method.md` §6 and SPEC-013 §3 with a dated note.

## 11. Outcome

_Fill in at close._
