import { z } from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhFeatureMetaField from "@/app/lib/definitions/enums/daggerheart/DhFeatureMetaField";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";

/**
 * A class feature's own scalar fields (SPEC-021 §6) — outside the metadata
 * layer's registry (ADR-0011: an ordered collection edited inline on its
 * class, with no list page of its own), declared here so the inline editor
 * and the actions consume these validators and label keys rather than
 * restating them. `dhSubclassFeatureMeta` adds `tier` to the same three.
 */
const dhClassFeatureMeta = {
  [DhFeatureMetaField.position]: {
    metaField: "position",
    labelKey: "dhFeature.fields.position.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().positive(),
  },
  [DhFeatureMetaField.name]: {
    metaField: "name",
    labelKey: "dhFeature.fields.name.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().trim().min(1),
  },
  // Formatted text (SPEC-019): the validator sanitises it, then refuses a
  // feature left with no words.
  [DhFeatureMetaField.text]: {
    metaField: "text",
    labelKey: "dhFeature.fields.text.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.RichText,
    validator: richTextValidator().pipe(z.string().min(1)),
  },
} satisfies Record<string, PageMeta>;

export default dhClassFeatureMeta;
