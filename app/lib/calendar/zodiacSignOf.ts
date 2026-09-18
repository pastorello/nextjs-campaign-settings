import { dateToUniversalDay } from "./dateToUniversalDay";
import { dayOfYear } from "./dayOfYear";
import type ZodiacSign from "./ZodiacSign";

/**
 * The first day of each sign, in calendar order (`monthIndex` 0-based, `day`
 * 1-based); a sign lasts until the day before the next one starts, and
 * Sagittarius wraps across the new year. These are the approximate IAU
 * sun-in-constellation dates on a year without leap days — the table and its
 * ranges are recorded in `docs/domain/calendar.md`; change both together.
 */
export const ZODIAC_STARTS: readonly {
  sign: ZodiacSign;
  monthIndex: number;
  day: number;
}[] = [
  { sign: "capricorn", monthIndex: 0, day: 20 },
  { sign: "aquarius", monthIndex: 1, day: 16 },
  { sign: "pisces", monthIndex: 2, day: 11 },
  { sign: "aries", monthIndex: 3, day: 18 },
  { sign: "taurus", monthIndex: 4, day: 13 },
  { sign: "gemini", monthIndex: 5, day: 21 },
  { sign: "cancer", monthIndex: 6, day: 20 },
  { sign: "leo", monthIndex: 7, day: 10 },
  { sign: "virgo", monthIndex: 8, day: 16 },
  { sign: "libra", monthIndex: 9, day: 30 },
  { sign: "scorpio", monthIndex: 10, day: 23 },
  { sign: "ophiuchus", monthIndex: 10, day: 29 },
  { sign: "sagittarius", monthIndex: 11, day: 18 },
];

/** Each sign's first day as a 0-based day of the year (year 0's day number). */
const STARTS_BY_DAY_OF_YEAR = ZODIAC_STARTS.map(
  ({ sign, monthIndex, day }) => ({
    sign,
    startDay: dateToUniversalDay({ universalYear: 0, monthIndex, day }),
  })
);

/**
 * The zodiac sign the sun is in on a universal day. A 0-based day of the
 * year is also accepted, since days 0–364 are year 0's.
 */
export function zodiacSignOf(universalDay: number): ZodiacSign {
  const yearDay = dayOfYear(universalDay);
  // Before the first start (1–19 January) is the tail of last year's Sagittarius.
  let sign: ZodiacSign = "sagittarius";
  for (const start of STARTS_BY_DAY_OF_YEAR) {
    if (start.startDay <= yearDay) sign = start.sign;
  }
  return sign;
}
