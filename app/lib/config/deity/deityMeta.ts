import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PatronoMetaField from "@/app/lib/definitions/enums/deities/PatronoMetaField";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";

import coloriMagia from "./coloriMagia";
import z from "zod";
import getDataLabel from "../../utils/data/getDataLabel";
import tarocchi from "./tarcocchi";
import deityTypes from "./deityTypes";
import deityLevels from "./deityLevels";
import celestialBodies from "../geography/celestialBodies";
import energyElements from "./energyElements";
import subclasses from "../spells/subclasses";
import traditionTypes from "./traditionTypes";
import celestialPlanes from "../geography/celestialPlanes";

const deitiesMeta: Record<string, PageMeta> = {
  [PatronoMetaField.colore]: {
    metaField: "colore",
    label: "Colore magia",
    defaultValue: coloriMagia[0].value,
    fieldType: FieldType.integer,
    options: coloriMagia,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    getDatum: (datum: number, useColorCode?: boolean) =>
      getDataLabel(coloriMagia, datum, useColorCode ? "colorClass" : "label"),
  },
  [PatronoMetaField.titoloPatrono]: {
    metaField: "titoloPatrono",
    label: "titoloPatrono",
    defaultValue: "",
    placeholder: "titoloPatrono",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
  [PatronoMetaField.tipoPatrono]: {
    metaField: "tipoPatrono",
    label: "tipoPatrono",
    defaultValue: "",
    placeholder: "tipoPatrono",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: deityTypes,
    getDatum: (datum: number) => getDataLabel(deityTypes, datum),
  },
  [PatronoMetaField.gradoPatrono]: {
    metaField: "gradoPatrono",
    label: "gradoPatrono",
    defaultValue: "",
    placeholder: "gradoPatrono",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: deityLevels,
    getDatum: (datum: number) => getDataLabel(deityLevels, datum),
  },
  [PatronoMetaField.card]: {
    metaField: "card",
    label: "card",
    defaultValue: "",
    placeholder: "card",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: tarocchi,
    getDatum: (datum: number) => getDataLabel(tarocchi, datum),
  },
  [PatronoMetaField.astri]: {
    metaField: "astri",
    label: "astri",
    defaultValue: "",
    placeholder: "astri",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: celestialBodies,
    getDatum: (datum: number) => getDataLabel(celestialBodies, datum),
  },
  [PatronoMetaField.elemento]: {
    metaField: "elemento",
    label: "elemento",
    defaultValue: "",
    placeholder: "elemento",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: energyElements,
    getDatum: (datum: number) => getDataLabel(energyElements, datum),
  },
  [PatronoMetaField.classe]: {
    metaField: "classe",
    label: "classe",
    defaultValue: "",
    placeholder: "classe",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: subclasses,
    getDatum: (datum: number) => getDataLabel(subclasses, datum),
  },
  [PatronoMetaField.festivita]: {
    metaField: "festivita",
    label: "festivita",
    defaultValue: "",
    placeholder: "festivita",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
  [PatronoMetaField.tradizione]: {
    metaField: "tradizione",
    label: "tradizione",
    defaultValue: "",
    placeholder: "tradizione",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: traditionTypes,
    getDatum: (datum: number) => getDataLabel(traditionTypes, datum),
  },
  [PatronoMetaField.residenza]: {
    metaField: "residenza",
    label: "residenza",
    defaultValue: "",
    placeholder: "residenza",
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: z.coerce.number(),
    options: celestialPlanes,
    getDatum: (datum: number) => getDataLabel(celestialPlanes, datum),
  },
  [PatronoMetaField.significato]: {
    metaField: "significato",
    label: "significato",
    defaultValue: "",
    placeholder: "significato",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
};

export default deitiesMeta;
