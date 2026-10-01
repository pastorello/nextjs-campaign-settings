import { z } from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhCommunityMetaField from "@/app/lib/definitions/enums/daggerheart/DhCommunityMetaField";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";

import { featureName, featureText } from "./dhFeatureFields";

/**
 * Ids of linked records; that each exists is the action's job. Optional: a
 * payload that leaves the field out links nothing on create and leaves the
 * links alone on update, like `revealedTo`.
 */
const linkIdsValidator = z.array(z.number().int().positive()).optional();

/**
 * A Daggerheart community's own fields (SPEC-027). `name`, `description`,
 * `imageId` and `origin` are shared declarations in `pageMetaFields`. Its
 * one feature is required. The places and factions it belongs to are
 * links into the shared world (SPEC-018 §6), relation-backed multiselects.
 */
const dhCommunityMeta = {
  // One line of characteristic adjectives, optional.
  [DhCommunityMetaField.adjectives]: {
    metaField: DhCommunityMetaField.adjectives,
    labelKey: "dhCommunities.fields.adjectives.label",
    placeholderKey: "dhCommunities.fields.adjectives.placeholder",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    // Nullable column — see `nullableToOptional` (TD-130).
    validator: nullableToOptional(z.string().optional()),
    getDatum: (datum: string) => datum,
  },
  [DhCommunityMetaField.featureName]: featureName(
    "dhCommunities.fields.featureName.label",
    DhCommunityMetaField.featureName
  ),
  [DhCommunityMetaField.featureText]: featureText(
    "dhCommunities.fields.featureText.label",
    DhCommunityMetaField.featureText
  ),
  [DhCommunityMetaField.placeIds]: {
    metaField: DhCommunityMetaField.placeIds,
    labelKey: "dhCommunities.fields.placeIds.label",
    defaultValue: [],
    fieldType: FieldType.array,
    optionTable: "zone",
    controlType: ControlType.Multiselect,
    validator: linkIdsValidator,
  },
  [DhCommunityMetaField.factionIds]: {
    metaField: DhCommunityMetaField.factionIds,
    labelKey: "dhCommunities.fields.factionIds.label",
    defaultValue: [],
    fieldType: FieldType.array,
    optionTable: "faction",
    controlType: ControlType.Multiselect,
    validator: linkIdsValidator,
  },
} satisfies Record<string, PageMeta>;

export default dhCommunityMeta;
