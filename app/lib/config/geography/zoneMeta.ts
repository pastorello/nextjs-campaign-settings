import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import ZoneMetaField from "@/app/lib/definitions/enums/geography/ZoneMetaField";
import z from "zod";

/**
 * `description` maps to a nullable column, so "cleared" arrives as an
 * explicit `null` rather than an omitted key; `.optional()` alone only
 * tolerates `undefined`. The fifth local copy of this helper —
 * `sceneMeta`, `sceneCreatureMeta`, `campaignMeta` and `adventureMeta` each
 * declare their own. Extracting the five into one shared helper is a
 * worthwhile tidy-up but a different change from this one.
 */
function nullableToOptional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((raw) => (raw === null ? undefined : raw), schema);
}

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
 * `createPlace` validates them through literals restated in
 * `placeSchema.ts`, which is the older, rule-2-non-compliant precedent —
 * left alone here deliberately, since changing what creation accepts is a
 * behaviour change and this is not the commit for it.
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
