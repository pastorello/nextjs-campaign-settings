import PageType from "@/app/lib/definitions/types/PageType";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";

import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";
import DeityMetaField from "@/app/lib/definitions/enums/deities/DeityMetaField";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";

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
 * `id`, `name` and `description` are declared directly in `pageMetaFields`
 * rather than in a domain meta, so they are plain string keys. `alignment`
 * and `alignmentDomain` are declared in `npcMeta` and shared with deities,
 * which is why the deity list reaches for `NpcMetaField`.
 */
const pagesConfig: Record<PageType, MetaConfigKey[]> = {
  [PageType.Spell]: [
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
  [PageType.MagicItem]: [
    "id",
    "description",
    "name",
    MagicItemMetaField.rarity,
    MagicItemMetaField.type,
    MagicItemMetaField.attuned,
  ],
  [PageType.Npc]: [
    "id",
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
  [PageType.Deity]: [
    "id",
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
};

export default pagesConfig;
