import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import DeityMetaField from "@/app/lib/definitions/enums/deities/DeityMetaField";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";

import magicColors from "./magicColors";
import z from "zod";
import getDataLabel from "../../utils/data/getDataLabel";
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
    label: "Colore magia",
    defaultValue: firstOptionValue(magicColors),
    fieldType: FieldType.integer,
    options: magicColors,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    getDatum: (datum: number, useColorCode?: boolean) =>
      getDataLabel(magicColors, datum, useColorCode ? "colorClass" : "label"),
  },
  [DeityMetaField.deityTitle]: {
    metaField: "deityTitle",
    label: "titoloPatrono",
    defaultValue: "",
    placeholder: "titoloPatrono",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
  [DeityMetaField.deityType]: {
    metaField: "deityType",
    label: "tipoPatrono",
    defaultValue: firstOptionValue(deityTypes),
    placeholder: "tipoPatrono",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: deityTypes,
    getDatum: (datum: number) => getDataLabel(deityTypes, datum),
  },
  [DeityMetaField.deityRank]: {
    metaField: "deityRank",
    label: "gradoPatrono",
    defaultValue: firstOptionValue(deityLevels),
    placeholder: "gradoPatrono",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: deityLevels,
    getDatum: (datum: number) => getDataLabel(deityLevels, datum),
  },
  [DeityMetaField.tarotCard]: {
    metaField: "tarotCard",
    label: "card",
    defaultValue: firstOptionValue(tarotCards),
    placeholder: "card",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: tarotCards,
    getDatum: (datum: number) => getDataLabel(tarotCards, datum),
  },
  [DeityMetaField.celestialBody]: {
    metaField: "celestialBody",
    label: "astri",
    defaultValue: firstOptionValue(celestialBodies),
    placeholder: "astri",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: celestialBodies,
    getDatum: (datum: number) => getDataLabel(celestialBodies, datum),
  },
  [DeityMetaField.element]: {
    metaField: "element",
    label: "elemento",
    defaultValue: firstOptionValue(energyElements),
    placeholder: "elemento",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: energyElements,
    getDatum: (datum: number) => getDataLabel(energyElements, datum),
  },
  [DeityMetaField.deityClass]: {
    metaField: "deityClass",
    label: "classe",
    defaultValue: firstOptionValue(subclasses),
    placeholder: "classe",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: subclasses,
    getDatum: (datum: number) => getDataLabel(subclasses, datum),
  },
  [DeityMetaField.holidays]: {
    metaField: "holidays",
    label: "festivita",
    defaultValue: "",
    placeholder: "festivita",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
  [DeityMetaField.tradition]: {
    metaField: "tradition",
    label: "tradizione",
    defaultValue: firstOptionValue(traditionTypes),
    placeholder: "tradizione",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: traditionTypes,
    getDatum: (datum: number) => getDataLabel(traditionTypes, datum),
  },
  [DeityMetaField.residence]: {
    metaField: "residence",
    label: "residenza",
    defaultValue: firstOptionValue(celestialPlanes),
    placeholder: "residenza",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: celestialPlanes,
    getDatum: (datum: number) => getDataLabel(celestialPlanes, datum),
  },
  [DeityMetaField.meaning]: {
    metaField: "meaning",
    label: "significato",
    defaultValue: "",
    placeholder: "significato",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
} satisfies Record<string, PageMeta>;

export default deitiesMeta;
