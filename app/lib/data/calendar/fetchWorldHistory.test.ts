import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";
import WorldHistoryQuery from "@/app/lib/definitions/interfaces/calendar/WorldHistoryQuery";

/** The parts of a `findMany` call these tests read. */
interface FindManyArgs {
  where: Record<string, unknown>;
  orderBy: unknown;
}

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn<(args: FindManyArgs) => Promise<unknown>>(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { calendarEvent: { findMany } },
}));

import fetchWorldHistory, { YEARS_PER_PAGE } from "./fetchWorldHistory";

const noFilters: WorldHistoryQuery = {
  place: null,
  npc: null,
  deity: null,
  faction: null,
  page: 1,
};

const row = (id: number, startDay: number) => ({
  id,
  title: `Event ${id}`,
  description: null,
  startDay,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: false,
  zones: [{ id: 9, title: "Kang" }],
  npcs: [],
  deities: [],
  factions: [],
});

/** First call: the start days; second: the page's rows. */
function mockHistory(startDays: number[], rows: ReturnType<typeof row>[]) {
  findMany
    .mockResolvedValueOnce(startDays.map((startDay) => ({ startDay })))
    .mockResolvedValueOnce(rows);
}

describe("fetchWorldHistory (SPEC-014 T5)", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("lists only events with no campaign, oldest first, a day's untimed events first", async () => {
    mockHistory([10], [row(1, 10)]);

    await fetchWorldHistory(noFilters);

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { campaignId: null },
      orderBy: { startDay: "asc" },
    });
    expect(findMany.mock.calls[1]?.[0].orderBy).toEqual([
      { startDay: "asc" },
      { startHour: { sort: "asc", nulls: "first" } },
      { id: "asc" },
    ]);
  });

  it("reads each place link by name, like the other links", async () => {
    mockHistory([10], [row(1, 10)]);

    const { events } = await fetchWorldHistory(noFilters);

    expect(events[0]?.zones).toEqual([{ id: 9, name: "Kang" }]);
  });

  it("filters by every linked row the query names", async () => {
    mockHistory([], []);

    await fetchWorldHistory({ ...noFilters, place: 3, deity: 4, faction: 5 });

    expect(findMany.mock.calls[0]?.[0].where).toEqual({
      campaignId: null,
      zones: { some: { id: 3 } },
      deities: { some: { id: 4 } },
      factions: { some: { id: 5 } },
    });
  });

  it("filters by NPC", async () => {
    mockHistory([], []);

    await fetchWorldHistory({ ...noFilters, npc: 8 });

    expect(findMany.mock.calls[0]?.[0].where).toEqual({
      campaignId: null,
      npcs: { some: { id: 8 } },
    });
  });

  it("returns an empty first page for an empty history, without a second read", async () => {
    mockHistory([], []);

    expect(await fetchWorldHistory(noFilters)).toEqual({
      events: [],
      page: 1,
      pageCount: 1,
    });
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("pages by years that hold events, reading whole years", async () => {
    // Events in YEARS_PER_PAGE + 2 distinct years, two in the first year.
    const years = Array.from({ length: YEARS_PER_PAGE + 2 }, (_, i) => i * 3);
    const startDays = [0, 100, ...years.slice(1).map((year) => year * 365)];
    mockHistory(startDays, []);

    const page1 = await fetchWorldHistory(noFilters);

    expect(page1.pageCount).toBe(2);
    expect(findMany.mock.calls[1]?.[0].where.startDay).toEqual({
      gte: 0,
      lt: (years[YEARS_PER_PAGE - 1]! + 1) * 365,
    });

    findMany.mockReset();
    mockHistory(startDays, []);
    const page2 = await fetchWorldHistory({ ...noFilters, page: 2 });

    expect(page2.page).toBe(2);
    expect(findMany.mock.calls[1]?.[0].where.startDay).toEqual({
      gte: years[YEARS_PER_PAGE]! * 365,
      lt: (years[YEARS_PER_PAGE + 1]! + 1) * 365,
    });
  });

  it("clamps a page past the end to the last page", async () => {
    mockHistory([0], [row(1, 0)]);

    const result = await fetchWorldHistory({ ...noFilters, page: 7 });

    expect(result.page).toBe(1);
    expect(result.events).toHaveLength(1);
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchWorldHistory(noFilters)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
