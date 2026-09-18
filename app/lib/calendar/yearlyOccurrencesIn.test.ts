import { describe, expect, it } from "vitest";

import { DAYS_PER_YEAR } from "./monthLengths";
import { yearlyOccurrencesIn } from "./yearlyOccurrencesIn";

const event = (
  overrides: Partial<{
    id: number;
    startDay: number;
    endDay: number | null;
    repeatsYearly: boolean;
  }>
) => ({
  id: 1,
  title: "Feast",
  startDay: 100,
  endDay: null,
  repeatsYearly: false,
  ...overrides,
});

// Years 3 to 5 of the universal count.
const FIRST = 3 * DAYS_PER_YEAR;
const LAST = 6 * DAYS_PER_YEAR - 1;

describe("yearlyOccurrencesIn (SPEC-014 T9)", () => {
  it("lists a yearly event once for each year of the range, however early it started", () => {
    const feast = event({ repeatsYearly: true, startDay: 100 });

    expect(
      yearlyOccurrencesIn([feast], FIRST, LAST).map(({ startDay }) => startDay)
    ).toEqual([
      100 + 3 * DAYS_PER_YEAR,
      100 + 4 * DAYS_PER_YEAR,
      100 + 5 * DAYS_PER_YEAR,
    ]);
  });

  it("carries a multi-day yearly event's length to each occurrence", () => {
    const fair = event({ repeatsYearly: true, startDay: 100, endDay: 102 });

    const [first] = yearlyOccurrencesIn([fair], FIRST, LAST);

    expect(first).toMatchObject({
      startDay: 100 + FIRST,
      endDay: 102 + FIRST,
      repeatsYearly: true,
      title: "Feast",
    });
  });

  it("starts a yearly event at its first year when that falls inside the range", () => {
    const founding = event({ repeatsYearly: true, startDay: FIRST + 400 });

    expect(
      yearlyOccurrencesIn([founding], FIRST, LAST).map(
        ({ startDay }) => startDay
      )
    ).toEqual([FIRST + 400, FIRST + 400 + DAYS_PER_YEAR]);
  });

  it("keeps a one-off event as it is, and in chronological order with the rest", () => {
    const battle = event({ id: 2, startDay: FIRST + 50 });
    const feast = event({ id: 1, repeatsYearly: true, startDay: 10 });

    expect(
      yearlyOccurrencesIn([battle, feast], FIRST, LAST).map(
        ({ id, startDay }) => [id, startDay]
      )
    ).toEqual([
      [1, 10 + 3 * DAYS_PER_YEAR],
      [2, FIRST + 50],
      [1, 10 + 4 * DAYS_PER_YEAR],
      [1, 10 + 5 * DAYS_PER_YEAR],
    ]);
  });
});
