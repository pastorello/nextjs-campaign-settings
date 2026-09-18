import { describe, expect, it } from "vitest";

import { groupEventsByYearAndMonth } from "./groupEventsByYearAndMonth";

const event = (id: number, startDay: number) => ({ id, startDay });

describe("groupEventsByYearAndMonth (SPEC-014 T5)", () => {
  it("returns no groups for no events", () => {
    expect(groupEventsByYearAndMonth([])).toEqual([]);
  });

  it("groups by universal year, then by month, keeping the given order", () => {
    const events = [
      event(1, 0), // year 0, January 1
      event(2, 30), // year 0, January 31
      event(3, 31), // year 0, February 1
      event(4, 364), // year 0, December 31
      event(5, 365), // year 1, January 1
      event(6, 5 * 365 + 59), // year 5, March 1
    ];

    expect(groupEventsByYearAndMonth(events)).toEqual([
      {
        universalYear: 0,
        months: [
          { monthIndex: 0, events: [event(1, 0), event(2, 30)] },
          { monthIndex: 1, events: [event(3, 31)] },
          { monthIndex: 11, events: [event(4, 364)] },
        ],
      },
      {
        universalYear: 1,
        months: [{ monthIndex: 0, events: [event(5, 365)] }],
      },
      {
        universalYear: 5,
        months: [{ monthIndex: 2, events: [event(6, 5 * 365 + 59)] }],
      },
    ]);
  });

  it("keeps events of the same day in the order given", () => {
    const [year] = groupEventsByYearAndMonth([event(9, 40), event(2, 40)]);

    expect(year?.months[0]?.events.map(({ id }) => id)).toEqual([9, 2]);
  });
});
