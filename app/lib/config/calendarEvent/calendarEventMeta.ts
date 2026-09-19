import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import CalendarEventMetaField from "@/app/lib/definitions/enums/calendar/CalendarEventMetaField";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";
import universalDayValidator from "@/app/lib/utils/validators/universalDayValidator";
import worldHourValidator from "@/app/lib/utils/validators/worldHourValidator";
import z from "zod";

/**
 * An event's scalar fields (SPEC-014 §7), one declaration for both kinds of
 * event: world history (T5) and campaign events (T6). The forms and actions
 * consume each field's validator and label key from here rather than
 * restating them (ADR-0011).
 *
 * **The four date fields are edited by `WorldDateInput`, not by their
 * `controlType`.** T4 made the date control bespoke — one control spans a
 * day and an hour and needs the date systems as data — so the form renders
 * one `WorldDateInput` per start/end pair and hands it the day field's label
 * key; `ControlType.Text` below is the nearest value for a field no generic
 * renderer draws. What the metas still own is the validator (the dawn of
 * time, the `integer` column, 0–23) and the label.
 *
 * The cross-field rules — end not before start, a yearly event spanning at
 * most a year — cannot live on one field; they are
 * `checkCalendarEventDates`, applied over `calendarEventShape`.
 */
const calendarEventMeta = {
  [CalendarEventMetaField.title]: {
    metaField: "title",
    labelKey: "calendar.event.fields.title.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().trim().min(1),
  },
  [CalendarEventMetaField.description]: {
    metaField: "description",
    labelKey: "calendar.event.fields.description.label",
    defaultValue: "",
    fieldType: FieldType.string,
    // Formatted text (SPEC-019 T5): the validator sanitises it.
    controlType: ControlType.RichText,
    tall: true,
    // Nullable column, `string | null` domain type — see
    // `nullableToOptional`'s own comment (TD-130).
    validator: nullableToOptional(richTextValidator().optional()),
  },
  [CalendarEventMetaField.startDay]: {
    metaField: "startDay",
    labelKey: "calendar.event.fields.start.label",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: universalDayValidator,
  },
  [CalendarEventMetaField.startHour]: {
    metaField: "startHour",
    labelKey: "calendar.event.fields.startHour.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: worldHourValidator,
  },
  [CalendarEventMetaField.endDay]: {
    metaField: "endDay",
    labelKey: "calendar.event.fields.end.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    // `null` is a one-day event (SPEC-014 §6).
    validator: universalDayValidator.nullable(),
  },
  [CalendarEventMetaField.endHour]: {
    metaField: "endHour",
    labelKey: "calendar.event.fields.endHour.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: worldHourValidator,
  },
  [CalendarEventMetaField.repeatsYearly]: {
    metaField: "repeatsYearly",
    labelKey: "calendar.event.fields.repeatsYearly.label",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.boolean(),
  },
} satisfies Record<string, PageMeta>;

export default calendarEventMeta;
