# SPEC-031: Encounter builder — a creature's stats per system, and a fight's difficulty

- **Status:** Draft 2026-10-01. Written by Claude from the ROADMAP's Phase 4 entry, then rewritten the same day around the DM's answers to its four questions (§9). The revised text is waiting for the DM's agreement; §9 lists the choices Claude made in reading the answers.
- **Date:** 2026-10-01
- **Phase:** 4
- **Related:** [SPEC-013](./013-campaign-management.md) (the fight scene and its creature rows: "a scene with its creatures is that encounter"; §3's "not a rules engine", which this spec narrows for 5e) · [SPEC-030](./030-daggerheart-campaign-management.md) (Daggerheart's Battle Points, already a computed difficulty) · [SPEC-018](./018-game-systems.md) §5 and rule 3 (NPCs the same under every system), which this spec amends · [SPEC-022](./022-accounts-roles-and-party-visibility.md) (`dmOnly` fields) · [`campaign-design-method.md`](../domain/campaign-design-method.md) §6 (the authored-values rule) · [`licensing.md`](../domain/licensing.md) §3 (SRD 5.2.1 under CC-BY-4.0) · ADR-0021 (to be written, T1)

---

## 1. Problem

**An NPC is a character of the story, not a stat block.** SPEC-018 keeps every
NPC the same under every system: Tusk, the orc shaman of the level-3 adventure,
has one name, one description, one place in the world. But when Tusk fights,
the table needs his statistics, and those depend on the system being played: an
orc in 5e, something else in Daggerheart. Today the app has nowhere to say where
they are. The DM keeps them outside it, in an online compendium page, a monster
editor or a page of the _Monster Manual_, and has to remember which, per NPC
and per system.

**A 5e fight cannot tell how hard it is.** SPEC-013 made a fight scene the
encounter: creature rows with a name, a quantity, an optional NPC and the XP
each is worth, typed by hand. Under Daggerheart, SPEC-030 already prices each
row in Battle Points against the party's budget. Under 5e nothing is compared,
so the DM builds a fight blind, or does the arithmetic outside the app. The
DM's own planning spreadsheet records each creature's level by hand precisely
so that a fight can be judged against the party; the app keeps the numbers and
never puts them together.

## 2. Goal

For every NPC, the DM records, per game system, where its statistics are; and
every fight scene shows how hard it is for the party, worked out from each
creature's hand-entered challenge under the adventure's system.

## 3. Non-goals

- **No stat blocks and no monster builder.** The DM uses external tools for
  that and does not want another one here. The app stores a link or a note
  pointing at the statistics, never the statistics themselves.
- **No 5e monster catalogue.** Daggerheart has its adversaries (SPEC-028); 5e
  creatures stay where the DM keeps them, reached by link or note.
- **No change to Daggerheart's difficulty.** SPEC-030's Battle Points are
  Daggerheart's half of this spec, and stay as they are.
- **No reusable encounters.** The fight scene is the encounter (§9 answer 4).
- **No change to the NPC's own fields.** They stay the same under every system;
  the per-system reference is a record of its own (ADR-0021).
- **No Pathfinder 2e yet.** It is not a system in the app. The design leaves
  room for it: a creature's challenge in that system's own terms and one
  difficulty function per system.
- **No combat tracker.** Initiative, hit points and conditions stay at the
  table (ROADMAP, _Explicitly not planned_).
- **Nothing for players.** Statistics references are the DM's, like an NPC's
  secrets.

## 4. User stories

- As a DM, I want to record for each NPC, per game system, a link to where its
  statistics are or a note saying how to find them, so that I do not have to
  remember it.
- As a DM, when I put Tusk in a fight, I want his statistics' link for the
  adventure's system right there on the row, so that I can open it while
  preparing.
- As a DM preparing a 5e fight, I want to give each creature its challenge
  rating by hand, and have its XP filled in from it.
- As a DM, I want a 5e fight scene to tell me whether the fight is low,
  moderate or high for the party at the adventure's level, as a Daggerheart
  fight already tells me its Battle Points.
- As a DM, I want the verdict to follow a change of party size or level, so
  that a fight planned months ago is still judged correctly.

## 5. Behaviour

**A. An NPC's statistics, per system**

1. The NPC's edit page gains a section **"Statistics — <system>"** for the
   system in the URL. It holds a **link** (an `http`/`https` address) and a
   **note** (for example "Monster Manual, p. 123"). Either may be left blank.
2. The NPC's page shows the DM the reference for the current system: the link
   opens in a new tab, the note reads as text. Players never see it.
3. Under another system the NPC shows that system's reference, or none. The
   NPC's own fields are the same under every system, as SPEC-018 requires.

**B. Creatures in a fight**

