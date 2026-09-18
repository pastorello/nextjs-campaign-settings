import { isValidUniversalDate } from "./isValidUniversalDate";
import { DAYS_PER_YEAR, MONTH_START_DAYS } from "./monthLengths";
import type UniversalDate from "./UniversalDate";

/**
 * The universal day number of a date in the universal count (ADR-0015).
 * For a date typed in another system, convert its year first with
 * `universalYearFromSystemYear`.
 *
 * Throws a `RangeError` for a date that does not exist (31 April) or falls
 * before the dawn of time; callers validating user input check
 * `isValidUniversalDate` first and report a field error instead.
 */
export function dateToUniversalDay(date: UniversalDate): number {
  const monthStart = MONTH_START_DAYS[date.monthIndex];
  if (monthStart === undefined || !isValidUniversalDate(date)) {
    throw new RangeError(
      `Invalid date: year ${date.universalYear}, month index ${date.monthIndex}, day ${date.day}`
    );
  }
  return date.universalYear * DAYS_PER_YEAR + monthStart + date.day - 1;
}
