import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import DeityMetaField from "@/app/lib/definitions/enums/deities/DeityMetaField";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";

import magicColors from "./magicColors";
import z from "zod";
import tarotCards from "./tarotCards";
import deityTypes from "./deityTypes";
import deityLevels from "./deityLevels";
import celestialBodies from "../geography/celestialBodies";
import energyElements from "./energyElements";
import subclasses from "../spells/subclasses";
import traditionTypes from "./traditionTypes";
import celestialPlanes from "../geography/celestialPlanes";

const deitiesMeta = {
  [DeityMetaField.color]: {
    metaField: "color",
    labelKey: "deities.fields.color.label",
    defaultValue: firstOptionValue(magicColors),
    fieldType: FieldType.integer,
    options: magicColors,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
  },
  [DeityMetaField.deityTitle]: {
    metaField: "deityTitle",
    labelKey: "deities.fields.deityTitle.label",
    defaultValue: "",
    placeholderKey: "deities.fields.deityTitle.placeholder",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
  [DeityMetaField.deityType]: {
    metaField: "deityType",
    labelKey: "deities.fields.deityType.label",
    defaultValue: firstOptionValue(deityTypes),
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: deityTypes,
  },
  [DeityMetaField.deityRank]: {
    metaField: "deityRank",
    labelKey: "deities.fields.deityRank.label",
    defaultValue: firstOptionValue(deityLevels),
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: deityLevels,
  },
  [DeityMetaField.tarotCard]: {
    metaField: "tarotCard",
    labelKey: "deities.fields.tarotCard.label",
    defaultValue: firstOptionValue(tarotCards),
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: tarotCards,
  },
  [DeityMetaField.celestialBody]: {
    metaField: "celestialBody",
    labelKey: "deities.fields.celestialBody.label",
    defaultValue: firstOptionValue(celestialBodies),
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: celestialBodies,
  },
  [DeityMetaField.element]: {
    metaField: "element",
    labelKey: "deities.fields.element.label",
    defaultValue: firstOptionValue(energyElements),
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: energyElements,
  },
  [DeityMetaField.deityClass]: {
    metaField: "deityClass",
    labelKey: "deities.fields.deityClass.label",
    defaultValue: firstOptionValue(subclasses),
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: subclasses,
  },
  [DeityMetaField.holidays]: {
    metaField: "holidays",
    labelKey: "deities.fields.holidays.label",
    defaultValue: "",
    placeholderKey: "deities.fields.holidays.placeholder",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
  [DeityMetaField.tradition]: {
    metaField: "tradition",
    labelKey: "deities.fields.tradition.label",
    defaultValue: firstOptionValue(traditionTypes),
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: traditionTypes,
  },
  [DeityMetaField.residence]: {
    metaField: "residence",
    labelKey: "deities.fields.residence.label",
    defaultValue: firstOptionValue(celestialPlanes),
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: celestialPlanes,
  },
  [DeityMetaField.meaning]: {
    metaField: "meaning",
    labelKey: "deities.fields.meaning.label",
    defaultValue: "",
    placeholderKey: "deities.fields.meaning.placeholder",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
} satisfies Record<string, PageMeta>;

export default deitiesMeta;
