import z from "zod";

import { MAX_UNIVERSAL_YEAR } from "@/app/lib/calendar/maxUniversalDay";
import { MONTHS_PER_YEAR } from "@/app/lib/calendar/monthLengths";
import { DAYS_PER_WEEK } from "@/app/lib/calendar/weekdayOf";
import DateSystemMetaField from "@/app/lib/definitions/enums/calendar/DateSystemMetaField";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";

/** A required one-line text: the DM's own content, trimmed. */
const requiredText = z.string().trim().min(1);

/**
 * A date system's scalar fields (SPEC-014 §5.2, §7). Date systems are a
 * settings panel, not a domain — no list page, no header filters — so by
 * ADR-0011's test this is never spread into `pageMetaFields.ts` or
 * registered in `pagesConfig.ts`. Declared anyway because the bespoke
 * editor (`app/ui/calendar/DateSystemForm.tsx`) and the Server Actions in
 * `app/lib/data/calendar/` consume each field's validator and label key
 * rather than restating them, the same "shared either way" half of the
 * ADR that `campaignMeta` uses.
 *
 * Every field is required here: only the universal count lacks an anchor
 * and a "before", and its action (`updateUniversalDateSystem`) validates
 * against the subset of these fields it may change.
 */
const dateSystemMeta = {
  [DateSystemMetaField.name]: {
    metaField: DateSystemMetaField.name,
    labelKey: "calendar.systems.fields.name",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: requiredText,
  },
  [DateSystemMetaField.anchorEvent]: {
    metaField: DateSystemMetaField.anchorEvent,
    labelKey: "calendar.systems.fields.anchorEvent",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: requiredText,
  },
  // The universal year the anchor event happened in. Universal years start
  // at 0, the dawn of time, and stop where their last day still fits the
  // `integer` column (ADR-0015).
  [DateSystemMetaField.anchorYear]: {
    metaField: DateSystemMetaField.anchorYear,
    labelKey: "calendar.systems.fields.anchorYear",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.number().int().min(0).max(MAX_UNIVERSAL_YEAR),
  },
  [DateSystemMetaField.afterLabel]: {
    metaField: DateSystemMetaField.afterLabel,
    labelKey: "calendar.systems.fields.afterLabel",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: requiredText,
  },
  [DateSystemMetaField.afterAbbrev]: {
    metaField: DateSystemMetaField.afterAbbrev,
    labelKey: "calendar.systems.fields.afterAbbrev",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: requiredText,
  },
  [DateSystemMetaField.beforeLabel]: {
    metaField: DateSystemMetaField.beforeLabel,
    labelKey: "calendar.systems.fields.beforeLabel",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: requiredText,
  },
  [DateSystemMetaField.beforeAbbrev]: {
    metaField: DateSystemMetaField.beforeAbbrev,
    labelKey: "calendar.systems.fields.beforeAbbrev",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: requiredText,
  },
  // Exactly twelve and seven (SPEC-014 §8), refused with a key of their
  // own rather than Zod's "choose at least", which reads as a picker.
  [DateSystemMetaField.monthNames]: {
    metaField: DateSystemMetaField.monthNames,
    labelKey: "calendar.systems.fields.monthNames",
    defaultValue: [],
    fieldType: FieldType.array,
    controlType: ControlType.Text,
    validator: z
      .array(requiredText)
      .length(MONTHS_PER_YEAR, { message: "monthNamesCount" }),
  },
  [DateSystemMetaField.weekdayNames]: {
    metaField: DateSystemMetaField.weekdayNames,
    labelKey: "calendar.systems.fields.weekdayNames",
    defaultValue: [],
    fieldType: FieldType.array,
    controlType: ControlType.Text,
    validator: z
      .array(requiredText)
      .length(DAYS_PER_WEEK, { message: "weekdayNamesCount" }),
  },
} satisfies Record<string, PageMeta>;

export default dateSystemMeta;
