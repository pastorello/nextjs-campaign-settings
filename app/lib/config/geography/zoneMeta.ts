import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import ZoneMetaField from "@/app/lib/definitions/enums/geography/ZoneMetaField";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";
import z from "zod";

/**
 * A zone's two editable scalars (TD-104) — outside the metadata layer's
 * page composition (ADR-0011: the edit panel is a bespoke map control, not
 * a metadata-driven form), but declared as `PageMeta` all the same so
 * `ZoneEditPanel` and `updateZoneDetails` consume one validator and one
 * label key each rather than restating them. Same shape and same reasoning
 * as `zoneGridMeta`, its sibling for the grid scalars.
 *
 * Until TD-104 there was no `PageMeta` for these at all, and no mutation
 * wrote them: a region could not be renamed anywhere in the application.
 * `createPlace`/`createPoi`/`createRootPlace` build `placeSchema.ts` /
 * `poiSchema.ts` / `rootPlaceSchema.ts` from these same validators
 * (TD-129) rather than restating the rule, so create and edit cannot
 * disagree on what a legal title or description is.
 */
const zoneMeta = {
  [ZoneMetaField.title]: {
    metaField: "title",
    labelKey: "geography.fields.title.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    // `zone.title` is NOT NULL in Postgres and every comparable title meta
    // (`sceneMeta`, `adventureMeta`, `campaignMeta`) uses this exact rule.
    validator: z.string().min(1),
  },
  [ZoneMetaField.description]: {
    metaField: "description",
    labelKey: "geography.fields.description.label",
    // `""`, not `null`: `StringFieldMeta.defaultValue` is `string`
    // (`PageMeta.ts:96`), and `sceneMeta`/`campaignMeta` seed their own
    // nullable descriptions the same way. The empty form field is the empty
    // string; `null` only ever appears on the wire and in the column.
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    // `PageMeta`'s string branch admits `string | undefined`, never `null`
    // (`PageMeta.ts:96`), so the nullable column is bridged the way every
    // other nullable text field in the project is. The panel sends `null`
    // to clear, this turns it into `undefined`, and `updateZoneDetails`
    // writes `?? null` back — one round trip, no third state. `.min(1)`
    // keeps "cleared" a single value: an empty string is refused rather
    // than stored beside `null` as a second way of meaning the same thing.
    validator: nullableToOptional(z.string().min(1).optional()),
  },
} satisfies Record<string, PageMeta>;

export default zoneMeta;
