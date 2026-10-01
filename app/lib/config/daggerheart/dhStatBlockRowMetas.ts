import { z } from "zod";

import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhFeatureKind from "@/app/lib/definitions/enums/daggerheart/DhFeatureKind";
import DhStatBlockRowField from "@/app/lib/definitions/enums/daggerheart/DhStatBlockRowField";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";

import dhFeatureKinds from "./dhFeatureKinds";

/*
 * The scalar fields of a stat block's ordered rows (SPEC-028 §6) — outside
 * the metadata layer's registry (ADR-0011: rows edited inline on their
 * owner, with no list page of their own), declared here so the inline
 * editors and the actions consume these validators and label keys rather
 * than restating them. The owner's id is the action's to supply.
 */

const position = {
  metaField: DhStatBlockRowField.position,
  labelKey: "dhFeature.fields.position.label",
  defaultValue: 1,
  fieldType: FieldType.integer,
  controlType: ControlType.Text,
  validator: z.coerce.number().int().positive(),
} satisfies PageMeta;

const name = (labelKey: string) =>
  ({
    metaField: DhStatBlockRowField.name,
    labelKey,
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().trim().min(1),
  }) satisfies PageMeta;

const kind = {
  metaField: DhStatBlockRowField.kind,
  labelKey: "dhStatBlock.fields.kind.label",
  defaultValue: firstOptionValue(dhFeatureKinds),
  fieldType: FieldType.string,
  options: dhFeatureKinds,
  controlType: ControlType.Select,
  validator: z.nativeEnum(DhFeatureKind),
} satisfies PageMeta;

// Formatted (SPEC-019): sanitised first, then a feature with no words is
// refused.
const text = {
  metaField: DhStatBlockRowField.text,
  labelKey: "dhFeature.fields.text.label",
  defaultValue: "",
  fieldType: FieldType.string,
  controlType: ControlType.RichText,
  validator: richTextValidator().pipe(z.string().min(1)),
} satisfies PageMeta;

/** An adversary's experience: a name and its bonus. */
export const dhAdversaryExperienceMeta = {
  [DhStatBlockRowField.position]: position,
  [DhStatBlockRowField.name]: name("dhStatBlock.fields.experienceName.label"),
  [DhStatBlockRowField.bonus]: {
    metaField: DhStatBlockRowField.bonus,
    labelKey: "dhStatBlock.fields.bonus.label",
    defaultValue: 2,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().min(1),
  },
} satisfies Record<string, PageMeta>;

/** An adversary's feature: its kind, whether it costs Fear, name and text. */
export const dhAdversaryFeatureMeta = {
  [DhStatBlockRowField.position]: position,
  [DhStatBlockRowField.kind]: kind,
  [DhStatBlockRowField.fear]: {
    metaField: DhStatBlockRowField.fear,
    labelKey: "dhStatBlock.fields.fear.label",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean(),
  },
  [DhStatBlockRowField.name]: name("dhFeature.fields.name.label"),
  [DhStatBlockRowField.text]: text,
} satisfies Record<string, PageMeta>;

/** An environment's feature: kind, name, text and optional questions. */
export const dhEnvironmentFeatureMeta = {
  [DhStatBlockRowField.position]: position,
  [DhStatBlockRowField.kind]: kind,
  [DhStatBlockRowField.name]: name("dhFeature.fields.name.label"),
  [DhStatBlockRowField.text]: text,
  [DhStatBlockRowField.questions]: {
    metaField: DhStatBlockRowField.questions,
    labelKey: "dhStatBlock.fields.questions.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.RichText,
    // Nullable column — see `nullableToOptional` (TD-130).
    validator: nullableToOptional(richTextValidator().optional()),
  },
} satisfies Record<string, PageMeta>;
