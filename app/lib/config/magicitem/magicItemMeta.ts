import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import z from "zod";

import rarity from "./rarity";
import itemTypes from "./item-types";
import getDataLabel from "../../utils/data/getDataLabel";

const magicItemsMeta = {
  [MagicItemMetaField.rarita]: {
    metaField: "rarita",
    label: "Rarità",
    defaultValue: firstOptionValue(rarity),
    fieldType: FieldType.integer,
    options: rarity,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(rarity, datum),
  },
  [MagicItemMetaField.tipo]: {
    metaField: "tipo",
    label: "Tipo di oggetto",
    defaultValue: firstOptionValue(itemTypes),
    fieldType: FieldType.integer,
    options: itemTypes,
    controlType: ControlType.Select,
    validator: z.number().int(),
    getDatum: (datum: number) => getDataLabel(itemTypes, datum),
  },
  [MagicItemMetaField.sintonia]: {
    metaField: "sintonia",
    label: "Richiede sintonia",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean().optional(),
    getDatum: (datum: boolean) => (datum === true ? "Sì" : "No"),
  },
} satisfies Record<string, PageMeta>;

export default magicItemsMeta;
