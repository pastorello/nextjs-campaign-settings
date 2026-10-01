import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import LootMetaField from "@/app/lib/definitions/enums/campaign/LootMetaField";
import nullableAmountValidator from "@/app/lib/utils/validators/nullableAmountValidator";
import z from "zod";

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
    // A null `value` here means "supplies nothing, defer to the linked
    // catalogue treasure's own value" (SPEC-013 §6), not "worth zero" — same
    // "unset is not zero" convention as `treasureMeta.value`. See
    // `nullableAmountValidator`'s own comment (TD-130).
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
    // Optional too: a Daggerheart row never mentions it (SPEC-030).
    validator: z.coerce.number().int().positive().nullable().optional(),
  },
  [LootMetaField.treasureId]: {
    metaField: "treasureId",
    labelKey: "loot.fields.treasureId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "treasure",
    controlType: ControlType.Select,
    // Optional too: a Daggerheart row never mentions it (SPEC-030).
    validator: z.coerce.number().int().positive().nullable().optional(),
  },
  // SPEC-030, Daggerheart only (`campaignSystemFields`): gold in handfuls,
  // and a link to one of SPEC-029's catalogues. At most one of the five
  // links is set, as `magicItemId`/`treasureId` already are.
  [LootMetaField.gold]: {
    metaField: "gold",
    labelKey: "loot.fields.gold.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nullableAmountValidator(),
    getDatum: (datum: number | null) => (datum === null ? "—" : datum),
  },
  [LootMetaField.dhWeaponId]: {
    metaField: "dhWeaponId",
    labelKey: "loot.fields.dhWeaponId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "dhWeapon",
    controlType: ControlType.Select,
    validator: z.coerce.number().int().positive().nullable().optional(),
  },
  [LootMetaField.dhArmorId]: {
    metaField: "dhArmorId",
    labelKey: "loot.fields.dhArmorId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "dhArmor",
    controlType: ControlType.Select,
    validator: z.coerce.number().int().positive().nullable().optional(),
  },
  [LootMetaField.dhLootId]: {
    metaField: "dhLootId",
    labelKey: "loot.fields.dhLootId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "dhLoot",
    controlType: ControlType.Select,
    validator: z.coerce.number().int().positive().nullable().optional(),
  },
} satisfies Record<string, PageMeta>;

export default lootMeta;
