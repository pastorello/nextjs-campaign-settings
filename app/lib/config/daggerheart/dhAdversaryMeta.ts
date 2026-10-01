import { z } from "zod";

import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhAdversaryMetaField from "@/app/lib/definitions/enums/daggerheart/DhAdversaryMetaField";
import DhAdversaryType from "@/app/lib/definitions/enums/daggerheart/DhAdversaryType";
import DhDamageType from "@/app/lib/definitions/enums/daggerheart/DhDamageType";
import DhRange from "@/app/lib/definitions/enums/daggerheart/DhRange";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import diceExpressionValidator from "@/app/lib/utils/validators/diceExpressionValidator";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";

import dhAdversaryTypes from "./dhAdversaryTypes";
import dhDamageTypes from "./dhDamageTypes";
import dhRanges from "./dhRanges";

/**
 * A whole number of at least 1, or nothing: a blank box is `null`, not `0`
 * (TD-130's convention). Whether it may be blank depends on the type, a
 * cross-field rule `adversaryShapeErrors` states.
 */
const nullableCountValidator = () =>
  z.preprocess(
    (raw) => (raw === "" || raw === undefined ? null : raw),
    z.coerce.number().int().min(1).nullable()
  );

const showNullable = (datum: number | null) => (datum === null ? "—" : datum);

/**
 * A Daggerheart adversary's stat block (SPEC-028 §5). `name`,
 * `description`, `imageId`, `origin`, `tier` and `difficulty` are shared
 * declarations in `pageMetaFields`. The rules no single field can state —
 * a horde's density, a minion's missing thresholds, Major below Severe —
 * are `adversaryShapeErrors`', and the table's CHECKs hold them again.
 */
const dhAdversaryMeta = {
  [DhAdversaryMetaField.adversaryType]: {
    metaField: DhAdversaryMetaField.adversaryType,
    labelKey: "dhAdversaries.fields.adversaryType.label",
    defaultValue: firstOptionValue(dhAdversaryTypes),
    fieldType: FieldType.string,
    options: dhAdversaryTypes,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhAdversaryType),
  },
  // Creatures per HP: a horde's alone (SPEC-018 §5).
  [DhAdversaryMetaField.hordeDensity]: {
    metaField: DhAdversaryMetaField.hordeDensity,
    labelKey: "dhAdversaries.fields.hordeDensity.label",
    placeholderKey: "dhAdversaries.fields.hordeDensity.placeholder",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nullableCountValidator(),
    getDatum: showNullable,
  },
  [DhAdversaryMetaField.motives]: {
    metaField: DhAdversaryMetaField.motives,
    labelKey: "dhAdversaries.fields.motives.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.RichText,
    // Nullable column — see `nullableToOptional` (TD-130).
    validator: nullableToOptional(richTextValidator().optional()),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [DhAdversaryMetaField.majorThreshold]: {
    metaField: DhAdversaryMetaField.majorThreshold,
    labelKey: "dhAdversaries.fields.majorThreshold.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nullableCountValidator(),
    getDatum: showNullable,
  },
  [DhAdversaryMetaField.severeThreshold]: {
    metaField: DhAdversaryMetaField.severeThreshold,
    labelKey: "dhAdversaries.fields.severeThreshold.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nullableCountValidator(),
    getDatum: showNullable,
  },
  // HP and Stress slots are capped at 12 (`daggerheart.md` §8).
  [DhAdversaryMetaField.hp]: {
    metaField: DhAdversaryMetaField.hp,
    labelKey: "dhAdversaries.fields.hp.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().min(1).max(12),
    getDatum: (datum: number) => datum,
  },
  [DhAdversaryMetaField.stress]: {
    metaField: DhAdversaryMetaField.stress,
    labelKey: "dhAdversaries.fields.stress.label",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().min(0).max(12),
    getDatum: (datum: number) => datum,
  },
  // A bonus or a penalty: any whole number.
  [DhAdversaryMetaField.attackModifier]: {
    metaField: DhAdversaryMetaField.attackModifier,
    labelKey: "dhAdversaries.fields.attackModifier.label",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int(),
    getDatum: (datum: number) => (datum >= 0 ? `+${datum}` : `${datum}`),
  },
  [DhAdversaryMetaField.attackName]: {
    metaField: DhAdversaryMetaField.attackName,
    labelKey: "dhAdversaries.fields.attackName.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().trim().min(1),
    getDatum: (datum: string) => datum,
  },
  [DhAdversaryMetaField.attackRange]: {
    metaField: DhAdversaryMetaField.attackRange,
    labelKey: "dhAdversaries.fields.attackRange.label",
    defaultValue: firstOptionValue(dhRanges),
    fieldType: FieldType.string,
    options: dhRanges,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhRange),
  },
  [DhAdversaryMetaField.attackDamage]: {
    metaField: DhAdversaryMetaField.attackDamage,
    labelKey: "dhAdversaries.fields.attackDamage.label",
    placeholderKey: "dhAdversaries.fields.attackDamage.placeholder",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: diceExpressionValidator(),
    getDatum: (datum: string) => datum,
  },
  [DhAdversaryMetaField.attackType]: {
    metaField: DhAdversaryMetaField.attackType,
    labelKey: "dhAdversaries.fields.attackType.label",
    defaultValue: firstOptionValue(dhDamageTypes),
    fieldType: FieldType.string,
    options: dhDamageTypes,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhDamageType),
  },
} satisfies Record<string, PageMeta>;

export default dhAdversaryMeta;
