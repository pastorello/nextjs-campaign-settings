import { DAYS_PER_YEAR } from "./monthLengths";

/**
 * The last universal day the database can hold: `startDay`/`endDay` are
 * Postgres `integer` columns (SPEC-014 §6), so 2³¹ − 1. Nothing in the
 * calendar maths needs a ceiling; this one exists so a mistyped year is a
 * field error rather than a failed insert.
 */
export const MAX_UNIVERSAL_DAY = 2_147_483_647;

/** The last universal year whose every day fits under `MAX_UNIVERSAL_DAY`. */
export const MAX_UNIVERSAL_YEAR = Math.floor(
  (MAX_UNIVERSAL_DAY - (DAYS_PER_YEAR - 1)) / DAYS_PER_YEAR
);
