/**
 * The fields every event form sends (SPEC-014 §5.4), whatever the event's
 * owner. Days are universal days (ADR-0015); a date the input could not
 * read is `null`, which the action's validator refuses; an absent end is
 * `null` (a one-day event). The actions still validate every field — this
 * types the caller, it does not vouch for the values.
 */
interface CalendarEventFieldsInput {
  title: string;
  description: string | null;
  startDay: number | null;
  startHour: number | null;
  endDay: number | null;
  endHour: number | null;
  repeatsYearly: boolean;
}

export default CalendarEventFieldsInput;
