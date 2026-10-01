import { z } from "zod";

import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhEnvironmentMetaField from "@/app/lib/definitions/enums/daggerheart/DhEnvironmentMetaField";
import DhEnvironmentType from "@/app/lib/definitions/enums/daggerheart/DhEnvironmentType";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";

import dhEnvironmentTypes from "./dhEnvironmentTypes";

/**
 * Ids of linked records; that each exists is the action's job. Optional, as
 * a community's links are: left out, nothing is linked on create and the
 * links are kept on update.
 */
const linkIdsValidator = z.array(z.number().int().positive()).optional();

/** One optional line of plain text. */
const optionalLine = (metaField: string, labelKey: string) =>
  ({
    metaField,
    labelKey,
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    // Nullable column — see `nullableToOptional` (TD-130).
    validator: nullableToOptional(z.string().optional()),
    getDatum: (datum: string) => datum,
  }) satisfies PageMeta;

/**
 * A Daggerheart environment's stat block (SPEC-028 §5). `name`,
 * `description`, `imageId`, `origin`, `tier` and `difficulty` are shared
 * declarations in `pageMetaFields`. Its potential adversaries are links to
 * `dhAdversary` rows plus a free-text line for the rest; its places are
 * links into the shared world.
 */
const dhEnvironmentMeta = {
  [DhEnvironmentMetaField.environmentType]: {
    metaField: DhEnvironmentMetaField.environmentType,
    labelKey: "dhEnvironments.fields.environmentType.label",
    defaultValue: firstOptionValue(dhEnvironmentTypes),
    fieldType: FieldType.string,
    options: dhEnvironmentTypes,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhEnvironmentType),
  },
  [DhEnvironmentMetaField.impulses]: optionalLine(
    DhEnvironmentMetaField.impulses,
    "dhEnvironments.fields.impulses.label"
  ),
  [DhEnvironmentMetaField.adversaryIds]: {
    metaField: DhEnvironmentMetaField.adversaryIds,
    labelKey: "dhEnvironments.fields.adversaryIds.label",
    defaultValue: [],
    fieldType: FieldType.array,
    optionTable: "dhAdversary",
    controlType: ControlType.Multiselect,
    validator: linkIdsValidator,
  },
  [DhEnvironmentMetaField.otherAdversaries]: optionalLine(
    DhEnvironmentMetaField.otherAdversaries,
    "dhEnvironments.fields.otherAdversaries.label"
  ),
  [DhEnvironmentMetaField.placeIds]: {
    metaField: DhEnvironmentMetaField.placeIds,
    labelKey: "dhEnvironments.fields.placeIds.label",
    defaultValue: [],
    fieldType: FieldType.array,
    optionTable: "zone",
    controlType: ControlType.Multiselect,
    validator: linkIdsValidator,
  },
} satisfies Record<string, PageMeta>;

export default dhEnvironmentMeta;
