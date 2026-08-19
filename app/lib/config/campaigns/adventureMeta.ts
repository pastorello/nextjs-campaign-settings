import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import AdventureMetaField from "@/app/lib/definitions/enums/campaign/AdventureMetaField";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";
import firstOptionValue from "../firstOptionValue";
import z from "zod";

import adventureStatuses from "./adventure-statuses";
import currencyUnits from "./currency-units";

/**
 * An unset budget target reads "—", never `0` (SPEC-013 §5's edge cases) — an
 * empty input is preprocessed to `null` rather than coerced to zero, the same
 * shape `treasureMeta.value` already uses. Shared here because `adventure`
 * has four of these (xp, currency, permanent items, consumables) where
 * treasure has one.
 */
function nullableAmountValidator() {
  return z.preprocess(
    (raw) => (raw === "" || raw === undefined ? null : raw),
    z.coerce.number().int().gte(0).nullable()
  );
}

function renderAmount(datum: number | null) {
  return datum === null ? "—" : datum;
}

/**
 * The adventure's own scalar fields (SPEC-013 §5/§6). `campaignId` is
 * deliberately not declared here — it is set by the data layer from the
 * campaign page the adventure is created on (T6), the same way a scene's
 * `zoneId` link is bespoke rather than a form field. Outside the metadata
 * layer proper for the same reason as `campaignMeta` — see its own comment.
 */
const adventureMeta = {
  [AdventureMetaField.position]: {
    metaField: "position",
    labelKey: "adventure.fields.position.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int(),
  },
  [AdventureMetaField.targetLevel]: {
    metaField: "targetLevel",
    labelKey: "adventure.fields.targetLevel.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    // D&D 5e's character level range.
    validator: z.coerce.number().int().min(1).max(20),
  },
  [AdventureMetaField.title]: {
    metaField: "title",
    labelKey: "adventure.fields.title.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().min(1),
  },
  [AdventureMetaField.synopsis]: {
    metaField: "synopsis",
    labelKey: "adventure.fields.synopsis.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    validator: z.string().optional(),
  },
  [AdventureMetaField.timeline]: {
    metaField: "timeline",
    labelKey: "adventure.fields.timeline.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    validator: z.string().optional(),
  },
  [AdventureMetaField.status]: {
    metaField: "status",
    labelKey: "adventure.fields.status.label",
    defaultValue: firstOptionValue(adventureStatuses),
    fieldType: FieldType.string,
    options: adventureStatuses,
    controlType: ControlType.Select,
    // `z.nativeEnum` is the membership check (see `AdventureStatus.test.ts`),
    // not an options-array validator — the column is a raw `String`, not an
    // `Int` indexing this options list.
    validator: z.nativeEnum(AdventureStatus),
  },
  [AdventureMetaField.xpTarget]: {
    metaField: "xpTarget",
    labelKey: "adventure.fields.xpTarget.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nullableAmountValidator(),
    getDatum: renderAmount,
  },
  [AdventureMetaField.currencyTarget]: {
    metaField: "currencyTarget",
    labelKey: "adventure.fields.currencyTarget.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    // Always silver — see `currencyUnit` for the display-only conversion.
    validator: nullableAmountValidator(),
    getDatum: renderAmount,
  },
  [AdventureMetaField.currencyUnit]: {
    metaField: "currencyUnit",
    labelKey: "adventure.fields.currencyUnit.label",
    defaultValue: firstOptionValue(currencyUnits),
    fieldType: FieldType.string,
    options: currencyUnits,
    controlType: ControlType.Select,
    validator: z.enum(["silver", "gold"]).optional(),
  },
  [AdventureMetaField.permanentItemTarget]: {
    metaField: "permanentItemTarget",
    labelKey: "adventure.fields.permanentItemTarget.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nullableAmountValidator(),
    getDatum: renderAmount,
  },
  [AdventureMetaField.consumableTarget]: {
    metaField: "consumableTarget",
    labelKey: "adventure.fields.consumableTarget.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nullableAmountValidator(),
    getDatum: renderAmount,
  },
} satisfies Record<string, PageMeta>;

export default adventureMeta;
