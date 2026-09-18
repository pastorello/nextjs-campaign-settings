import { DAYS_PER_YEAR } from "./monthLengths";
import { mod } from "./mod";

/** The 0-based day of the year of a universal day: 0 = 1st of the first month. */
export function dayOfYear(universalDay: number): number {
  return mod(universalDay, DAYS_PER_YEAR);
}
