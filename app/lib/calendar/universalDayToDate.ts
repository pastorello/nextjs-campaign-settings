import { dayOfYear } from "./dayOfYear";
import { isValidUniversalDay } from "./isValidUniversalDay";
import { DAYS_PER_YEAR, MONTH_LENGTHS } from "./monthLengths";
import type UniversalDate from "./UniversalDate";

/**
 * Splits a universal day number into the universal year, month and day
 * (ADR-0015). Throws a `RangeError` for a day before the dawn of time or a
 * non-integer — a stored day is always valid, so this is a programming error,
 * not a user one.
 */
export function universalDayToDate(universalDay: number): UniversalDate {
  if (!isValidUniversalDay(universalDay)) {
    throw new RangeError(`Invalid universal day: ${universalDay}`);
  }
  let monthIndex = 0;
  let remaining = dayOfYear(universalDay);
  for (const length of MONTH_LENGTHS) {
    if (remaining < length) break;
    remaining -= length;
    monthIndex++;
  }
  return {
    universalYear: Math.floor(universalDay / DAYS_PER_YEAR),
    monthIndex,
    day: remaining + 1,
  };
}
