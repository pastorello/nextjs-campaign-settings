import PageType from "@/app/lib/definitions/types/PageType";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";
import GameSystem from "@/app/lib/definitions/GameSystem";

import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";
import DeityMetaField from "@/app/lib/definitions/enums/deities/DeityMetaField";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import TreasureMetaField from "@/app/lib/definitions/enums/treasure/TreasureMetaField";

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
    ],
  },
  // No domain meta: `id`, `name` and `description` are declared directly in
  // `pageMetaFields`, and a faction has no field beyond them (SPEC-006 §7).
  [PageType.Faction]: {
    fields: ["id", "name", "description", "imageId"],
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
};

export default pagesConfig;
