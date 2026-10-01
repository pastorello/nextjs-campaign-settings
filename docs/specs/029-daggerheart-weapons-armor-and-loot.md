# SPEC-029: Daggerheart — weapons, armor and loot

- **Status:** In progress 2026-10-01. Agreed 2026-09-30. Written by Claude from SPEC-018 §6; the DM approved it and answered its question (§9).
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
   section does not grow by three flat entries (§9).

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

**Depends on** SPEC-028, which added the shared `tier` field, the range and
damage-type vocabularies, `StatBlockView` and `isPlayerSearchDomain`.

**Decided while planning (2026-10-01)**

1. **Weapons and armor are rules; loot is the DM's.** Weapons and armor
   are what the players choose from at the table, like SPEC-022 R14's
   catalogues. They join `PLAYER_PAGES`, whole and unfiltered. Loot is
   handed out, like the 5e treasure catalogue (R15), so it stays the
   DM's: no player page, search hit or record link, through SPEC-028's
   cuts. Opening loot later means adding it to `PLAYER_PAGES` and to
   `isRecordImageVisible`.
2. **The trait reuses `DhSpellcastTrait`**, the six traits of
   `daggerheart.md` §7, through its own option list without "none".
3. **A feature is both or neither.** `featurePairErrors` refuses a name
   without text, or text without a name, on the missing field
   (`featureNeedsBoth`). An update judges the stored row with the payload
   over it, as SPEC-028's adversary rules do.
4. **Armor's Major < Severe** reuses SPEC-028's `majorBelowSevere`, on
   `armorSevere`.
5. **The cards are `StatBlockView`s**: tier and kind on the band, the
   numbers below, the feature last.
6. **The "Equipment" group** is a labelled group in the sidebar holding
   the three catalogues' tiles. It has no page of its own. A player sees
   the group with weapons and armor only.

**Answered by the DM on 2026-09-30**

1. One "Equipment" group in the sidebar, or three flat entries? **One group**,
   with the three catalogues as its sub-entries.

## 10. Task breakdown

- [x] **T1** — Schema with CHECKs, the vocabularies, the three metas and
      `featurePairErrors`. _(test: validators, the pair rule)_ _Done
      2026-10-01._
  - Migration `20261001300000_spec029_equipment` adds the three tables and
    ten CHECKs: tiers, die, bonus, burden, armor score, Major < Severe,
    roll value, and the feature pairs.
  - Keys are prefixed and `@map`ped per §7.
  - The die list is `DH_DICE` from SPEC-028's dice validator.
  - `blankToNull` stores an emptied feature half as `null`, so the pair
    rule and the CHECK see the same thing.
- [x] **T2** — Weapons end to end: lists with every §5 filter, the form,
      the card, the delete route; open to players. _(test: actions, card;
      e2e)_ _Done 2026-10-01._
  - **Pages and players:** `PageType.DhWeapon`. Weapons are in
    `PLAYER_PAGES`, and their pictures are visible to players
    (`isRecordImageVisible`'s catalogue list).
  - **Sidebar:** the "Equipment" group arrives here (`NavGroup` in
    `nav-links.tsx`). It is a `role="group"` named by its label, holding
    the weapons tile; T3 and T4 add theirs.
  - **Card:** `DhWeaponCard`, on `StatBlockView`, shows the damage as die
    and bonus (`d8+2`).
  - **E2E:** `daggerheart-weapons.spec.ts` covers the half-feature
    refusal, the card with an axe scan, the 404 under 5e and the delete.
    The a11y scan covers the four new pages.
- [x] **T3** — Armor end to end, open to players. _(test: thresholds,
      score; e2e)_ _Done 2026-10-01._
  - `PageType.DhArmor` (`/armor`), in `PLAYER_PAGES`; its pictures are
    visible to players.
  - `armorThresholdErrors` refuses Major at or above Severe on
    `armorSevere`. An update judges the stored row with the payload over
    it, as it does the feature pair.
  - `DhArmorCard` shows the base thresholds and the score.
- [x] **T4** — Loot end to end, the DM's alone. _(test: roll value,
      rarity filter; e2e)_ _Done 2026-10-01._
  - **Pages:** `PageType.DhLoot` (`/loot`). Both layouts call
    `requireDmPage()`; it is not in `PLAYER_PAGES`, and its pictures are
    never served to a player.
  - **Roll value:** a blank roll value is `null`. The admin list's roll
    column sorts, so records sharing one sit together; kind, rarity and
    origin filter.
  - **E2E:** `daggerheart-armor-loot.spec.ts` covers armor refused with
    Major at Severe and then saved, loot with a roll value, both cards
    with axe scans, both 404s under 5e, and both deletes. The a11y scan
    covers the eight new pages.
- [ ] **T5** — The sidebar group, search and record links (loot cut for
      players), i18n and a11y.

## 11. Outcome

_Fill in at close._
