import MagicItemMetaField from "../definitions/enums/magicitem/MagicItemMetaField";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import DeityMetaField from "../definitions/enums/deities/DeityMetaField";
import NpcMetaField from "../definitions/enums/npc/NpcMetaField";
import PageType from "../definitions/types/PageType";
import SpellMetaField from "../definitions/enums/spells/SpellMetaField";

/**
 * The fields each domain's form holds state for (TD-09).
 *
 * **Why this is not `pagesConfig`.** That lists every field an entity *has*,
 * and drives validation. This lists the fields a form *edits*, which is a
 * smaller set — and the difference is not always deliberate. `pagesConfig`
 * declares `tiroSalvezza` and `concentrazione` for spells; no form control and
 * no hook state has ever existed for either, so neither can be set from the UI
 * at all despite having a column, metadata and a validator. Keeping the two
 * lists separate records that gap instead of silently closing it: adding those
 * fields to a form is a product decision, not a refactor.
 *
 * These lists reproduce exactly what the four page-manager hooks held before
 * they were collapsed. Any change to them is a behaviour change.
 */
const formFields: Record<PageType, MetaConfigKey[]> = {
  [PageType.Spell]: [
    SpellMetaField.name,
    SpellMetaField.description,
    SpellMetaField.level,
    SpellMetaField.circle,
    SpellMetaField.classes,
    SpellMetaField.castingTime,
    SpellMetaField.range,
    SpellMetaField.components,
    SpellMetaField.duration,
    SpellMetaField.ritual,
    SpellMetaField.upcast,
  ],

  [PageType.MagicItem]: [
    MagicItemMetaField.name,
    MagicItemMetaField.description,
    MagicItemMetaField.rarity,
    MagicItemMetaField.type,
    MagicItemMetaField.attuned,
  ],

  [PageType.Npc]: [
    NpcMetaField.name,
    NpcMetaField.description,
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

  // No `descrizione`: deities carry `significato` instead, and the schema has
  // no descrizione column for them.
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

  [PageType.Faction]: ["name", "description"],
};

export default formFields;
