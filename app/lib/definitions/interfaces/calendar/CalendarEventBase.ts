/**
 * The fields every event has, whoever owns it (SPEC-014 §5.4): the shape
 * the chronological list, the date range and the past/upcoming helper read.
 * World history events add their links, campaign events their adventure
 * and scene.
 */
interface CalendarEventBase {
  id: number;
  title: string;
  description: string | null;
  /** A universal day (ADR-0015). */
  startDay: number;
  startHour: number | null;
  /** `null` for a one-day event. */
  endDay: number | null;
  endHour: number | null;
  repeatsYearly: boolean;
}

export default CalendarEventBase;
