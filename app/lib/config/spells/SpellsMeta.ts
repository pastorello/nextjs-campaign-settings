import firstOptionValue from "../firstOptionValue";
import SpellMetaField from "../../definitions/enums/spells/SpellMetaField";
import PageMeta from "../../definitions/interfaces/meta/PageMeta";
import ControlType from "../../definitions/types/ControlType";
import FieldType from "../../definitions/types/FieldType";
import z from "zod";
import classes from "./classes";
import durate from "./durate";
import gittate from "./gittate";
import levels from "./levels";
import subclasses from "./subclasses";
import tempiDiLancio from "./tempiDiLancio";
import tiriSalvezza from "./tiriSalvezza";
import renderRichText from "../../utils/data/renderRichText";

const spellsMeta = {
  [SpellMetaField.level]: {
    metaField: "level",
    label: "Livello",
    defaultValue: 0,
    fieldType: FieldType.integer,
    options: levels,
    controlType: ControlType.Select,
    validator: z.number().int(),
  },
  [SpellMetaField.circle]: {
    metaField: "circle",
    label: "Sottoclassi",
    defaultValue: [],
    fieldType: FieldType.array,
    options: subclasses,
    controlType: ControlType.Multiselect,
    validator: z.array(z.number().int()),
  },
  [SpellMetaField.classes]: {
    metaField: "classes",
    label: "Classi",
    defaultValue: [],
    fieldType: FieldType.array,
    options: classes.map((item) => ({
      value: item.value,
      labelKey: item.labelKey,
    })),
    controlType: ControlType.Multiselect,
    validator: z.array(z.number().int()),
  },
  [SpellMetaField.castingTime]: {
    metaField: "castingTime",
    label: "Tempo di lancio",
    defaultValue: firstOptionValue(tempiDiLancio),
    fieldType: FieldType.string,
    options: tempiDiLancio,
    controlType: ControlType.Select,
    validator: z.string().min(1),
  },
  [SpellMetaField.range]: {
    metaField: "range",
    label: "Gittata",
    defaultValue: firstOptionValue(gittate),
    fieldType: FieldType.string,
    options: gittate,
    controlType: ControlType.Select,
    validator: z.string().min(1),
  },
  [SpellMetaField.components]: {
    metaField: "components",
    label: "Componenti",
    defaultValue: "V,S,M",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().min(1),
    getDatum: (datum: string) => datum,
  },
  [SpellMetaField.duration]: {
    metaField: "duration",
    label: "Durata",
    defaultValue: firstOptionValue(durate),
    fieldType: FieldType.string,
    options: durate,
    controlType: ControlType.Select,
    validator: z.string().min(1),
  },
  [SpellMetaField.savingThrow]: {
    metaField: "savingThrow",
    label: "Tiro salvezza",
    defaultValue: firstOptionValue(tiriSalvezza),
    fieldType: FieldType.string,
    options: tiriSalvezza,
    controlType: ControlType.Select,
    validator: z.string().optional(),
  },
  [SpellMetaField.ritual]: {
    metaField: "ritual",
    label: "Rituale",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean().optional(),
    getDatum: (datum: boolean) => (datum === true ? "Rituale" : ""),
  },
  [SpellMetaField.concentration]: {
    metaField: "concentration",
    label: "Richiede concentrazione",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean().optional(),
    getDatum: (datum: boolean) => (datum === true ? "Sì" : "No"),
  },
  [SpellMetaField.upcast]: {
    metaField: "upcast",
    label: "Ai livelli superiori",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci testo...",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
} satisfies Record<string, PageMeta>;

export default spellsMeta;
