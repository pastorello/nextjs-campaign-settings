import { isValidDayOfMonth } from "./isValidDayOfMonth";
import type UniversalDate from "./UniversalDate";

/**
 * True when the date exists and is not before the dawn of time: a whole
 * universal year ≥ 0 and a day that exists in its month.
 */
export function isValidUniversalDate(date: UniversalDate): boolean {
  return (
    Number.isInteger(date.universalYear) &&
    date.universalYear >= 0 &&
    isValidDayOfMonth(date.monthIndex, date.day)
  );
}
