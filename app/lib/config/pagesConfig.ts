import PageType from "@/app/lib/definitions/types/PageType";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";
import GameSystem from "@/app/lib/definitions/GameSystem";

import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";
import DeityMetaField from "@/app/lib/definitions/enums/deities/DeityMetaField";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import TreasureMetaField from "@/app/lib/definitions/enums/treasure/TreasureMetaField";
import DhDomainMetaField from "@/app/lib/definitions/enums/daggerheart/DhDomainMetaField";
import DhDomainCardMetaField from "@/app/lib/definitions/enums/daggerheart/DhDomainCardMetaField";
import DhClassMetaField from "@/app/lib/definitions/enums/daggerheart/DhClassMetaField";
import DhSubclassMetaField from "@/app/lib/definitions/enums/daggerheart/DhSubclassMetaField";
import DhAncestryMetaField from "@/app/lib/definitions/enums/daggerheart/DhAncestryMetaField";
import DhCommunityMetaField from "@/app/lib/definitions/enums/daggerheart/DhCommunityMetaField";
import DhAdversaryMetaField from "@/app/lib/definitions/enums/daggerheart/DhAdversaryMetaField";
import DhEnvironmentMetaField from "@/app/lib/definitions/enums/daggerheart/DhEnvironmentMetaField";
import DhWeaponMetaField from "@/app/lib/definitions/enums/daggerheart/DhWeaponMetaField";
import DhArmorMetaField from "@/app/lib/definitions/enums/daggerheart/DhArmorMetaField";
import DhLootMetaField from "@/app/lib/definitions/enums/daggerheart/DhLootMetaField";

/**
 * Which fields make up each page, in order.
 *
 * These are **keys into `pageMetaFields`**, not `PageMeta` values: a key is
 * what every other layer needs (it is also the payload key and the DB column),
 * and `MetaConfigKey` is the union of the real keys, so a wrong one is a
 * compile error.
 *
 * That matters here more than most places. This file previously held values and
 * reached them by camelCase property access — `pageMetaFields.tempoDiLancio`,
 * where the key is `tempodilancio` — so nine entries were `undefined` at
 * runtime and nothing said a word. The enum members below carry the lowercase
 * values while reading as the camelCase names, which is exactly the mismatch
 * that made the old form so easy to get wrong.
 *
 * `id`, `name`, `description` and `imageId` (SPEC-020 T3) are declared
 * directly in `pageMetaFields` rather than in a domain meta, so they are
 * plain string keys. `alignment`
 * and `alignmentDomain` are declared in `npcMeta` and shared with deities,
 * which is why the deity list reaches for `NpcMetaField`.
 *
 * `system` marks a catalogue page as belonging to one game system; absent
 * means the page is shared by every system (ADR-0013 rule 4). A catalogue
 * route enforces it with `assertPageSystem`.
 */
export interface PageConfig {
  fields: MetaConfigKey[];
  system?: GameSystem;
}

