import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import TreasureMetaField from "@/app/lib/definitions/enums/treasure/TreasureMetaField";
import optionValueValidator from "@/app/lib/utils/validators/optionValueValidator";
import z from "zod";

import treasureCategories from "./treasure-categories";

/**
 * The treasure catalogue's own fields (SPEC-013 §6/§7) — `name` and
 * `description` are the shared declarations in `pageMetaFields.ts`, same as
 * every other domain.
 */
const treasureMeta = {
  // Static options, like `magicitems.type` — SPEC-013 §6 is explicit that
  // this is the `options` branch of `PageMeta`, not `optionTable` (that
  // branch is FK-backed and today only permits `"faction"`).
  [TreasureMetaField.category]: {
    metaField: "category",
    labelKey: "treasure.fields.category.label",
    defaultValue: firstOptionValue(treasureCategories),
    fieldType: FieldType.integer,
    options: treasureCategories,
    controlType: ControlType.Select,
    validator: optionValueValidator(treasureCategories),
  },
  // Stored as an integer number of silver (SPEC-013 §6's "one stored unit,
  // two displayed") — a plain nullable integer, not option-backed, so it is
  // entered as free text and rendered with an em dash when unset, the same
  // "no value" convention `resolveFieldValue` already uses for a table-backed
  // field with no selection. A blank input reaches the validator as `""`
  // (every `TextInput` emits a string), which the preprocess step below
  // treats as "no value" rather than coercing to `0`.
  [TreasureMetaField.value]: {
    metaField: "value",
    labelKey: "treasure.fields.value.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    placeholderKey: "treasure.fields.value.placeholder",
    validator: z.preprocess(
      (raw) => (raw === "" || raw === undefined ? null : raw),
      z.coerce.number().int().gte(0).nullable()
    ),
    getDatum: (datum: number | null) => (datum === null ? "—" : datum),
  },
} satisfies Record<string, PageMeta>;

export default treasureMeta;
