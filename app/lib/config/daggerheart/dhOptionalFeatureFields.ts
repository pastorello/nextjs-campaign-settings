import { z } from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";

/*
 * The two halves of a piece of equipment's one optional feature (SPEC-029
 * §6), as metadata. Each is optional on its own; that they come as a pair
 * is `featurePairErrors`' rule, and the tables' CHECKs hold it again.
 */

/** An optional feature name. */
export const optionalFeatureName = (labelKey: string, metaField: string) =>
  ({
    metaField,
    labelKey,
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    // Nullable column — see `nullableToOptional` (TD-130).
    validator: nullableToOptional(z.string().trim().optional()),
    getDatum: (datum: string) => datum,
  }) satisfies PageMeta;

/** An optional feature text, formatted (SPEC-019). */
export const optionalFeatureText = (labelKey: string, metaField: string) =>
  ({
    metaField,
    labelKey,
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.RichText,
    validator: nullableToOptional(richTextValidator().optional()),
    getDatum: (datum: string) => renderRichText(datum),
  }) satisfies PageMeta;