const pagesConfig: Record<PageType, PageConfig> = {
  [PageType.Spell]: {
    fields: [
      "id",
      "name",
      "description",
      SpellMetaField.level,
      SpellMetaField.circle,
      SpellMetaField.classes,
      SpellMetaField.castingTime,
      SpellMetaField.range,
      SpellMetaField.components,
      SpellMetaField.duration,
      SpellMetaField.savingThrow,
      SpellMetaField.ritual,
      SpellMetaField.upcast,
      SpellMetaField.concentration,
    ],
    system: "dnd5e",
  },
  [PageType.MagicItem]: {
    fields: [
      "id",
      "imageId",
      "description",
      "name",
      MagicItemMetaField.rarity,
      MagicItemMetaField.type,
      MagicItemMetaField.attuned,
      MagicItemMetaField.consumable,
      "revealedToDnd5e",
    ],
    system: "dnd5e",
  },
  [PageType.Npc]: {
    fields: [
      "id",
      "imageId",
      "description",
      "name",
      NpcMetaField.title,
      NpcMetaField.alignment,
      NpcMetaField.alignmentDomain,
      NpcMetaField.position,
      NpcMetaField.faction,
      NpcMetaField.appearance,
      NpcMetaField.personality,
      NpcMetaField.motivations,
      NpcMetaField.secrets,
      "revealedTo",
    ],
  },
  [PageType.Deity]: {
    fields: [
      "id",
      "imageId",
      "name",
      DeityMetaField.deityTitle,
      DeityMetaField.deityType,
      DeityMetaField.deityRank,
      DeityMetaField.tarotCard,
      DeityMetaField.celestialBody,
      DeityMetaField.element,
      DeityMetaField.deityClass,
      DeityMetaField.holidays,
      DeityMetaField.color,
      DeityMetaField.tradition,
      NpcMetaField.alignment,
      NpcMetaField.alignmentDomain,
      DeityMetaField.meaning,
      "revealedTo",
    ],
  },
  // No domain meta: `id`, `name` and `description` are declared directly in
  // `pageMetaFields`, and a faction has no field beyond them (SPEC-006 §7).
  [PageType.Faction]: {
    fields: ["id", "name", "description", "imageId", "revealedTo"],
  },
  // The seventh domain (SPEC-013 §6/§7) — same shape as magic items.
  [PageType.Treasure]: {
    fields: [
      "id",
      "imageId",
      "name",
      "description",
      TreasureMetaField.category,
      TreasureMetaField.value,
    ],
    system: "dnd5e",
  },
  // SPEC-021 T2 — a domain's emblem is the shared image field.
  [PageType.DhDomain]: {
    fields: [
      "id",
      "imageId",
      DhDomainMetaField.name,
      DhDomainMetaField.description,
      DhDomainMetaField.colour,
      DhDomainMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-021 T3.
  [PageType.DhDomainCard]: {
    fields: [
      "id",
      DhDomainCardMetaField.name,
      DhDomainCardMetaField.domainId,
      DhDomainCardMetaField.cardLevel,
      DhDomainCardMetaField.recallCost,
      DhDomainCardMetaField.cardType,
      DhDomainCardMetaField.featureText,
      DhDomainCardMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-021 T4. The class's features are an inline collection (ADR-0011),
  // not fields: `dhClassFeatureMeta` declares them.
  [PageType.DhClass]: {
    fields: [
      "id",
      DhClassMetaField.name,
      DhClassMetaField.description,
      DhClassMetaField.domainAId,
      DhClassMetaField.domainBId,
      DhClassMetaField.startingEvasion,
      DhClassMetaField.startingHp,
      DhClassMetaField.classItems,
      DhClassMetaField.hopeFeatureName,
      DhClassMetaField.hopeFeatureText,
      DhClassMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-021 T5. Tiered features are inline too (`dhSubclassFeatureMeta`).
  [PageType.DhSubclass]: {
    fields: [
      "id",
      DhSubclassMetaField.name,
      DhSubclassMetaField.description,
      DhSubclassMetaField.classId,
      DhSubclassMetaField.spellcastTrait,
      DhSubclassMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-027 T2. Its two features are fields, not an inline collection:
  // there are always exactly two (SPEC-027 §6).
  [PageType.DhAncestry]: {
    fields: [
      "id",
      "imageId",
      DhAncestryMetaField.name,
      DhAncestryMetaField.description,
      DhAncestryMetaField.featureAName,
      DhAncestryMetaField.featureAText,
      DhAncestryMetaField.featureBName,
      DhAncestryMetaField.featureBText,
      DhAncestryMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-027 T3. Its places and factions are links into the shared world.
  [PageType.DhCommunity]: {
    fields: [
      "id",
      "imageId",
      DhCommunityMetaField.name,
      DhCommunityMetaField.description,
      DhCommunityMetaField.adjectives,
      DhCommunityMetaField.featureName,
      DhCommunityMetaField.featureText,
      DhCommunityMetaField.placeIds,
      DhCommunityMetaField.factionIds,
      DhCommunityMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-028 T2. Its experiences and features are inline rows (ADR-0011).
  [PageType.DhAdversary]: {
    fields: [
      "id",
      "imageId",
      DhAdversaryMetaField.name,
      DhAdversaryMetaField.description,
      DhAdversaryMetaField.tier,
      DhAdversaryMetaField.adversaryType,
      DhAdversaryMetaField.hordeDensity,
      DhAdversaryMetaField.motives,
      DhAdversaryMetaField.difficulty,
      DhAdversaryMetaField.majorThreshold,
      DhAdversaryMetaField.severeThreshold,
      DhAdversaryMetaField.hp,
      DhAdversaryMetaField.stress,
      DhAdversaryMetaField.attackModifier,
      DhAdversaryMetaField.attackName,
      DhAdversaryMetaField.attackRange,
      DhAdversaryMetaField.attackDamage,
      DhAdversaryMetaField.attackType,
      DhAdversaryMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-028 T3. Its features are inline rows (ADR-0011); its adversaries
  // and places are links.
  [PageType.DhEnvironment]: {
    fields: [
      "id",
      "imageId",
      DhEnvironmentMetaField.name,
      DhEnvironmentMetaField.description,
      DhEnvironmentMetaField.tier,
      DhEnvironmentMetaField.environmentType,
      DhEnvironmentMetaField.impulses,
      DhEnvironmentMetaField.difficulty,
      DhEnvironmentMetaField.adversaryIds,
      DhEnvironmentMetaField.otherAdversaries,
      DhEnvironmentMetaField.placeIds,
      DhEnvironmentMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-029 T2. One optional feature, as two fields.
  [PageType.DhWeapon]: {
    fields: [
      "id",
      "imageId",
      DhWeaponMetaField.name,
      DhWeaponMetaField.tier,
      DhWeaponMetaField.slot,
      DhWeaponMetaField.trait,
      DhWeaponMetaField.range,
      DhWeaponMetaField.damageDie,
      DhWeaponMetaField.damageBonus,
      DhWeaponMetaField.damageType,
      DhWeaponMetaField.burden,
      DhWeaponMetaField.featureName,
      DhWeaponMetaField.featureText,
      DhWeaponMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-029 T3.
  [PageType.DhArmor]: {
    fields: [
      "id",
      "imageId",
      DhArmorMetaField.name,
      DhArmorMetaField.tier,
      DhArmorMetaField.major,
      DhArmorMetaField.severe,
      DhArmorMetaField.armorScore,
      DhArmorMetaField.featureName,
      DhArmorMetaField.featureText,
      DhArmorMetaField.origin,
    ],
    system: "daggerheart",
  },
  // SPEC-029 T4. The DM's alone (§9 decision 1).
  [PageType.DhLoot]: {
    fields: [
      "id",
      "imageId",
      DhLootMetaField.name,
      DhLootMetaField.kind,
      DhLootMetaField.rarity,
      DhLootMetaField.rollValue,
      DhLootMetaField.effectText,
      DhLootMetaField.origin,
    ],
    system: "daggerheart",
  },
};

export default pagesConfig;
