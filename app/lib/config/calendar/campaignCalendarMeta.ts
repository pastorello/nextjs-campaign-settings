import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import universalDayValidator from "@/app/lib/utils/validators/universalDayValidator";

/**
 * A campaign's calendar field (SPEC-014 §5.5, T6): its current in-world
 * day, a universal day. `null` clears it — "no today" is a real state, in
 * which nothing reads as past. Not in `campaignMeta`: the campaign's form
 * does not edit it; the calendar page's `CurrentDayForm` does, through
 * `WorldDateInput`, and consumes this validator and label key (ADR-0011).
 */
const campaignCalendarMeta = {
  currentDay: {
    metaField: "currentDay",
    labelKey: "calendar.campaign.today.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: universalDayValidator.nullable(),
  },
} satisfies Record<string, PageMeta>;

export default campaignCalendarMeta;
