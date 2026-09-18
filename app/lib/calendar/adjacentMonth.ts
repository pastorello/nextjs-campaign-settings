import type CalendarMonth from "./CalendarMonth";
import { MAX_UNIVERSAL_YEAR } from "./maxUniversalDay";
import { MONTHS_PER_YEAR } from "./monthLengths";

/**
 * The month before (`step` −1) or after (+1) a month, across a year's end
 * as needed; `null` past either end of time — before the dawn (§5.1), or
 * after the last whole year a stored day can hold.
 */
export function adjacentMonth(
  { universalYear, monthIndex }: CalendarMonth,
  step: -1 | 1
): CalendarMonth | null {
  const absolute = universalYear * MONTHS_PER_YEAR + monthIndex + step;
  const year = Math.floor(absolute / MONTHS_PER_YEAR);
  if (year < 0 || year > MAX_UNIVERSAL_YEAR) return null;
  return { universalYear: year, monthIndex: absolute - year * MONTHS_PER_YEAR };
}
