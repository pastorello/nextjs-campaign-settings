import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import type CalendarMonth from "./CalendarMonth";
import { universalDayToDate } from "./universalDayToDate";

/**
 * The month a day falls in — where the month grid opens when the URL names
 * none (SPEC-014 T7). With no day (no event, no today), the first month of
 * the displayed system's year 0, its anchor year: the one year every
 * system's DM has named.
 */
export function monthOf(
  universalDay: number | null,
  displaySystem: Pick<DateSystem, "anchorYear">
): CalendarMonth {
  if (universalDay === null) {
    return { universalYear: displaySystem.anchorYear, monthIndex: 0 };
  }
  const { universalYear, monthIndex } = universalDayToDate(universalDay);
  return { universalYear, monthIndex };
}
