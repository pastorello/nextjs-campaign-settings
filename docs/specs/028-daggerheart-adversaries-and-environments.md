# SPEC-028: Daggerheart — adversaries and environments

- **Status:** Draft, 2026-09-30. Written by Claude from SPEC-018 §6, for the DM to review. One question is open (§9).
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
   Open question 1 asks whether adversaries get the same kind of link to NPCs.

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

_Fill in once agreed._

**Risks**

- **The largest form in the app.** Some twenty scalar fields and two inline
  lists. SPEC-021's class dialog is the nearest precedent, and it held
  up. The stat-block view is where the design effort goes.
- **Thresholds.** Before T1, check against the SRD whether any adversary type
  (minions in particular) is printed without thresholds. If one is, both
  thresholds become nullable for that type only, and §8 says so.

**Open — to ask the DM**

1. **Should an adversary be able to name the NPC it is the stat block of?**
   - (a) An optional link from an adversary to one NPC, shown on the NPC's
     card under `daggerheart`.
   - (b) Not in this slice.

   The draft proposes (b). SPEC-018 keeps shared entities free of per-system
   fields, and a scene's creature already links an NPC (SPEC-013), which is
   where SPEC-030 joins the two.

## 10. Task breakdown

_Fill in after §9. Likely: T1 schema, metas and ADR-0018's two new owners; T2
adversaries with the stat-block view; T3 environments with their links; T4 the
place popover, search, record links, i18n, a11y and e2e with invented content._

## 11. Outcome

_Fill in at close._
