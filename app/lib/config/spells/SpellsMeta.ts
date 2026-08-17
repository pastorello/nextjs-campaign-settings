import firstOptionValue from "../firstOptionValue";
import SpellMetaField from "../../definitions/enums/spells/SpellMetaField";
import PageMeta from "../../definitions/interfaces/meta/PageMeta";
import ControlType from "../../definitions/types/ControlType";
import FieldType from "../../definitions/types/FieldType";
import optionArrayValidator from "../../utils/validators/optionArrayValidator";
import optionValueValidator from "../../utils/validators/optionValueValidator";
import z from "zod";
import classes from "./classes";
import durations from "./durations";
import ranges from "./ranges";
import levels from "./levels";
import subclasses from "./subclasses";
import castingTimes from "./castingTimes";
import savingThrows from "./savingThrows";
import renderRichText from "../../utils/data/renderRichText";

const spellsMeta = {
  [SpellMetaField.level]: {
    metaField: "level",
    labelKey: "spells.fields.level.label",
    defaultValue: 0,
    fieldType: FieldType.integer,
    options: levels,
    controlType: ControlType.Select,
    validator: optionValueValidator(levels),
  },
  [SpellMetaField.circle]: {
    metaField: "circle",
    labelKey: "spells.fields.circle.label",
    defaultValue: [],
    fieldType: FieldType.array,
    options: subclasses,
    controlType: ControlType.Multiselect,
    validator: optionArrayValidator(subclasses),
  },
  [SpellMetaField.classes]: {
    metaField: "classes",
    labelKey: "spells.fields.classes.label",
    defaultValue: [],
    fieldType: FieldType.array,
    options: classes.map((item) => ({
      value: item.value,
      labelKey: item.labelKey,
    })),
    controlType: ControlType.Multiselect,
    validator: optionArrayValidator(classes),
  },
  [SpellMetaField.castingTime]: {
    metaField: "castingTime",
    labelKey: "spells.fields.castingTime.label",
    defaultValue: firstOptionValue(castingTimes),
    fieldType: FieldType.string,
    options: castingTimes,
    controlType: ControlType.Select,
    validator: z.string().min(1),
  },
  [SpellMetaField.range]: {
    metaField: "range",
    labelKey: "spells.fields.range.label",
    defaultValue: firstOptionValue(ranges),
    fieldType: FieldType.string,
    options: ranges,
    controlType: ControlType.Select,
    validator: z.string().min(1),
  },
  [SpellMetaField.components]: {
    metaField: "components",
    labelKey: "spells.fields.components.label",
    defaultValue: "V,S,M",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().min(1),
    getDatum: (datum: string) => datum,
  },
  [SpellMetaField.duration]: {
    metaField: "duration",
    labelKey: "spells.fields.duration.label",
    defaultValue: firstOptionValue(durations),
    fieldType: FieldType.string,
    options: durations,
    controlType: ControlType.Select,
    validator: z.string().min(1),
  },
  [SpellMetaField.savingThrow]: {
    metaField: "savingThrow",
    labelKey: "spells.fields.savingThrow.label",
    defaultValue: firstOptionValue(savingThrows),
    fieldType: FieldType.string,
    options: savingThrows,
    controlType: ControlType.Select,
    validator: z.string().optional(),
  },
  [SpellMetaField.ritual]: {
    metaField: "ritual",
    labelKey: "spells.fields.ritual.label",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean().optional(),
  },
  [SpellMetaField.concentration]: {
    metaField: "concentration",
    labelKey: "spells.fields.concentration.label",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean().optional(),
  },
  [SpellMetaField.upcast]: {
    metaField: "upcast",
    labelKey: "spells.fields.upcast.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholderKey: "spells.fields.upcast.placeholder",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
} satisfies Record<string, PageMeta>;

export default spellsMeta;
