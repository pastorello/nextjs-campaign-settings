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

const pngMeta: Record<string, PageMeta> = {
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
    defaultValue: allineamenti[0].value,
    metaField: PngMetaField.allineamento,
    fieldType: FieldType.integer,
    options: allineamenti,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(allineamenti, datum),
  },
  [PngMetaField.dominioAllineamento]: {
    label: "Dominio",
    defaultValue: dominiAllineamenti[0].value,
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
    defaultValue: locationList[0].value,
    metaField: PngMetaField.luogo,
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    options: locationList,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(locationList, datum),
  },
  [PngMetaField.fazione]: {
    label: "Fazione",
    defaultValue: fazioni[0].value,
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
};

export default pngMeta;
