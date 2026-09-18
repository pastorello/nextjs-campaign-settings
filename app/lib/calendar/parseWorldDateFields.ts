import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import type FieldErrorMessage from "@/app/lib/definitions/types/FieldErrorMessage";
import { dateToUniversalDay } from "./dateToUniversalDay";
import { isValidDayOfMonth } from "./isValidDayOfMonth";
import { MAX_UNIVERSAL_YEAR } from "./maxUniversalDay";
import { MONTH_LENGTHS } from "./monthLengths";
import { universalYearFromSystemYear } from "./systemYear";
import type WorldDateFields from "./WorldDateFields";

/** Which sub-field of the date input a refusal belongs to. */
export type WorldDateSubField = "year" | "day";

export interface ParsedWorldDate {
  /** The universal day, or `null` when the fields are empty or refused. */
  universalDay: number | null;
  /** Keyed refusals (TD-124), rendered by `WorldDateInput` beside each field. */
  errors: Partial<Record<WorldDateSubField, FieldErrorMessage>>;
}

/** A whole number typed as text; `null` for anything else ("", "-", "3.5"). */
function parseWhole(text: string): number | null {
  const trimmed = text.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Turns what the DM typed into a universal day (SPEC-014 §5.8): the year is
 * read in `system` and shifted by its anchor, the month and day are the same
 * in every system. The refusals are the spec's edge cases — a day the month
 * does not have ("Day 31 in a 30-day month") and a date before the dawn of
 * time — plus a year that is not a whole number.
 *
 * An empty year or day is not an error here: whether a date is required is
 * the form's business, and its validator refuses the resulting `null`.
 */
export function parseWorldDateFields(
  fields: WorldDateFields,
  system: DateSystem
): ParsedWorldDate {
  const errors: ParsedWorldDate["errors"] = {};
  const yearEmpty = fields.year.trim() === "";
  const dayEmpty = fields.day.trim() === "";

  const systemYear = parseWhole(fields.year);
  if (!yearEmpty && systemYear === null) errors.year = { key: "invalid" };

  const day = parseWhole(fields.day);
  if (
    !dayEmpty &&
    (day === null || !isValidDayOfMonth(fields.monthIndex, day))
  ) {
    errors.day = {
      key: "dayNotInMonth",
      values: { days: MONTH_LENGTHS[fields.monthIndex] ?? 0 },
    };
  }

  if (systemYear === null || day === null || errors.day) {
    return { universalDay: null, errors };
  }

  const universalYear = universalYearFromSystemYear(
    systemYear,
    system.anchorYear
  );
  if (universalYear < 0) {
    errors.year = { key: "beforeDawnOfTime" };
    return { universalDay: null, errors };
  }
  if (universalYear > MAX_UNIVERSAL_YEAR) {
    errors.year = {
      key: "tooBig",
      values: { maximum: MAX_UNIVERSAL_YEAR - system.anchorYear },
    };
    return { universalDay: null, errors };
  }

  return {
    universalDay: dateToUniversalDay({
      universalYear,
      monthIndex: fields.monthIndex,
      day,
    }),
    errors,
  };
}
