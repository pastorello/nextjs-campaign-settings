import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import { formatHour } from "./formatHour";
import { systemYearFromUniversalYear } from "./systemYear";
import { toYearLabel } from "./toYearLabel";
import { universalDayToDate } from "./universalDayToDate";
import { weekdayOf } from "./weekdayOf";
import type WorldDateParts from "./WorldDateParts";

/**
 * The labelled year of a system year (SPEC-014 §9 decision 2): its absolute
 * value and the system's abbreviation for that side of the anchor — "330
 * a.C.", "0 d.C.". A system with no "before" abbreviation (the universal
 * count, whose years never go negative) falls back to the signed number, so
 * a year is never shown without its sign.
 */
export function formatSystemYear(
  systemYear: number,
  system: DateSystem
): string {
  const { absoluteYear, era } = toYearLabel(systemYear);
  const abbrev = era === "after" ? system.afterAbbrev : system.beforeAbbrev;
  return abbrev === null ? String(systemYear) : `${absoluteYear} ${abbrev}`;
}

/**
 * A universal day (and optional hour) read in `system`: weekday and month by
 * the system's own names, the year re-labelled from the system's anchor.
 * The day and month are the same in every system; only the year differs
 * (ADR-0015). Throws a `RangeError` for a day before the dawn of time — a
 * stored day is always valid.
 */
export function formatWorldDate(
  universalDay: number,
  hour: number | null,
  system: DateSystem
): WorldDateParts {
  const { universalYear, monthIndex, day } = universalDayToDate(universalDay);
  const systemYear = systemYearFromUniversalYear(
    universalYear,
    system.anchorYear
  );
  return {
    // The migration's CHECKs keep both arrays full-length; `?? ""` only
    // satisfies `noUncheckedIndexedAccess`.
    weekday: system.weekdayNames[weekdayOf(universalDay)] ?? "",
    day,
    month: system.monthNames[monthIndex] ?? "",
    year: formatSystemYear(systemYear, system),
    hour: hour === null ? null : formatHour(hour),
  };
}