4. A creature row linked to an NPC shows that NPC's reference for the
   adventure's rules system (SPEC-030 §9 decision 1), or a "no statistics
   recorded for <system>" hint linking to the NPC's edit page.
5. **5e:** the creature form gains a **challenge rating** select: 0, 1/8, 1/4,
   1/2, then 1 to 30. Picking one fills **XP each** from the SRD's table. The
   field stays editable, and a typed value wins. The row shows its CR.
6. A creature that is not an NPC (four goblins) keeps where its statistics are
   in the row's existing note.
7. **Daggerheart:** unchanged. The row links an adversary, and its challenge is
   the adversary's type and tier (SPEC-030).

**C. A fight's difficulty**

8. **5e fight scenes** show an **encounter summary**:
   - the fight's XP: XP each × quantity, summed over the rows;
   - the party's low, moderate and high budgets: party size × the SRD 5.2.1
     per-character budget at the adventure's target level;
   - the band the XP falls in: below low, low, moderate, high, above high.
9. **Daggerheart fight scenes** keep SPEC-030's Battle Points summary.
10. The party is the campaign's party size (4 for a standalone adventure) at
    the adventure's target level, as SPEC-030 does.

**Edge cases**

| Situation                                        | Expected behaviour                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| A link that is not `http`/`https`                | Refused, field by field (`javascript:` and the like never reach a page)                             |
| A reference saved with both fields blank         | No reference is kept for that system                                                                |
| An NPC deleted                                   | Its references go with it; creature rows keep their name and lose the link (SPEC-013, `SetNull`)    |
| A row with neither CR nor XP                     | Counted apart as "no XP", as SPEC-030 counts unpriced rows; it adds nothing and is not read as zero |
| A row with typed XP and no CR                    | Its XP counts; the row shows no CR                                                                  |
| CR picked after XP was typed                     | XP changes only if it was blank or still the previous CR's value                                    |
| Target level outside 1–20                        | Clamped to 1–20 for the budget                                                                      |
| A fight with no creature rows                    | XP 0, the budgets shown, no band                                                                    |
| Party size or level changed later                | Budgets recompute; nothing stored changes                                                           |
| A CR sent to a Daggerheart row                   | Refused by `otherSystemFieldErrors` (`notInThisSystem`)                                             |
| A 5e scene of another kind (exploration, clue …) | No summary; the rows keep their CR and XP                                                           |
| A player                                         | Sees no reference anywhere: NPC page, card, search, record links                                    |

## 6. Data model changes

```prisma
/// SPEC-031: where an NPC's statistics are under one game system. The NPC's
/// own fields stay the same under every system (SPEC-018); this is the
/// per-system half (ADR-0021).
model npcSystemStats {
  id        Int      @id @default(autoincrement())
  npcId     Int
  npc       npc      @relation(fields: [npcId], references: [id], onDelete: Cascade)
  system    String   // a GAME_SYSTEMS value
  statsUrl  String?
  statsNote String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([npcId, system])
}

model sceneCreature {
  // …
  // SPEC-031, 5e only: "0", "1/8", "1/4", "1/2", "1" … "30".
  challengeRating String?
}
```

- **Migration:** additive; no backfill. CHECKs: a reference has a link or a
  note; a link starts with `http://` or `https://`; a CR is one of the fixed
  values.
- **Reversible:** dropping the table and the column loses only references and
  CRs; every row keeps its XP.
- **ADR-0021** records the pattern, because SPEC-018 said "no extension tables"
  for shared entities: a shared record's per-system half lives in its own table,
  keyed by the record and the system, and never adds a column to the shared
  record.

## 7. Metadata changes

- **`app/lib/config/npc/npcSystemStatsMeta.ts`** (new): `statsUrl` (an
  `http`/`https` URL validator, bounded length) and `statsNote` (bounded text),
  both `dmOnly`. The section that edits them is bespoke, outside the metadata
  layer: per ADR-0011's test it has no list page of its own. It consumes these
  declarations.
- **`sceneCreatureMeta.challengeRating`:** select over `fiveEChallengeRatings`,
  validator `z.enum([...]).nullable().optional()`.
- **`campaignSystemFields.sceneCreature.dnd5e`** gains `challengeRating`.
- **`app/lib/config/dnd5e/encounterBudget.ts`** (new, not `PageMeta`): the
  CR-to-XP table and the per-character budget table, restated from
  `docs/domain/5e-encounters.md`, as `dhBattlePoints.ts` holds Daggerheart's.

## 8. Acceptance criteria

