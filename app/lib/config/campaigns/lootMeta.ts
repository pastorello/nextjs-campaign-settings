import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import LootMetaField from "@/app/lib/definitions/enums/campaign/LootMetaField";
import z from "zod";

/**
 * `value` is preserved as `null` rather than coerced to `0` when left
 * blank — same "unset is not zero" convention as `treasureMeta.value`, and
 * the same reason: a null `value` here means "supplies nothing, defer to
 * the linked catalogue treasure's own value" (SPEC-013 §6), not "worth
 * zero."
 */
function nullableAmountValidator() {
  return z.preprocess(
    (raw) => (raw === "" || raw === undefined ? null : raw),
    z.coerce.number().int().gte(0).nullable()
  );
}

/**
 * A loot row's own scalar fields (SPEC-013 §5/§6) — outside the metadata
 * layer (ADR-0011), declared here so the bespoke scene editor (T8) consumes
 * each field's validator and label key rather than restating them.
 * `magicItemId`/`treasureId` are plain nullable FKs, like `sceneMeta.zoneId`;
 * their mutual exclusion (§5's edge case: "rejected by the validator, at
 * most one link") is a cross-field rule these two fields' individual
 * validators cannot express on their own, so `createLoot`/`updateLoot`
 * `.refine()` the built schema instead — see `LootMetaField`'s own comment.
 */
const lootMeta = {
  [LootMetaField.position]: {
    metaField: "position",
    labelKey: "loot.fields.position.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int(),
  },
  [LootMetaField.description]: {
    metaField: "description",
    labelKey: "loot.fields.description.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().min(1),
  },
  [LootMetaField.quantity]: {
    metaField: "quantity",
    labelKey: "loot.fields.quantity.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().positive(),
  },
  [LootMetaField.value]: {
    metaField: "value",
    labelKey: "loot.fields.value.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nullableAmountValidator(),
    getDatum: (datum: number | null) => (datum === null ? "—" : datum),
  },
  [LootMetaField.magicItemId]: {
    metaField: "magicItemId",
    labelKey: "loot.fields.magicItemId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "magicitems",
    controlType: ControlType.Select,
    validator: z.coerce.number().int().positive().nullable(),
  },
  [LootMetaField.treasureId]: {
    metaField: "treasureId",
    labelKey: "loot.fields.treasureId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "treasure",
    controlType: ControlType.Select,
    validator: z.coerce.number().int().positive().nullable(),
  },
} satisfies Record<string, PageMeta>;

export default lootMeta;
