/**
 * True for a whole, non-negative day number. Day 0 is the dawn of time
 * (ADR-0015); nothing precedes it, so a negative day is "before the dawn"
 * and rejected (SPEC-014 §5 edge cases).
 */
export function isValidUniversalDay(day: number): boolean {
  return Number.isInteger(day) && day >= 0;
}
