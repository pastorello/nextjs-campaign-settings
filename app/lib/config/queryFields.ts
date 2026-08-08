import MagicItemMetaField from "../definitions/enums/magicitem/MagicItemMetaField";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import PageType from "../definitions/types/PageType";
import DeityMetaField from "../definitions/enums/deities/DeityMetaField";
import NpcMetaField from "../definitions/enums/npc/NpcMetaField";
import SpellMetaField from "../definitions/enums/spells/SpellMetaField";

/**
 * The fields a domain can be filtered by, declared once (TD-12).
 *
 * **Why once matters.** `fetchFilteredX` and `getXCount` each used to carry
 * their own copy of this list, and they had drifted: the spell count was
 * missing `nome`, and the NPC count listed four of the twelve fields the NPC
 * fetch used. Since both build a `where` from the same search params, that
 * meant the header could describe a different result set than the table below
 * it — and it did, reproducibly:
 *
 *     /dashboard/admin/png?titolo=Arcivescovo
 *       header: "119 di 119 PNG trovati"
 *       table:  0 rows
 *
 * The rows were filtered, the count was not, and the pagination control offered
 * four pages of nothing. Reachable by editing the URL today; reachable by
 * clicking as soon as a filter control is added for one of the missing fields.
 *
 * Both functions read this list now, so the two queries cannot disagree.
 */
const queryFields: Record<PageType, MetaConfigKey[]> = {
  [PageType.Spell]: [
    SpellMetaField.name,
    SpellMetaField.level,
    SpellMetaField.circle,
    SpellMetaField.classes,
    SpellMetaField.castingTime,
    SpellMetaField.range,
    SpellMetaField.components,
    SpellMetaField.duration,
    SpellMetaField.savingThrow,
    SpellMetaField.ritual,
    SpellMetaField.concentration,
    SpellMetaField.description,
    SpellMetaField.upcast,
  ],

  [PageType.Npc]: [
    NpcMetaField.name,
    NpcMetaField.title,
    NpcMetaField.alignment,
    NpcMetaField.alignmentDomain,
    NpcMetaField.position,
    NpcMetaField.faction,
    NpcMetaField.appearance,
    NpcMetaField.personality,
    NpcMetaField.motivations,
    NpcMetaField.secrets,
    NpcMetaField.description,
  ],

  [PageType.Deity]: [
    DeityMetaField.name,
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
    DeityMetaField.alignment,
    DeityMetaField.alignmentDomain,
    DeityMetaField.meaning,
  ],

  // No `nome` or `descrizione` here, unlike the other three. That is how both
  // magic item queries already were — they agreed with each other, so this
  // preserves their behaviour rather than quietly widening it.
  [PageType.MagicItem]: [
    MagicItemMetaField.rarity,
    MagicItemMetaField.type,
    MagicItemMetaField.attuned,
  ],
};

export default queryFields;
