import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import z from "zod";

import rarity from "./rarity";
import itemTypes from "./item-types";

const magicItemsMeta = {
  [MagicItemMetaField.rarity]: {
    metaField: "rarity",
    labelKey: "magicItems.fields.rarity.label",
    defaultValue: firstOptionValue(rarity),
    fieldType: FieldType.integer,
    options: rarity,
    controlType: ControlType.Select,
    validator: z.number().int(),
  },
  [MagicItemMetaField.type]: {
    metaField: "type",
    labelKey: "magicItems.fields.type.label",
    defaultValue: firstOptionValue(itemTypes),
    fieldType: FieldType.integer,
    options: itemTypes,
    controlType: ControlType.Select,
    validator: z.number().int(),
  },
  [MagicItemMetaField.attuned]: {
    metaField: "attuned",
    labelKey: "magicItems.fields.attuned.label",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean().optional(),
    getDatum: (datum: boolean) => (datum === true ? "Sì" : "No"),
  },
} satisfies Record<string, PageMeta>;

export default magicItemsMeta;
