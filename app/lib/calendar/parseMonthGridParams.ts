import type CalendarMonth from "./CalendarMonth";
import { MAX_UNIVERSAL_YEAR } from "./maxUniversalDay";
import { MONTHS_PER_YEAR } from "./monthLengths";

type SearchParams = Record<string, string | string[] | undefined>;

export type CalendarView = "list" | "grid";

export interface MonthGridParams {
  view: CalendarView;
  /** The month asked for, or `null` for the page's default month. */
  month: CalendarMonth | null;
}

/**
 * The calendar pages' view in the URL (SPEC-014 §5.6, T7):
 * `?view=grid&year=<universal year>&month=<1–12>`. The list is the default
 * view. The year is universal, so a month kept in a link survives a change
 * of displayed date system. Anything malformed reads as absent, as the
 * pages' filters do — the URL is the viewer's to edit.
 */
export function parseMonthGridParams(
  searchParams: SearchParams
): MonthGridParams {
  const view = single(searchParams.view) === "grid" ? "grid" : "list";
  const year = wholeNumber(single(searchParams.year));
  const month = wholeNumber(single(searchParams.month));
  const valid =
    year !== null &&
    month !== null &&
    year <= MAX_UNIVERSAL_YEAR &&
    month >= 1 &&
    month <= MONTHS_PER_YEAR;
  return {
    view,
    month: valid ? { universalYear: year, monthIndex: month - 1 } : null,
  };
}

/** A month as URL parameters — the inverse of `parseMonthGridParams`. */
export function monthGridParams({ universalYear, monthIndex }: CalendarMonth): {
  year: string;
  month: string;
} {
  return { year: String(universalYear), month: String(monthIndex + 1) };
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function wholeNumber(value: string | undefined): number | null {
  if (value === undefined || !/^\d{1,10}$/.test(value)) return null;
  return Number(value);
}
