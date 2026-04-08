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
import getDataLabel from "../../utils/data/getDataLabel";
import renderRichText from "../../utils/data/renderRichText";

const spellsMeta: Record<string, PageMeta> = {
  [SpellMetaField.livello]: {
    metaField: "livello",
    label: "Livello",
    defaultValue: 0,
    fieldType: FieldType.integer,
    options: levels,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number, useShortLabel?: boolean) =>
      getDataLabel(levels, datum, useShortLabel ? "shortLabel" : "label"),
  },
  [SpellMetaField.circolo]: {
    metaField: "circolo",
    label: "Circolo",
    defaultValue: [],
    fieldType: FieldType.array,
    options: subclasses,
    controlType: ControlType.Multiselect,
    validator: z.array(z.number().int()),
    getDatum: (datum: number) => getDataLabel(subclasses, datum),
  },
  [SpellMetaField.classi]: {
    metaField: "classi",
    label: "Classi",
    defaultValue: [],
    fieldType: FieldType.array,
    options: classes.map((item) => ({
      value: item.value,
      label: item.label,
    })),
    controlType: ControlType.Multiselect,
    validator: z.array(z.number().int()),
    getDatum: (datum: number) => getDataLabel(classes, datum),
  },
  [SpellMetaField.sottoClassi]: {
    metaField: "sottoClassi",
    label: "Sottoclassi",
    defaultValue: [],
    fieldType: FieldType.array,
    options: subclasses,
    controlType: ControlType.Multiselect,
    validator: z.array(z.number().int()).optional(),
    getDatum: (datum: number) => getDataLabel(subclasses, datum),
  },
  [SpellMetaField.tempoDiLancio]: {
    metaField: "tempoDiLancio",
    label: "Tempo di lancio",
    defaultValue: tempiDiLancio[0].value,
    fieldType: FieldType.string,
    options: tempiDiLancio,
    controlType: ControlType.Select,
    validator: z.string().min(1),
    getDatum: (datum: number) => getDataLabel(tempiDiLancio, datum),
  },
  [SpellMetaField.gittata]: {
    metaField: "gittata",
    label: "Gittata",
    defaultValue: gittate[0].value,
    fieldType: FieldType.string,
    options: gittate,
    controlType: ControlType.Select,
    validator: z.string().min(1),
    getDatum: (datum: number) => getDataLabel(gittate, datum),
  },
  [SpellMetaField.componenti]: {
    metaField: "componenti",
    label: "Componenti",
    defaultValue: "V,S,M",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().min(1),
    getDatum: (datum: string) => datum,
  },
  [SpellMetaField.durata]: {
    metaField: "durata",
    label: "Durata",
    defaultValue: durate[0].value,
    fieldType: FieldType.string,
    options: durate,
    controlType: ControlType.Select,
    validator: z.string().min(1),
    getDatum: (datum: number) => getDataLabel(durate, datum),
  },
  [SpellMetaField.tiroSalvezza]: {
    metaField: "tiroSalvezza",
    label: "Tiro salvezza",
    defaultValue: tiriSalvezza[0].value,
    fieldType: FieldType.string,
    options: tiriSalvezza,
    controlType: ControlType.Select,
    validator: z.string().optional(),
    getDatum: (datum: number) => getDataLabel(tiriSalvezza, datum),
  },
  [SpellMetaField.rituale]: {
    metaField: "rituale",
    label: "Rituale",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean().optional(),
    getDatum: (datum: boolean) => (datum === true ? "Rituale" : ""),
  },
  [SpellMetaField.concentrazione]: {
    metaField: "concentrazione",
    label: "Richiede concentrazione",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean().optional(),
    getDatum: (datum: boolean) => (datum === true ? "Sì" : "No"),
  },
  [SpellMetaField.intensificato]: {
    metaField: "intensificato",
    label: "Ai livelli superiori",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci testo...",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
};

export default spellsMeta;
