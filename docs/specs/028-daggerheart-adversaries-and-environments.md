# SPEC-028: Daggerheart — adversaries and environments

- **Status:** In progress 2026-10-01. Agreed 2026-09-30. Written by Claude from SPEC-018 §6; the DM approved it and answered its question (§9).
- **Date:** 2026-09-30
- **Phase:** 4
- **Related:** [SPEC-018](./018-game-systems.md) T6 (§5 licence constraints and §6 catalogue structure, binding here) · [SPEC-021](./021-daggerheart-domains-and-classes.md) (the patterns reused) · [ADR-0018](../adr/0018-daggerheart-features-one-table-per-owner.md) (ordered features, one table per owner) · [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md) · [`daggerheart.md`](../domain/daggerheart.md) §4, §5, §8 · [SPEC-030](./030-daggerheart-campaign-management.md) (the encounter budget that prices these adversaries)

---

## 1. Problem

The DM prepares Daggerheart fights and scenes with two stat blocks the app
cannot hold:

- the **adversary**: tier, type, thresholds, HP, Stress, an attack, experiences
  and features;
- the **environment**: a scene's own stat block, with impulses, a Difficulty,
  the adversaries it tends to bring, and features.

An environment also belongs to the world: a haunted pass is a place, and today
nothing connects the two.

## 2. Goal

Under `daggerheart`, the DM authors adversaries and environments and reads each
as a stat block. An environment names the places it describes and the
adversaries it may bring.

## 3. Non-goals

- **Any rules content in the repository** (SPEC-018 §5). Nothing is seeded, and
  tests use invented stat blocks.
- **Running a fight**: no HP or Stress tracking, no Fear pool. Play-time tools
  were dropped on 2026-09-22 (`CLAUDE.md`), and a stat block is prep.
- **The encounter budget.** Battle Points belong to a scene, so they are
  [SPEC-030](./030-daggerheart-campaign-management.md)'s. This spec stores the
  adversary type the cost is read from, and nothing else.
- **Scaling an adversary to another tier.** The SRD describes adjusting stat
  blocks; the DM writes the adjusted block as its own record.
- **Printing and import**, as for SPEC-021.

## 4. User stories

- As a DM, I want to write an adversary's full stat block and read it back laid
  out as one, so that I can prepare fights from my own bestiary.
- As a DM, I want to write an environment and say which places it describes and
  which adversaries it brings, so that preparing a scene at a place starts from
  what is already there.

## 5. Behaviour

**Main flow**

1. **Adversaries** have a list with header filters (tier, type, origin), a
   form, and a **stat-block view**. Fields:
   - name, tier 1–4, and type (the ten of `daggerheart.md` §5);
   - **horde density**: creatures per HP, required for a horde and forbidden
     on every other type (SPEC-018 §5);
   - description and motives & tactics (formatted);
   - Difficulty, Major and Severe thresholds, HP, Stress, attack modifier;
   - **standard attack**: name, range (the five of §7), damage expression, and
     damage type (physical / magic);
   - **experiences**: an ordered list, each a name and a bonus;
   - **features**: an ordered list, each with a kind (action / reaction /
     passive), a Fear flag, a name and formatted text;
   - image and origin.

   The two lists are edited inline in the list's edit dialog, as SPEC-021's
   class features are (ADR-0011).

2. **Environments** have a list with header filters (tier, type, origin,
   place), a form, and a stat-block view. Fields:
   - name, tier 1–4, and type (exploration / social / traversal / event);
   - a one-line description;
   - impulses and Difficulty;
   - **potential adversaries**: links to adversaries, plus a free-text line
     for what is not in the bestiary;
   - **features**: ordered, each with a kind, a name, formatted text and
     optional prompt questions;
   - **linked places** (zones, any number);
   - image and origin.
3. **The stat-block views** lay a record out the way a table reads it: header
   line (tier, type), numbers in one row, then the attack, experiences and
   features. An environment's potential adversaries link to their own blocks.
4. **Search and record links** reach both catalogues under `daggerheart` only.
5. **The world side.** Under `daggerheart`, a place's popover lists the
   environments linked to it, the same answer SPEC-027 gives for communities.
   Adversaries get no link to NPCs in this slice (§9).

**Edge cases**

| Situation                                                     | Expected behaviour                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| A horde without a density; a density on any other type        | Field error (SPEC-018 §5)                                            |
| Major threshold not below Severe                              | Field error on Severe (`daggerheart.md` §8)                          |
| A damage expression that does not parse (`2d8+3`, `d12`, `6`) | Field error; the accepted forms are listed in the field's hint       |
| Deleting an adversary an environment lists                    | Refused with the count (`Restrict`), as a used Daggerheart domain is |
| Deleting an adversary a scene uses (SPEC-030)                 | Decided in SPEC-030; this spec adds no scene relation                |
| A linked place is deleted                                     | The link disappears; the environment stays                           |
| Both catalogues under `dnd5e`                                 | Not found                                                            |

## 6. Data model changes

