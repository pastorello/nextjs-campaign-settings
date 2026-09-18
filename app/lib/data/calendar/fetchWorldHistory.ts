import { Prisma } from "@/generated/prisma/client";

import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { DAYS_PER_YEAR } from "@/app/lib/calendar/monthLengths";
import WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";
import WorldHistoryQuery from "@/app/lib/definitions/interfaces/calendar/WorldHistoryQuery";

/** How many years that hold an event one page of the list shows. */
export const YEARS_PER_PAGE = 10;

export interface WorldHistoryPage {
  /** In chronological order: by start day, a day's untimed events first. */
  events: WorldHistoryEvent[];
  /** The page shown — the query's, clamped to the last page. */
  page: number;
  /** At least 1, so an empty history still reads "page 1 of 1". */
  pageCount: number;
}

const byName = {
  select: { id: true, name: true },
  orderBy: { name: "asc" },
} as const;

/**
 * One page of the world's history (SPEC-014 §5.6, T5): the events with no
 * campaign, oldest first, filtered by the query's linked place, NPC, deity
 * and faction (all that are set must match).
 *
 * **Paged by year** (§5 edge cases, "very long history"): a page holds
 * `YEARS_PER_PAGE` consecutive years *that have events*, whole — a year is
 * never split across two pages, so a year's heading is never repeated.
 * Years are universal years, which is safe for every date system: a system
 * only re-numbers years, so its years begin on the same days (ADR-0015).
 * The first read takes only the matching start days, to find the page's
 * years; the second reads that page's events in full.
 *
 * A yearly event is listed once, in the year it starts (§5.4).
 */
export default async function fetchWorldHistory(
  query: WorldHistoryQuery
): Promise<WorldHistoryPage> {
  const where: Prisma.calendarEventWhereInput = {
    campaignId: null,
    ...(query.place !== null && { zones: { some: { id: query.place } } }),
    ...(query.npc !== null && { npcs: { some: { id: query.npc } } }),
    ...(query.deity !== null && { deities: { some: { id: query.deity } } }),
    ...(query.faction !== null && {
      factions: { some: { id: query.faction } },
    }),
  };

  try {
    const starts = await prisma.calendarEvent.findMany({
      where,
      select: { startDay: true },
      orderBy: { startDay: "asc" },
    });
    const years = [...new Set(starts.map(({ startDay }) => yearOf(startDay)))];

    const pageCount = Math.max(1, Math.ceil(years.length / YEARS_PER_PAGE));
    const page = Math.min(query.page, pageCount);
    const pageYears = years.slice(
      (page - 1) * YEARS_PER_PAGE,
      page * YEARS_PER_PAGE
    );
    const firstYear = pageYears[0];
    const lastYear = pageYears.at(-1);
    if (firstYear === undefined || lastYear === undefined) {
      return { events: [], page, pageCount };
    }

    const rows = await prisma.calendarEvent.findMany({
      where: {
        ...where,
        startDay: {
          gte: firstYear * DAYS_PER_YEAR,
          lt: (lastYear + 1) * DAYS_PER_YEAR,
        },
      },
      orderBy: [
        { startDay: "asc" },
        { startHour: { sort: "asc", nulls: "first" } },
        { id: "asc" },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        startDay: true,
        startHour: true,
        endDay: true,
        endHour: true,
        repeatsYearly: true,
        zones: {
          select: { id: true, title: true },
          orderBy: { title: "asc" },
        },
        npcs: byName,
        deities: byName,
        factions: byName,
      },
    });

    const events = rows.map(({ zones, ...event }) => ({
      ...event,
      zones: zones.map(({ id, title }) => ({ id, name: title })),
    }));
    return { events, page, pageCount };
  } catch (error) {
    throw toDatabaseError("fetching the world history", error);
  }
}

function yearOf(universalDay: number): number {
  return Math.floor(universalDay / DAYS_PER_YEAR);
}
