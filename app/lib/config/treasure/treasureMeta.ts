import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import TreasureMetaField from "@/app/lib/definitions/enums/treasure/TreasureMetaField";
import nullableAmountValidator from "@/app/lib/utils/validators/nullableAmountValidator";
import optionValueValidator from "@/app/lib/utils/validators/optionValueValidator";

import treasureCategories from "./treasure-categories";

/**
 * The treasure catalogue's own fields (SPEC-013 §6/§7) — `name` and
 * `description` are the shared declarations in `pageMetaFields.ts`, same as
 * every other domain.
 */
const treasureMeta = {
  // Static options, like `magicitems.type` — SPEC-013 §6 is explicit that
  // this is the `options` branch of `PageMeta`, not `optionTable` (that
  // branch is FK-backed — `"faction"`, and since T6, `"zone"`/`"npc"`/
  // `"magicitems"`/`"treasure"` for `scene`/`sceneCreature`/`loot`'s links).
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
  // field with no selection. See `nullableAmountValidator`'s own comment
  // (TD-130) for how a blank input becomes "no value" rather than `0`.
  [TreasureMetaField.value]: {
    metaField: "value",
    labelKey: "treasure.fields.value.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    placeholderKey: "treasure.fields.value.placeholder",
    validator: nullableAmountValidator(),
    getDatum: (datum: number | null) => (datum === null ? "—" : datum),
  },
} satisfies Record<string, PageMeta>;

export default treasureMeta;
