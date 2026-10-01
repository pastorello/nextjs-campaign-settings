import { z } from "zod";

import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import optionValueValidator from "@/app/lib/utils/validators/optionValueValidator";

import dhTiers from "./dhTiers";

/**
 * A Daggerheart record's tier, 1–4 (SPEC-028 §7), declared once: it means
 * the same on adversaries, environments and SPEC-029's equipment, so
 * `pageMetaFields` carries it as one shared `tier` field, as it does
 * `origin`.
 */
export const dhTierMeta = {
  metaField: "tier",
  labelKey: "daggerheart.fields.tier.label",
  defaultValue: firstOptionValue(dhTiers),
  fieldType: FieldType.integer,
  options: dhTiers,
  controlType: ControlType.Select,
  validator: optionValueValidator(dhTiers),
} satisfies PageMeta;

/**
 * The Difficulty a roll against the record must meet (SPEC-028 §7), shared
 * the same way: a whole number, at least 1.
 */
export const dhDifficultyMeta = {
  metaField: "difficulty",
  labelKey: "daggerheart.fields.difficulty.label",
  defaultValue: 1,
  fieldType: FieldType.integer,
  controlType: ControlType.Text,
  validator: z.coerce.number().int().min(1),
  getDatum: (datum: number) => datum,
} satisfies PageMeta;