```prisma
// proposed
model dhAdversary {
  id              Int     @id @default(autoincrement())
  name            String
  tier            Int     // 1–4, CHECK
  adversaryType   String  // the ten types — closed vocabulary in code
  hordeDensity    Int?    // CHECK: non-null iff adversaryType = 'horde'
  description     String?
  motives         String?
  difficulty      Int
  majorThreshold  Int     // CHECK major < severe
  severeThreshold Int
  hp              Int     // 1–12 (daggerheart.md §8)
  stress          Int
  attackModifier  Int
  attackName      String
  attackRange     String  // melee | veryClose | close | far | veryFar
  attackDamage    String  // a validated dice expression
  attackType      String  // physical | magic
  imageId         Int?    @unique
  origin          String  @default("homebrew")
  experiences     dhAdversaryExperience[]
  features        dhAdversaryFeature[]
  environments    dhEnvironment[] @relation("dhEnvironmentAdversaries")
}

model dhAdversaryExperience { id, adversaryId (Cascade), position, name, bonus }
model dhAdversaryFeature    { id, adversaryId (Cascade), position, kind, fear Boolean, name, text }

model dhEnvironment {
  id                 Int     @id @default(autoincrement())
  name               String
  tier               Int
  environmentType    String  // exploration | social | traversal | event
  description        String
  impulses           String?
  difficulty         Int
  otherAdversaries   String? // the free-text line
  imageId            Int?    @unique
  origin             String  @default("homebrew")
  adversaries        dhAdversary[] @relation("dhEnvironmentAdversaries")
  places             zone[]        @relation("dhEnvironmentPlaces")
  features           dhEnvironmentFeature[]
}

model dhEnvironmentFeature  { id, environmentId (Cascade), position, kind, name, text, questions String? }
```

- Features and experiences follow ADR-0018: one table per owner, ordered, with
  a cascade on the owner.
- The environment ↔ adversary relation is many-to-many. The draft proposes that
  deleting a listed adversary is refused, which needs an explicit join model
  with `Restrict` rather than an implicit relation. Whether a silent unlink is
  acceptable instead is a small call for the implementation plan.
- Additive migration; no backfill; nothing seeded. Reversible by dropping the
  new tables.

## 7. Metadata changes

- Two domain metas, `dhAdversaryMeta` and `dhEnvironmentMeta`, under
  `app/lib/config/daggerheart/`.
