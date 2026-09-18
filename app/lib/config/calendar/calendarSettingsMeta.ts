import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import universalDayValidator from "@/app/lib/utils/validators/universalDayValidator";

/**
 * The calendar settings singleton's one field (SPEC-014 §5.3, §6): the
 * reference new moon, a universal day. `null` clears it — "no reference
 * set" is a real state, and it means no moon phase is shown anywhere.
 * Outside the metadata layer for the same reason as `dateSystemMeta`; the
 * panel's `MoonReferenceForm` consumes the validator and label key.
 */
const calendarSettingsMeta = {
  moonNewMoonDay: {
    metaField: "moonNewMoonDay",
    labelKey: "calendar.moon.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: universalDayValidator.nullable(),
  },
} satisfies Record<string, PageMeta>;

export default calendarSettingsMeta;
