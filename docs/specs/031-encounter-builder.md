# SPEC-031: Encounter builder — where a creature's stats are, and how hard a fight is

- **Status:** Agreed 2026-10-01. Drafted by Claude from the ROADMAP's Phase 4 entry, rewritten twice the same day around the DM's two rounds of answers (§9), and agreed by the DM with the implementation plan. **T1 done 2026-10-02:** [`docs/domain/5e-encounters.md`](../domain/5e-encounters.md) restated from the SRD 5.2.1 PDF's text, read locally (§9, _Open before T4_, is closed), and the attribution statement is in [`NOTICE.md`](../../NOTICE.md).
- **Date:** 2026-10-01
- **Phase:** 4
- **Related:** [SPEC-013](./013-campaign-management.md) (the fight scene and its creature rows: "a scene with its creatures is that encounter"; §3's "not a rules engine", which this spec narrows for 5e) · [SPEC-030](./030-daggerheart-campaign-management.md) (Daggerheart's Battle Points, already a computed difficulty) · [SPEC-022](./022-accounts-roles-and-party-visibility.md) R15 (the campaign section is the DM's alone) · [`campaign-design-method.md`](../domain/campaign-design-method.md) §6 (the authored-values rule) · [`licensing.md`](../domain/licensing.md) §3 (SRD 5.2.1 under CC-BY-4.0)

---

## 1. Problem

**A fight's creatures have statistics the app cannot point to.** SPEC-013 made
a fight scene the encounter: creature rows with a name, a quantity, an optional
NPC and the XP each is worth. When the table fights, the DM needs each
creature's statistics, and those live outside the app: an online compendium
page, a monster made in an external editor, a page of the _Monster Manual_.
Nothing on the row says where, so the DM has to remember it.

**A 5e fight cannot tell how hard it is.** Under Daggerheart, SPEC-030 already
prices each row in Battle Points against the party's budget. Under 5e nothing
is compared, so the DM builds a fight blind, or does the arithmetic outside the
app. The DM's own planning spreadsheet records each creature's challenge by
hand precisely so that a fight can be judged against the party; the app keeps
the numbers and never puts them together.

**And the party on the day is not always the party on paper.** A player is
missing, a fight is split into two waves, a monster flees before the fight
starts. The DM wants to see the difficulty change with that, without editing
the fight it was prepared as.

## 2. Goal

Every creature row in a fight says where its statistics are; every fight scene
shows how hard it is for the party, from each creature's hand-entered
challenge under the adventure's system; and the DM can change the number of
characters, or count a creature out, in or more or fewer times, on the fly,
without changing what is saved.

## 3. Non-goals

- **No stat blocks and no monster builder.** The DM uses external tools and
  does not want another one here. A row stores a link or a note pointing at
  the statistics, never the statistics.
- **No per-NPC statistics record.** Everything about fighting lives in the
  campaign, which only the DM sees (DM's answer 3). An NPC and a monster that
  is not an NPC are treated alike: both have an external statistics link on
  their row; the NPC row also links to the NPC's page in the app (answer 5).
  The first draft's `npcSystemStats` table, its ADR and the NPC-page section
  are dropped. **Do not re-propose them**; a campaign has one system, so a
  row's link is already that system's.
- **No pre-filling a recurring NPC's link** from its earlier rows. A possible
  later addition, not this spec.
- **No 5e monster catalogue.** Daggerheart has its adversaries (SPEC-028); 5e
  creatures stay where the DM keeps them, reached by link or note.
- **No change to how Daggerheart prices a fight.** SPEC-030's Battle Points
  stay; they only read the on-the-fly party size and counts (§5.C).
- **No reusable encounters.** The fight scene is the encounter (answer 4).
- **No combat tracker.** The on-the-fly layer changes the difficulty readout
  and nothing else: no hit points, initiative, turns or conditions (ROADMAP,
  _Explicitly not planned_; CLAUDE.md 2026-09-22).
- **No Pathfinder 2e yet.** The design leaves room for it: a creature's
  challenge in that system's own terms and one difficulty function per system.
- **Nothing for players.** The campaign section is the DM's alone (SPEC-022
  R15: the proxy and `campaign/layout.tsx`'s `requireDmPage`), so no field
  here needs `dmOnly`.

## 4. User stories

- As a DM, I want every creature row in a fight to carry a link to its
  statistics, or a note on how to find them, so that I do not have to
  remember where they are.
- As a DM, I want a row linked to an NPC to take me to the NPC's page as well.
- As a DM preparing a 5e fight, I want to give each creature its challenge
  rating by hand, and have its XP filled in from it.
- As a DM, I want a 5e fight scene to tell me whether the fight is low,
  moderate or high for the party, as a Daggerheart fight already tells me its
  Battle Points.
- As a DM, I want to set how many characters are playing on the adventure's
  page, starting from the campaign's number of players, and have every fight's
  difficulty follow — without saving it anywhere but my browser.
- As a DM, I want to count a creature out, or count more or fewer of it, on
  the fly, in case something unexpected happens or the party takes the fight
  in two waves, and to put it all back with one click.

## 5. Behaviour

**A. Creature rows**

1. Every creature row, under every system, gains a **statistics link** (an
   `http`/`https` address). The row's existing **note** carries a textual
   pointer instead ("Monster Manual, p. 123"). Both may be blank.
2. The row shows the link as an anchor opening in a new tab
   (`rel="noopener noreferrer"`). A row linked to an NPC also links to the
   NPC's page in the app (the record link `recordHref` builds).
3. **5e:** the creature form gains a **challenge rating** select: 0, 1/8, 1/4,
   1/2, then 1 to 30. Picking one fills **XP each** from the SRD's table if XP
   is blank or still the previous CR's value. XP stays editable, and a typed
   value wins. **CR 0 fills nothing:** the SRD gives it "0 or 10" and leaves
   the choice to each creature's statistics, so the DM types it
   ([`5e-encounters.md`](../domain/5e-encounters.md) §1; Claude's reading,
   2026-10-02). The row shows its CR. The existing `level` field (the DM's own
   notation, from the spreadsheet) stays as it is.
4. **Daggerheart:** a row still links an adversary, and its challenge is the
   adversary's type and tier (SPEC-030). It gets the statistics link too, for
   an adversary that lives outside the catalogue.

**B. A fight's difficulty**

5. **5e fight scenes** show an **encounter summary**:
   - the fight's XP: XP each × the counted quantity, over the counted rows;
   - the party's low, moderate and high budgets: the party size (§5.C) × the
     SRD 5.2.1 per-character budget at the adventure's target level;
   - the band the XP falls in: below low, low, moderate, high, above high.
6. **Daggerheart fight scenes** keep SPEC-030's Battle Points summary, read
   with the party size and counts of §5.C.
7. Other scene kinds show no summary; their rows keep their CR and XP.

**C. On the fly (the browser only)**

8. The adventure's page gains a **number of characters** select above the
   scenes. It starts at the campaign's **"Numero di giocatori"**
   (`campaign.partySize`; 4 for a standalone adventure). Changing it
   recomputes every fight's difficulty on the page, under both systems
   (budgets and bands in 5e; the budget and Minion cost in Daggerheart).
9. Each creature row in a fight gains **Exclude/Include** and **− / +** on the
   **counted** quantity (at least 1; excluding covers zero). A row whose count
   differs shows it ("counted 3 of 4").
10. These values are kept **only in `localStorage`**, in one object per
    adventure: `{ partySize?, creatures: { [id]: { excluded?, quantity? } } }`.
    Nothing reaches the database. The party select shows its default and a
    **Reset**; each scene has a **Reset** for its rows.
11. They change the difficulty readout and nothing else: not the stored rows,
    not the form, not `BudgetPanel`'s awarded XP or totals.

**Edge cases**

| Situation                                           | Expected behaviour                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A link that is not `http`/`https`                   | Refused, field by field (`javascript:` and the like never reach a page)                             |
| A row with neither CR nor XP                        | Counted apart as "no XP", as SPEC-030 counts unpriced rows; it adds nothing and is not read as zero |
| A row with typed XP and no CR                       | Its XP counts; the row shows no CR                                                                  |
| CR picked after XP was typed                        | XP changes only if it was blank or still the previous CR's value                                    |
| Target level outside 1–20                           | Clamped to 1–20 for the budget                                                                      |
| A fight with no creature rows, or all excluded      | XP 0, the budgets shown, no band                                                                    |
| The campaign's number of players changes later      | With no override, the page follows it; an override stays until Reset                                |
| `localStorage` missing, full or throwing            | The page works on the stored values; nothing on the fly is kept                                     |
| A creature row deleted                              | Its on-the-fly entry is pruned the next time the adventure's page loads                             |
| First render (server) vs the browser's stored state | The page renders the stored values, then applies the browser's overrides — no hydration mismatch    |
| A CR sent to a Daggerheart row                      | Refused by `otherSystemFieldErrors` (`notInThisSystem`)                                             |
| An NPC deleted                                      | The row keeps its name and statistics link and loses the NPC link (SPEC-013, `SetNull`)             |

## 6. Data model changes

```prisma
model sceneCreature {
  // …
  // SPEC-031: where the creature's statistics are; any system.
  statsUrl        String?
  // SPEC-031, 5e only: "0", "1/8", "1/4", "1/2", "1" … "30".
  challengeRating String?
}
```

- **Migration:** additive; no backfill. CHECKs: `statsUrl` starts with
  `http://` or `https://`; `challengeRating` is one of the fixed values.
- **Reversible:** dropping the two columns loses only links and CRs; every row
  keeps its XP.
- **No table for the on-the-fly layer.** It is browser state by the DM's
  explicit choice (answer 2), not a record.

## 7. Metadata changes

- **`sceneCreatureMeta.statsUrl`:** an `http`/`https` URL validator with a
  bounded length; shared across systems.
- **`sceneCreatureMeta.challengeRating`:** a select over the fixed CR list,
  validator `z.enum([...]).nullable().optional()`.
- **`campaignSystemFields.sceneCreature.dnd5e`** gains `challengeRating`.
- **`app/lib/config/dnd5e/encounterBudget.ts`** (new, not `PageMeta`): the
  CR-to-XP table and the per-character budget table, restated from
  `docs/domain/5e-encounters.md`, as `dhBattlePoints.ts` holds Daggerheart's.
- The on-the-fly controls are bespoke UI, outside the metadata layer: they
  edit no stored field (ADR-0011's test does not even arise).

## 8. Acceptance criteria

- [ ] A creature row, under either system, can carry a statistics link; a link that is not `http`/`https` is refused.
- [ ] A row linked to an NPC links to the NPC's page; the statistics link opens in a new tab.
- [ ] A 5e row can be given a challenge rating, which fills its XP; the XP stays editable; a CR sent to a Daggerheart row is refused.
- [ ] A 5e fight scene shows its XP, the party's three budgets and the band; rows with no XP are counted apart, not as zero.
- [ ] The adventure page's number of characters starts at the campaign's, can be changed and reset, survives a reload, and is not shared with another adventure or saved to the database.
- [ ] Excluding a creature, or changing its counted quantity, changes the difficulty under both systems and nothing stored; Reset puts it back.
- [ ] A Daggerheart scene prices exactly as SPEC-030 does when nothing is overridden.
- [ ] The numbers come from `docs/domain/5e-encounters.md`, restated from the SRD 5.2.1 text (not from memory), with the CC-BY attribution statement in the repository.
- [ ] New UI copy lands in both message catalogues.
- [ ] Every changed mutation rejects an unauthenticated or non-DM request and invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

**The DM's first answers (2026-10-01)**

1. **Where a creature's statistics live.** An NPC is a narrated character and
   is the same everywhere; for fights it corresponds to a monster model,
   declined per system: a link to something existing (an online compendium
   page) or a monster made by hand in an external editor, or a text note on
   how to find the statistics ("page 123 of the Monster Manual"). No monster
   builder in this app: plenty exist elsewhere.
2. **Difficulty is computed, per system**, from each monster's challenge,
   entered by hand as in the DM's spreadsheet, and the characters present.
3. **Method:** SRD 5.2.1 (2024 rules), XP budget per character, low/moderate/
   high.
4. **An encounter is the fight scene.** No reusable library.

**The DM's second answers (2026-10-01), on the draft's five readings**

1. **The CR is typed on the fight's row.** Confirmed.
2. **The party size:** not a field per fight — too much noise. A **number of
   characters select on the page**, defaulting to the number of characters in
   the group; it can be changed, but the value is kept **only in local
   storage**, and changing it changes the fights' difficulty. And **for each
   monster**, the ability to **remove it from the count, or increase or
   decrease it, on the fly**, in case something unexpected happens or the
   party takes the fight in two waves.
3. **Visibility:** everything about fighting lives inside the campaign, which
   only the DM sees; players have no access to the campaign section.
4. **Links are `http`/`https` only.** Confirmed.
5. **NPC or not, no difference:** both have a statistics link, external
   either way; the NPC also has a link to its description in the app, which
   a monster does not.

**Choices Claude made in reading the second answers (agreed with the plan)**

- "The number of characters in the group" is the campaign's **"Numero di
  giocatori"** (`campaign.partySize`), not a count of SPEC-022 member
  accounts: not every player has one.
- The override is kept **per adventure** ("on the page"), so one adventure's
  missing player does not change another's fights.
- The on-the-fly layer applies to **both systems**, and has **Reset** at the
  page (party size) and scene (counts) level.
- The statistics link is **shared** across systems; a Daggerheart row may
  point outside the adversary catalogue.

**Open before T4** — _closed 2026-10-02: the PDF downloaded from a local
session, and the two tables were read from its extracted text, cell by cell._

- **The SRD numbers are not written yet.** The cloud session that agreed this
  spec could not reach `media.dndbeyond.com` (the environment's network policy
  denies it; the DM can allow the host under the environment's _Network
  access_ settings). `docs/domain/5e-encounters.md` must be restated from the
  SRD 5.2.1 text — the CR-to-XP table and the per-character budget for levels
  1–20 — and checked against it, **not recalled**; if the host stays blocked,
  ask the DM for the PDF or the two tables before writing T4's numbers.

**Files touched, in order**

| #   | File                                                                                  | Change                                                                            |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | `docs/domain/5e-encounters.md`, the attribution statement (`licensing.md` §3)         | The 5e method in our own words, from the SRD text; CC-BY attribution              |
| 2   | `prisma/schema.prisma`, migration                                                     | `sceneCreature.statsUrl`, `sceneCreature.challengeRating`; their CHECKs           |
| 3   | `sceneCreatureMeta`, `SceneCreatureMetaField`, `campaignSystemFields`                 | The two fields and the per-system rule                                            |
| 4   | `createSceneCreature.ts`, `updateSceneCreature.ts`, `fetchAdventureWithScenes`        | Write and read them (`requireDm` and validation are already there)                |
| 5   | `SceneCreatureForm`, `SceneCreatureList`, `encounterBudget.ts`                        | CR filling XP; the links and the CR on the row                                    |
| 6   | `app/lib/utils/dnd5e/encounterDifficulty.ts`, `EncounterSummary`                      | The budgets, the band, the summary on 5e fight scenes                             |
| 7   | `app/lib/hooks/useEncounterAdjustments.ts`, its provider, `PartySizeControl`, the row | The on-the-fly layer; `BattlePointsSummary` and `rowBattlePoints` read through it |
| 8   | `messages/{it,en}.json`, an e2e journey                                               | Copy in both catalogues; invented content                                         |

**Risks**

- **The SRD numbers.** See _Open before T4_.
- **A stored link is user input rendered on a page.** Validation keeps it to
  `http`/`https`, and it renders as a plain anchor, never as HTML.
- **Hydration.** `localStorage` exists only in the browser: the hook reads it
  through `useSyncExternalStore` with a server snapshot of "no overrides", and
  wraps every access in `try`/`catch`.
- **XP and CR drifting apart.** A typed XP that no longer matches the CR is
  deliberate (a weakened villain), so the row shows both and nothing
  "corrects" it.

## 10. Task breakdown

- [x] **T1** — `docs/domain/5e-encounters.md` from the SRD 5.2.1 text and the attribution statement; dated notes in SPEC-013 §3 and `campaign-design-method.md` §6. _(This spec's agreement landed first, 2026-10-01; the domain file waits on the SRD text — §9.)_
- [x] **T2** — Schema and migration for `statsUrl` and `challengeRating`; meta, per-system rule, create/update actions, fetch. _(test: refused links; a Daggerheart CR refused; round trip)_ _(Done 2026-10-02. A blank link or CR is `""` in the metadata layer, whose string validators cannot output `null`, and the write turns it into `null` with `blankToNull`; the CR list is spelled out in `app/lib/config/dnd5e/challengeRatings.ts`, and a migration test keeps the CHECK equal to it.)_
- [x] **T3** — The form and the row: CR filling XP, the statistics and NPC links, the CR shown. _(test: CR fills XP; a typed XP survives; the links render as anchors)_ _(Done 2026-10-02. The fill rule is `followChallengeRating`: the XP follows the CR while it is blank or still the previous CR's suggestion, so removing the CR, or picking CR 0, clears an untouched XP. `encounterBudget.ts` holds the CR-to-XP table so far; T4 adds the budget table.)_
- [ ] **T4** — `encounterBudget.ts`, `encounterDifficulty`, `EncounterSummary`, and the on-the-fly layer (party select, Exclude/Include, −/+, Reset) under both systems. _(test: XP, budgets by level and party size, bands, rows with no XP, clamping; the hook with `localStorage` missing or throwing, reset and pruning)_
- [ ] **T5** — i18n, a11y, an e2e journey with invented content (a 5e fight, the band, a changed party size surviving a reload, an excluded creature, Reset); close the spec, ROADMAP and PROJECT_STATE.

## 11. Outcome

_Fill in at close._