- **Shared keys.** `tier` and `difficulty` mean the same thing on both (and on
  SPEC-029's equipment), so they join `SharedMetaField` deliberately.
- **Prefixed keys.** `adversaryType` and `environmentType` are prefixed, since
  magic items own `type`. The rest are prefixed where they would collide.
- The inline lists are bespoke editors per ADR-0011, their scalar fields
  declared as `PageMeta`.

## 8. Acceptance criteria

- [ ] Adversaries and environments can be created, edited, listed with filters and deleted under `daggerheart`, and are not found under `dnd5e`.
- [ ] Horde density is required for a horde and refused otherwise.
- [ ] Major ≥ Severe, and an unparseable damage expression, are refused with field errors.
- [ ] Experiences and features are added, edited, reordered and deleted inline.
- [ ] The stat-block view shows every field in §5, with Fear features marked.
- [ ] An environment's adversaries link to their blocks, and its places are saved, filterable and listed on the place's popover under `daggerheart`.
- [ ] Deleting an adversary an environment lists is refused with the count.
- [ ] Search under `daggerheart` finds both catalogues; under `dnd5e` it does not.
- [ ] No seed, fixture or test reproduces SRD content (checked in review).
- [ ] New UI copy lands in both message catalogues.
- [ ] Every new mutation rejects an unauthenticated request and invalid input.
- [ ] Coverage has not dropped.

## 9. Implementation plan

**Depends on** SPEC-027, whose patterns this slice reuses: the computed
meta-pair check, the rows/cards switch, the place popover's list of linked
records, and links from a catalogue into `zone`.

**Decided while planning (2026-10-01)**

1. **Minions have no thresholds.** Every minion in the SRD prints its
   thresholds as "None" (and 1 HP); no other type does. So `majorThreshold`
   and `severeThreshold` are nullable: required for every type but a minion,
   and for a minion either both empty or both given. Major < Severe whenever
   both are given. A CHECK holds the same rule.
2. **A listed adversary cannot be deleted.** The environment ↔ adversary
   relation is an explicit join model, `dhEnvironmentAdversary`, with
   `Restrict` on the adversary and `Cascade` on the environment. The delete
   counts the environments first and refuses with the count
   (`adversaryInEnvironments`), as a used domain is refused. A silent unlink
   would leave an environment that names fewer adversaries than the DM wrote,
   with no notice.
3. **Adversaries and environments are the DM's alone.** They are GM-side stat
   blocks, like the treasure catalogue (SPEC-022 R15), not rules the players
   read (R14). Neither enters `PLAYER_PAGES`: the proxy refuses a player, and
   each layout calls `requireDmPage()`. For a player, search skips both and a
   record link to either renders as text. The place popover shows a player no
   environments. Opening them to players later means adding them to
   `PLAYER_PAGES` and removing those three cuts.
4. **`tier` and `difficulty` are declared once**, as `origin` is
   (`dhTierMeta`, `dhDifficultyMeta`, spread into `pageMetaFields` by key).
   This replaces §7's `SharedMetaField`: the shared-field type is for keys two
   domain metas each declare, and here neither does.
5. **A damage expression** is `NdS+k`, `NdS-k`, `NdS`, `dS` or a flat
   number. `N` and `k` are whole numbers, and `S` is one of 4, 6, 8, 10, 12 or 20. The field's hint lists the forms; the validator is
   `diceExpressionValidator`.
6. **The inline lists share one component.** An adversary's experiences and
   features and an environment's features are three ordered lists edited in
   the edit dialog (ADR-0011). They share an `InlineOrderedList` shell for
   add, edit, move and delete. Each list keeps its own form and actions,
   and SPEC-021's two lists are left as they are.
7. **Prompt questions** are optional formatted text on an environment
   feature.
8. **The stat-block view** is the card view of the public list (`?view=cards`),
   as SPEC-027's cards are: no per-record page. An environment's adversaries
   link to the adversary list filtered by name, in card view.

**Risks**

- **The largest form in the app.** Some twenty scalar fields and two inline
  lists. SPEC-021's class dialog is the nearest precedent, and it held
  up. The stat-block view is where the design effort goes.

**Answered by the DM on 2026-09-30**

1. Should an adversary be able to name the NPC it is the stat block of? **Not
   in this slice.** Shared entities stay free of per-system fields. A scene's
   creature row already links an NPC, and it is where SPEC-030 joins the two.

## 10. Task breakdown

- [x] **T1** — Schema, migration with CHECKs, enums, option lists, metas
      (adversary, environment, the three inline rows) and the dice
      validator. _(test: validators; the meta-pair check)_ _Done 2026-10-01._
  - Migration `20261001200000_spec028_stat_blocks`: the six §6 tables plus
    the places join, and four hand-written CHECKs (tiers, HP and Stress,
    the horde's density, the minion's thresholds with Major < Severe).
  - `tier` and `difficulty` are `dhSharedStatMetas`, spread into
    `pageMetaFields` by key like `origin`. `adversaryType`,
    `environmentType`, the attack's fields and the environment's links are
    prefixed.
  - The row metas are `dhStatBlockRowMetas`, outside the registry
    (ADR-0011).
  - `diceExpressionValidator` normalises (`2D8 + 3` → `2d8+3`) and accepts
    d4–d20 only.
  - `dhAdversary` is an option table; it is empty for a player.
- [x] **T2** — Adversaries end to end: lists with header filters (tier,
      type, origin), the form with the horde and threshold rules, the inline
      experiences and features, the stat-block card, the delete route, the
      nav tile; DM-only. _(test: actions, cross-field rules, the inline
      lists, the stat block; e2e)_ _Done 2026-10-01._
  - **Pages:** `PageType.DhAdversary`. Both layouts call
    `requireDmPage()`, and `/adversaries` is not in `PLAYER_PAGES`.
  - **Cross-field rules:** `adversaryShapeErrors` holds them. An update is
    judged on the stored row with the payload over it.
  - **Delete:** the refusal (`adversaryInEnvironments`, with the count)
    is in place before T3 adds the environments that can trigger it.
  - **Inline rows:** experiences and features are edited in the list's edit
    dialog through `InlineOrderedList`, with `StatBlockFeatureForm` shared
    with T3.
  - **Stat block:** `DhAdversaryStatBlock` (`StatBlockView`), in the
    public list's card view. Its features' record links resolve in the
    same batch as the fields'.
  - **E2E:** `daggerheart-adversaries.spec.ts` covers the refusals, the
    inline rows, the stat block with an axe scan, the 404 under 5e, and
    the delete. The a11y scan covers the four new pages.
- [x] **T3** — Environments end to end: lists with header filters (tier,
      type, origin, place), the form with the adversary and place links, the
      inline features, the stat-block card with links to its adversaries, and
      the refused delete of a listed adversary. _(test: links, the refusal;
      e2e)_ _Done 2026-10-01._
  - **Pages:** `PageType.DhEnvironment`, DM-only like adversaries. The new
    page loads the `dhAdversary` and `zone` options.
  - **Links:** the adversary links are rows of `dhEnvironmentAdversary`.
    They are created on create, and replaced (`deleteMany` + `create`) on an
    update that carries them. Places `connect`/`set` as a community's do.
    A missing adversary or place is a field error
    (`checkDhEnvironmentLinks`).
  - **Place filter:** a relation filter (`buildDhEnvironmentWhere`).
  - **Stat block:** `DhEnvironmentStatBlock`. Each adversary links to the
    adversary list filtered by name in card view, each place to its map.
    The features' texts and questions resolve their record links in the
    page's batch.
  - **E2E:** `daggerheart-environments.spec.ts` covers a minion brought by
    an environment, a feature with questions, the link to the adversary's
    block, the adversary's refused and then allowed delete, and the 404
    under 5e. The a11y scan covers the four new pages.
- [ ] **T4** — The place popover, search, record links (cut for players),
      i18n, a11y, and the e2e with invented content.

## 11. Outcome

_Fill in at close._
