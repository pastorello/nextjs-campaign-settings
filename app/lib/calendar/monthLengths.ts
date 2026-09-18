/**
 * The shape of every year in the world (ADR-0015, SPEC-014 §5.1): twelve
 * months of the Gregorian lengths, 365 days, no leap years. Fixed in code —
 * a date system renames months, it never changes their lengths.
 */
export const MONTH_LENGTHS = [
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
] as const;

export const MONTHS_PER_YEAR = MONTH_LENGTHS.length;

export const DAYS_PER_YEAR = 365;

/** Day of the year (0-based) on which each month starts: 0, 31, 59, … */
export const MONTH_START_DAYS: readonly number[] = MONTH_LENGTHS.map(
  (_, index) =>
    MONTH_LENGTHS.slice(0, index).reduce<number>(
      (sum, length) => sum + length,
      0
    )
);
