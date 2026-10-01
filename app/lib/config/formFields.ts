import MagicItemMetaField from "../definitions/enums/magicitem/MagicItemMetaField";
import TreasureMetaField from "../definitions/enums/treasure/TreasureMetaField";
import DhDomainMetaField from "../definitions/enums/daggerheart/DhDomainMetaField";
import DhDomainCardMetaField from "../definitions/enums/daggerheart/DhDomainCardMetaField";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import DeityMetaField from "../definitions/enums/deities/DeityMetaField";
import NpcMetaField from "../definitions/enums/npc/NpcMetaField";
import PageType from "../definitions/types/PageType";
import SpellMetaField from "../definitions/enums/spells/SpellMetaField";
import DhClassMetaField from "../definitions/enums/daggerheart/DhClassMetaField";
import DhSubclassMetaField from "../definitions/enums/daggerheart/DhSubclassMetaField";
import DhAncestryMetaField from "../definitions/enums/daggerheart/DhAncestryMetaField";
import DhCommunityMetaField from "../definitions/enums/daggerheart/DhCommunityMetaField";

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
    MagicItemMetaField.consumable,
    "imageId",
    // SPEC-022 T6: the campaigns that see the record.
    "revealedToDnd5e",
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
    "imageId",
    // SPEC-022 T6: the campaigns that see the record.
    "revealedTo",
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
    "imageId",
    // SPEC-022 T6: the campaigns that see the record.
    "revealedTo",
  ],

  // SPEC-022 T6: `revealedTo`, the campaigns that see the record.
  [PageType.Faction]: ["name", "description", "imageId", "revealedTo"],

  [PageType.Treasure]: [
    TreasureMetaField.name,
    TreasureMetaField.description,
    TreasureMetaField.category,
    TreasureMetaField.value,
    "imageId",
  ],

  [PageType.DhDomain]: [
    DhDomainMetaField.name,
    DhDomainMetaField.description,
    DhDomainMetaField.colour,
    DhDomainMetaField.origin,
    DhDomainMetaField.imageId,
  ],

  [PageType.DhDomainCard]: [
    DhDomainCardMetaField.name,
    DhDomainCardMetaField.domainId,
    DhDomainCardMetaField.cardLevel,
    DhDomainCardMetaField.recallCost,
    DhDomainCardMetaField.cardType,
    DhDomainCardMetaField.featureText,
    DhDomainCardMetaField.origin,
  ],

  [PageType.DhClass]: [
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

  [PageType.DhSubclass]: [
    DhSubclassMetaField.name,
    DhSubclassMetaField.description,
    DhSubclassMetaField.classId,
    DhSubclassMetaField.spellcastTrait,
    DhSubclassMetaField.origin,
  ],

  [PageType.DhAncestry]: [
    DhAncestryMetaField.name,
    DhAncestryMetaField.description,
    DhAncestryMetaField.featureAName,
    DhAncestryMetaField.featureAText,
    DhAncestryMetaField.featureBName,
    DhAncestryMetaField.featureBText,
    DhAncestryMetaField.origin,
    DhAncestryMetaField.imageId,
  ],

  [PageType.DhCommunity]: [
    DhCommunityMetaField.name,
    DhCommunityMetaField.description,
    DhCommunityMetaField.adjectives,
    DhCommunityMetaField.featureName,
    DhCommunityMetaField.featureText,
    DhCommunityMetaField.placeIds,
    DhCommunityMetaField.factionIds,
    DhCommunityMetaField.origin,
    DhCommunityMetaField.imageId,
  ],
};

export default formFields;
