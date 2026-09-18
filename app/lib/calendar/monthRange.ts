import type CalendarMonth from "./CalendarMonth";
import { dateToUniversalDay } from "./dateToUniversalDay";
import { MONTH_LENGTHS } from "./monthLengths";

/**
 * A month's first and last universal days — the range the month grid
 * reads events for. Throws, like `dateToUniversalDay`, on a month that does
 * not exist.
 */
export function monthRange({ universalYear, monthIndex }: CalendarMonth): {
  firstDay: number;
  lastDay: number;
} {
  const firstDay = dateToUniversalDay({ universalYear, monthIndex, day: 1 });
  const length = MONTH_LENGTHS[monthIndex] ?? 0;
  return { firstDay, lastDay: firstDay + length - 1 };
}
