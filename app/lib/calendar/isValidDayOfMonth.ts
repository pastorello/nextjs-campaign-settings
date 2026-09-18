import { MONTH_LENGTHS } from "./monthLengths";

/**
 * True when `monthIndex` names a month (0–11) and `day` (1-based) exists in
 * it: day 31 of a 30-day month is false. No leap years, so 29 February never
 * exists.
 */
export function isValidDayOfMonth(monthIndex: number, day: number): boolean {
  // Undefined for anything but a whole index 0–11.
  const length: number | undefined = MONTH_LENGTHS[monthIndex];
  return (
    length !== undefined && Number.isInteger(day) && day >= 1 && day <= length
  );
}
