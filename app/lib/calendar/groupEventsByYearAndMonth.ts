import { universalDayToDate } from "./universalDayToDate";

export interface MonthGroup<Event> {
  /** 0-based, an index into a date system's `monthNames`. */
  monthIndex: number;
  events: Event[];
}

export interface YearGroup<Event> {
  /** The universal year; the page re-labels it in the displayed system. */
  universalYear: number;
  months: MonthGroup<Event>[];
}

/**
 * Groups events by the year and month they start in, for the chronological
 * list (SPEC-014 §5.6). Expects the events already in order of start (as
 * `fetchWorldHistory` returns them) and keeps that order within a month.
 *
 * Grouped on the universal year, not a system's: a date system only
 * re-numbers years (ADR-0015), so the groups are the same in every system
 * and only the year heading changes with the toggle.
 */
export function groupEventsByYearAndMonth<Event extends { startDay: number }>(
  events: readonly Event[]
): YearGroup<Event>[] {
  const years: YearGroup<Event>[] = [];

  for (const event of events) {
    const { universalYear, monthIndex } = universalDayToDate(event.startDay);

    let year = years.at(-1);
    if (year?.universalYear !== universalYear) {
      year = { universalYear, months: [] };
      years.push(year);
    }

    let month = year.months.at(-1);
    if (month?.monthIndex !== monthIndex) {
      month = { monthIndex, events: [] };
      year.months.push(month);
    }

    month.events.push(event);
  }

  return years;
}
