import firstOptionValue from "../firstOptionValue";
import PngMetaField from "@/app/lib/definitions/enums/png/PngMetaField";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import locationList from "@/app/lib/config/geography/locationList";
import z from "zod";

import dominiAllineamenti from "./dominiAllineamenti";
import allineamenti from "./allineamenti";
import fazioni from "./fazioni";
import getDataLabel from "../../utils/data/getDataLabel";
import renderRichText from "../../utils/data/renderRichText";

const pngMeta = {
  [PngMetaField.titolo]: {
    label: "Titolo",
    defaultValue: "",
    placeholder: "Inserisci titolo",
    metaField: "titolo",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().optional(),
    getDatum: (datum: string) => datum,
  },
  [PngMetaField.allineamento]: {
    label: "Allineamento",
    defaultValue: firstOptionValue(allineamenti),
    metaField: PngMetaField.allineamento,
    fieldType: FieldType.integer,
    options: allineamenti,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(allineamenti, datum),
  },
  [PngMetaField.dominioAllineamento]: {
    label: "Dominio",
    defaultValue: firstOptionValue(dominiAllineamenti),
    metaField: PngMetaField.dominioAllineamento,
    fieldType: FieldType.integer,
    options: dominiAllineamenti,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(dominiAllineamenti, datum),
  },
  [PngMetaField.mansione]: {
    label: "Mansione",
    defaultValue: "",
    metaField: PngMetaField.mansione,
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    placeholder: "Inserisci mansione",
    validator: z.string().optional(),
    getDatum: (datum: string) => datum,
  },
  [PngMetaField.luogo]: {
    label: "Luogo",
    defaultValue: firstOptionValue(locationList),
    metaField: PngMetaField.luogo,
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    options: locationList,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(locationList, datum),
  },
  [PngMetaField.fazione]: {
    label: "Fazione",
    defaultValue: firstOptionValue(fazioni),
    metaField: PngMetaField.fazione,
    fieldType: FieldType.integer,
    options: fazioni,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(fazioni, datum),
  },
  [PngMetaField.aspetto]: {
    label: "Aspetto",
    defaultValue: "",
    metaField: PngMetaField.aspetto,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci aspetto",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [PngMetaField.personalita]: {
    label: "Personalità",
    defaultValue: "",
    metaField: PngMetaField.personalita,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci personalità",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [PngMetaField.motivazioni]: {
    label: "Motivazioni",
    defaultValue: "",
    metaField: PngMetaField.motivazioni,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci motivazioni",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [PngMetaField.segreti]: {
    label: "Segreti",
    defaultValue: "",
    metaField: PngMetaField.segreti,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci segreti",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
} satisfies Record<string, PageMeta>;

export default pngMeta;
