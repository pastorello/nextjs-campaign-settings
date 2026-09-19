import { z } from "zod";

import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhOrigin from "@/app/lib/definitions/enums/daggerheart/DhOrigin";

import dhOrigins from "./dhOrigins";

/**
 * Where a Daggerheart record came from (SPEC-018 §6, SPEC-021 §6), declared
 * once: every Daggerheart catalogue has the same `origin` column with the
 * same meaning, so `pageMetaFields` carries it as one shared `origin` field,
 * the way it carries `imageId`.
 */
const dhOriginMeta = {
  metaField: "origin",
  labelKey: "daggerheart.fields.origin.label",
  defaultValue: firstOptionValue(dhOrigins),
  fieldType: FieldType.string,
  options: dhOrigins,
  controlType: ControlType.Select,
  validator: z.nativeEnum(DhOrigin),
} satisfies PageMeta;

export default dhOriginMeta;