- [ ] An NPC can be given, per game system, a link and/or a note to its statistics; under another system it shows that system's.
- [ ] A link that is not `http`/`https` is refused; a reference with both fields blank is not kept.
- [ ] A player never sees a statistics reference.
- [ ] A creature row linked to an NPC shows that NPC's reference for the adventure's system.
- [ ] A 5e creature row can be given a challenge rating, which fills its XP; the XP stays editable.
- [ ] A 5e fight scene shows its XP, the party's three budgets and the band; a change of party size or level changes them, with nothing stored changing.
- [ ] Rows with no XP are counted apart, not as zero.
- [ ] A Daggerheart scene is unchanged, and a CR sent to one is refused.
- [ ] The numbers come from `docs/domain/5e-encounters.md`, restated from the SRD 5.2.1, with the CC-BY attribution statement in the repository.
- [ ] New UI copy lands in both message catalogues.
- [ ] Every new mutation rejects an unauthenticated or non-DM request and invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

**The DM's answers (2026-10-01)**

1. **Where a creature's statistics live.** An NPC is a narrated character, and
   is the same everywhere. Each NPC has, for each game system, a link to where
   its statistics are kept (an online compendium page, a monster made in an
   external editor), or a note on how to find them ("page 123 of the Monster
   Manual"). No monster builder in this app: plenty exist elsewhere.
2. **Difficulty is computed, per system.** Each creature in a fight carries its
   challenge, entered by hand as in the DM's spreadsheet, so that each system
   can compute how hard the fight is from its creatures and the party.
3. **Method:** SRD 5.2.1 (2024 rules), XP budget per character, low/moderate/
   high.
4. **An encounter is the fight scene.** No reusable library.

**Choices Claude made in reading the answers (to confirm)**

- **The CR is typed on the fight's row, not on the NPC's reference.** Answer 1
  gives the reference a link and a note. Putting a CR on it too, to fill the
  row, is a small later addition if wanted.
- **The party is the campaign's party size at the adventure's level**, as in
  SPEC-030. There is no per-fight count of the characters present.
- **References are DM-only**, as an NPC's secrets and motivations are
  (SPEC-022).
- **Links are `http`/`https` only** and open in a new tab with
  `rel="noopener noreferrer"`.
- **A creature that is not an NPC** records its statistics' source in the row's
  existing note.

**Files touched, in order**

| #   | File                                                                       | Change                                                              |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | `docs/adr/0021-…`, `docs/domain/5e-encounters.md`, `NOTICE`, SPEC-018 note | The pattern; the 5e method in our own words; CC-BY attribution      |
| 2   | `prisma/schema.prisma`, migration                                          | `npcSystemStats`; `sceneCreature.challengeRating`; their CHECKs     |
| 3   | `npcSystemStatsMeta`, `app/lib/data/npcSystemStats/*`                      | Upsert/clear (`requireDm`, validated), fetch for one NPC and system |
| 4   | `app/ui/npc/NpcStatsSection` (new), the NPC edit page and card             | Edit and show the current system's reference, DM only               |
| 5   | `sceneCreatureMeta`, `campaignSystemFields`, the creature writes           | The CR field and the per-system rule                                |
| 6   | `SceneCreatureForm`, `SceneCreatureList`, `fetchAdventureWithScenes`       | CR filling XP; the linked NPC's reference on the row                |
| 7   | `encounterBudget.ts`, `encounterDifficulty.ts`, `EncounterSummary`         | The budget, the band and the summary on 5e fight scenes             |
| 8   | `messages/{it,en}.json`, an e2e journey                                    | Copy in both catalogues; invented content                           |

**Risks**

- **The SRD numbers.** Checked against the SRD 5.2.1 text when the domain file
  is written, not recalled. The file records the version, as `daggerheart.md`
  does.
- **A stored link is user input rendered on a page.** Validation keeps it to
  `http`/`https`, and it renders as a plain anchor, never as HTML.
- **XP and CR drifting apart.** A typed XP that no longer matches the CR is
  deliberate (a weakened villain), so the row shows both and nothing
  "corrects" it.

## 10. Task breakdown

- [ ] **T1** — ADR-0021; `docs/domain/5e-encounters.md` from the SRD 5.2.1 and the attribution statement; a dated note in SPEC-018 §5 and in `CLAUDE.md`'s decisions. _(review: numbers checked against the SRD text)_
- [ ] **T2** — `npcSystemStats`: schema, migration, meta, actions, the NPC section and card. _(test: refused links; blank clears; per-system; a player sees nothing)_
- [ ] **T3** — Creature rows: the CR column, the per-system rule, the form, and the linked NPC's reference on the row. _(test: CR fills XP; a typed XP survives; a Daggerheart CR is refused)_
- [ ] **T4** — Budget tables, `encounterDifficulty`, the encounter summary on 5e fight scenes. _(test: XP, budgets by level and party size, bands, rows with no XP, clamping)_
- [ ] **T5** — i18n, a11y, an e2e journey with invented content; close the spec, with dated notes in `campaign-design-method.md` §6 and SPEC-013 §3.

## 11. Outcome

_Fill in at close._
