import { describe, expect, it } from "vitest";

import {
  humanCountFixture as human,
  universalCountFixture as universal,
} from "./dateSystemFixtures";
import { formatHour } from "./formatHour";
import { formatSystemYear, formatWorldDate } from "./formatWorldDate";

const ANCHOR = human.anchorYear;

describe("formatWorldDate (SPEC-014 T4)", () => {
  it("reads the dawn of time in the universal count", () => {
    expect(formatWorldDate(0, null, universal)).toEqual({
      weekday: "Lunedì",
      day: 1,
      month: "Gennaio",
      year: "0 a.T.",
      hour: null,
    });
  });

  it("reads one day in two systems: same day and month, own names, own year", () => {
    // 3 March of universal year 5440 = human year −330.
    const day = (ANCHOR - 330) * 365 + 31 + 28 + 2;

    const inUniversal = formatWorldDate(day, 14, universal);
    const inHuman = formatWorldDate(day, 14, human);

    expect(inUniversal.year).toBe(`${ANCHOR - 330} a.T.`);
    expect(inHuman.year).toBe("330 a.C.");
    expect(inHuman.day).toBe(3);
    expect(inUniversal.day).toBe(3);
    expect(inUniversal.month).toBe("Marzo");
    expect(inHuman.month).toBe("Piovoso");
    // The week runs unbroken, so the weekday index is the same in both.
    expect(universal.weekdayNames.indexOf(inUniversal.weekday)).toBe(
      human.weekdayNames.indexOf(inHuman.weekday)
    );
    expect(inHuman.hour).toBe("14:00");
  });

  it('reads year 0 as "0 d.C." and 1230 as "1230 d.C." (§9 decision 2)', () => {
    expect(formatWorldDate(ANCHOR * 365, null, human).year).toBe("0 d.C.");
    expect(formatWorldDate((ANCHOR + 1230) * 365, null, human).year).toBe(
      "1230 d.C."
    );
    expect(formatWorldDate(ANCHOR * 365 - 1, null, human).year).toBe("1 a.C.");
  });

  it("keeps the sign for a system with no 'before' abbreviation", () => {
    expect(formatSystemYear(-3, universal)).toBe("-3");
    expect(formatSystemYear(-3, human)).toBe("3 a.C.");
  });

  it('writes hours as "14:00" and "09:00" (§9 decision 4)', () => {
    expect(formatHour(14)).toBe("14:00");
    expect(formatHour(9)).toBe("09:00");
    expect(formatHour(0)).toBe("00:00");
  });
});
