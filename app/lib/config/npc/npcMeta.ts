import firstOptionValue from "../firstOptionValue";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";
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

const npcMeta = {
  [NpcMetaField.title]: {
    label: "Titolo",
    defaultValue: "",
    placeholder: "Inserisci titolo",
    metaField: "title",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().optional(),
    getDatum: (datum: string) => datum,
  },
  [NpcMetaField.alignment]: {
    label: "Allineamento",
    defaultValue: firstOptionValue(allineamenti),
    metaField: NpcMetaField.alignment,
    fieldType: FieldType.integer,
    options: allineamenti,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(allineamenti, datum),
  },
  [NpcMetaField.alignmentDomain]: {
    label: "Dominio",
    defaultValue: firstOptionValue(dominiAllineamenti),
    metaField: NpcMetaField.alignmentDomain,
    fieldType: FieldType.integer,
    options: dominiAllineamenti,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(dominiAllineamenti, datum),
  },
  [NpcMetaField.position]: {
    label: "Mansione",
    defaultValue: "",
    metaField: NpcMetaField.position,
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    placeholder: "Inserisci mansione",
    validator: z.string().optional(),
    getDatum: (datum: string) => datum,
  },
  [NpcMetaField.location]: {
    label: "Luogo",
    defaultValue: firstOptionValue(locationList),
    metaField: NpcMetaField.location,
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    options: locationList,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(locationList, datum),
  },
  [NpcMetaField.faction]: {
    label: "Fazione",
    defaultValue: firstOptionValue(fazioni),
    metaField: NpcMetaField.faction,
    fieldType: FieldType.integer,
    options: fazioni,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(fazioni, datum),
  },
  [NpcMetaField.appearance]: {
    label: "Aspetto",
    defaultValue: "",
    metaField: NpcMetaField.appearance,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci aspetto",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [NpcMetaField.personality]: {
    label: "Personalità",
    defaultValue: "",
    metaField: NpcMetaField.personality,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci personalità",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [NpcMetaField.motivations]: {
    label: "Motivazioni",
    defaultValue: "",
    metaField: NpcMetaField.motivations,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci motivazioni",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [NpcMetaField.secrets]: {
    label: "Segreti",
    defaultValue: "",
    metaField: NpcMetaField.secrets,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci segreti",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
} satisfies Record<string, PageMeta>;

export default npcMeta;
