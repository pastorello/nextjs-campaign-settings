import { mod } from "./mod";

export const DAYS_PER_WEEK = 7;

/**
 * The 0-based weekday of a universal day. The week runs unbroken from the
 * dawn of time, which is weekday 0 in every date system (SPEC-014 §5.1): an
 * index into the system's `weekdayNames`.
 */
export function weekdayOf(universalDay: number): number {
  return mod(universalDay, DAYS_PER_WEEK);
}
