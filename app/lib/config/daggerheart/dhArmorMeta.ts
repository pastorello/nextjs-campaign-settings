import { z } from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhArmorMetaField from "@/app/lib/definitions/enums/daggerheart/DhArmorMetaField";

import {
  optionalFeatureName,
  optionalFeatureText,
} from "./dhOptionalFeatureFields";

const threshold = (metaField: string, labelKey: string) =>
  ({
    metaField,
    labelKey,
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().min(1),
    getDatum: (datum: number) => datum,
  }) satisfies PageMeta;

/**
 * A Daggerheart armor (SPEC-029 §5). `name`, `imageId`, `origin` and
 * `tier` are shared declarations in `pageMetaFields`. Its thresholds are a
 * base the wearer's level raises; that Major is below Severe is
 * `armorShapeErrors`' rule, and the table's CHECK holds it again.
 */
const dhArmorMeta = {
  [DhArmorMetaField.major]: threshold(
    DhArmorMetaField.major,
    "dhArmor.fields.major.label"
  ),
  [DhArmorMetaField.severe]: threshold(
    DhArmorMetaField.severe,
    "dhArmor.fields.severe.label"
  ),
  // Armor Score is capped at 12 (`daggerheart.md` §8).
  [DhArmorMetaField.armorScore]: {
    metaField: DhArmorMetaField.armorScore,
    labelKey: "dhArmor.fields.armorScore.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().min(1).max(12),
    getDatum: (datum: number) => datum,
  },
  [DhArmorMetaField.featureName]: optionalFeatureName(
    "dhEquipment.fields.featureName.label",
    DhArmorMetaField.featureName
  ),
  [DhArmorMetaField.featureText]: optionalFeatureText(
    "dhEquipment.fields.featureText.label",
    DhArmorMetaField.featureText
  ),
} satisfies Record<string, PageMeta>;

export default dhArmorMeta;
