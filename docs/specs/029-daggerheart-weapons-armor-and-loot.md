# SPEC-029: Daggerheart — weapons, armor and loot

- **Status:** Draft, 2026-09-30. Written by Claude from SPEC-018 §6, for the DM to review. One question is open (§9).
- **Date:** 2026-09-30
- **Phase:** 4
- **Related:** [SPEC-018](./018-game-systems.md) T7 (§5 licence constraints and §6 catalogue structure, binding here) · [SPEC-021](./021-daggerheart-domains-and-classes.md) (the patterns reused) · [`daggerheart.md`](../domain/daggerheart.md) §3, §6, §7, §8 · [SPEC-030](./030-daggerheart-campaign-management.md) (a scene's loot, which draws on these catalogues)

---

## 1. Problem

The 5e side has magic items and a treasure catalogue. The Daggerheart side has
no equipment at all: nowhere to write the setting's weapons, armor, items and
consumables. So a Daggerheart adventure has nothing to hand out (SPEC-030).

## 2. Goal

Under `daggerheart`, the DM authors weapons, armor and loot, filters them the
way a table shops or rolls for them (by tier, by rarity), and reads each as a
card.

## 3. Non-goals

- **Any rules content in the repository** (SPEC-018 §5). Nothing is seeded, and
  tests use invented equipment.
- **Inventories and equipping.** What a character carries, the two-hands burden
  limit and the one-chest gold limit are character rules for the character
  spec.
- **Prices.** `daggerheart.md` §6: prices are the GM's to set, and some tables
  do not track gold. A price column is easy to add later, and hard to take away
  once every record has one.
- **Random loot tables.** A loot record may carry the number it answers to on
  the DM's own table, but the app rolls nothing: rolling is play.
- **Printing and import**, as for SPEC-021.

## 4. User stories

- As a DM, I want to write weapons and armor by tier, so that my setting's
  smiths and armouries have a catalogue.
- As a DM, I want to write items and consumables with a rarity and the number
  they answer to on my loot table, so that I can hand out loot I authored.

## 5. Behaviour

**Main flow**

1. **Weapons** have a list with header filters (tier, primary/secondary,
   trait, range, damage type, burden, origin), a form, and a card view. Fields:
   - name and tier 1–4;
   - primary or secondary;
   - trait (the six of `daggerheart.md` §7) and range (the five);
   - damage: a die (d4, d6, d8, d10, d12, d20) and a flat modifier ≥ 0;
   - damage type (physical / magic) and burden (one or two hands);
   - an optional feature (name and formatted text);
   - image and origin.

   The dice count is not stored: it is the wielder's Proficiency.

2. **Armor** has a list with header filters (tier, origin), a form, and a card
   view. Fields:
   - name and tier;
   - base Major and Severe thresholds (Major < Severe);
   - base armor score (1–12, `daggerheart.md` §8);
   - an optional feature, image and origin.
3. **Loot** has a list with header filters (kind, rarity, origin), a form, and
   a card view. Fields:
   - name;
   - kind: item or consumable;
   - rarity: common, uncommon, rare or legendary;
   - an optional roll value (a positive number, the entry it answers to on the
     DM's own table);
   - effect text (formatted), image and origin.
4. **Search and record links** reach the three catalogues under `daggerheart`
   only.
5. **Sidebar.** The three share one "Equipment" group, so the Daggerheart
   section does not grow by three flat entries. This is open question 1.

**Edge cases**

| Situation                                  | Expected behaviour                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Armor with Major not below Severe          | Field error on Severe                                                                           |
| Two loot records with the same roll value  | Allowed, and the list sorts them together: a table may have ranges, and the app does not own it |
| Deleting loot a scene hands out (SPEC-030) | Decided in SPEC-030; this spec adds no scene relation                                           |
| All three catalogues under `dnd5e`         | Not found                                                                                       |

## 6. Data model changes

```prisma
// proposed
model dhWeapon {
  id           Int     @id @default(autoincrement())
  name         String
  tier         Int     // 1–4, CHECK
  slot         String  // primary | secondary
  trait        String  // the six traits, shared with dhSubclass.spellcastTrait's vocabulary
  range        String  // melee | veryClose | close | far | veryFar
  damageDie    Int     // 4 | 6 | 8 | 10 | 12 | 20, CHECK
  damageBonus  Int     @default(0) // ≥ 0, CHECK
  damageType   String  // physical | magic
  burden       Int     // 1 | 2, CHECK
  featureName  String?
  featureText  String?
  imageId      Int?    @unique
  origin       String  @default("homebrew")
}

model dhArmor {
  id              Int     @id @default(autoincrement())
  name            String
  tier            Int
  majorThreshold  Int     // CHECK major < severe
  severeThreshold Int
  armorScore      Int     // 1–12, CHECK
  featureName     String?
  featureText     String?
  imageId         Int?    @unique
  origin          String  @default("homebrew")
}

model dhLoot {
  id          Int     @id @default(autoincrement())
  name        String
  kind        String  // item | consumable
  rarity      String  // common | uncommon | rare | legendary
  rollValue   Int?    // > 0, CHECK
  effectText  String
  imageId     Int?    @unique
  origin      String  @default("homebrew")
}
```

- A feature is one optional name and text, not ADR-0018's ordered list: the
  structure in SPEC-018 §6 gives equipment one feature at most. A feature name
  without text, or text without a name, is a field error.
- Additive migration; no backfill; nothing seeded. Reversible by dropping the
  new tables.

## 7. Metadata changes

- Three domain metas, `dhWeaponMeta`, `dhArmorMeta` and `dhLootMeta`, under
  `app/lib/config/daggerheart/`.
- `tier` is the shared key SPEC-028 introduces.
- **Prefixed keys.** Keys that collide are prefixed: magic items own `rarity`
  and `consumable`, and domain cards own `featureText`. So the keys are
  `lootRarity`, `lootKind`, `weaponFeatureName`, `armorFeatureName` and so on,
  `@map`ped to §6's columns.
- **Threshold keys.** Armor's `majorThreshold`/`severeThreshold` would collide
  with SPEC-028's adversary fields of the same name. They mean the same kind
  of number, but on a different thing (armor's are a base that the wearer's
  level raises). So they are prefixed (`armorMajor`, `armorSevere`) rather than
  shared.

## 8. Acceptance criteria

- [ ] Weapons, armor and loot can be created, edited, listed with every filter in §5 and deleted under `daggerheart`, and are not found under `dnd5e`.
- [ ] Out-of-range tier, die, burden, armor score or roll value, and Major ≥ Severe, are refused with field errors.
- [ ] A feature name without text, or text without a name, is refused.
- [ ] Each catalogue has a card view and the rows/cards switch.
- [ ] Search under `daggerheart` finds the three catalogues; under `dnd5e` it does not.
- [ ] No seed, fixture or test reproduces SRD content (checked in review).
- [ ] New UI copy lands in both message catalogues.
- [ ] Every new mutation rejects an unauthenticated request and invalid input.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Fill in once agreed._

**Open — to ask the DM**

1. **One "Equipment" group in the sidebar, or three flat entries?**
   - (a) One group, the three catalogues as tabs or sub-entries.
   - (b) Three entries beside the four SPEC-021 added.

   The draft proposes (a): after SPEC-027 and SPEC-028, the Daggerheart section
   would otherwise hold eleven entries.

## 10. Task breakdown

_Fill in after §9. Likely: T1 schema and metas; T2 weapons; T3 armor; T4 loot; T5
search, record links, i18n, a11y and e2e with invented content._

## 11. Outcome

_Fill in at close._
