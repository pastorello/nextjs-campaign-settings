import { z } from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";

/*
 * The two halves of a fixed Daggerheart feature, as metadata (SPEC-027): an
 * ancestry's two and a community's one are columns, not ADR-0018's
 * per-owner feature rows, so each half is an ordinary required field.
 */

/** A required feature name: blank is refused like empty. */
export const featureName = (labelKey: string, metaField: string) =>
  ({
    metaField,
    labelKey,
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().trim().min(1),
    getDatum: (datum: string) => datum,
  }) satisfies PageMeta;

/**
 * A required feature text, formatted (SPEC-019): sanitised first, so
 * `.min(1)` judges what would be stored.
 */
export const featureText = (labelKey: string, metaField: string) =>
  ({
    metaField,
    labelKey,
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.RichText,
    validator: richTextValidator().pipe(z.string().min(1)),
    getDatum: (datum: string) => renderRichText(datum),
  }) satisfies PageMeta;
