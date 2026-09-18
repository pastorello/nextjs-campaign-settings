# The world's calendar

How the setting counts days, weeks, the moon and the zodiac. The rules are the
DM's (agreed 2026-09-18 in [SPEC-014](../specs/014-calendar-and-timeline.md)
§5.1–5.3); the storage decision behind them is
[ADR-0015](../adr/0015-time-as-a-universal-day-number.md); the code is
`app/lib/calendar/`. Nothing here is specific to a game system — the calendar
is shared by all of them.

## Days and years

- Every date is a **universal day number**. Day 0 is 1 January of universal
  year 0, the dawn of time; there are no days before it.
- A year has **365 days**, in twelve months of the Gregorian lengths: 31, 28,
  31, 30, 31, 30, 31, 31, 30, 31, 30, 31. **No leap years** — 29 February never
  exists.
- `universalYear = floor(day / 365)`; the day of the year is `day mod 365`.
- A **date system** only re-labels the year: `systemYear = universalYear −
anchorYear`. Year 0 is the anchor event's own year and reads as "after"
  ("0 d.C."); year −1 is the year before it ("1 a.C."). A given day has the same
  day and month in every system.
- An optional **hour** is 0–23, stored beside the day, never folded into it.

## The week

Seven days, running unbroken from day 0: universal day _n_ is weekday
`n mod 7`, and day 0 is the first weekday in every system. Because
365 = 52 × 7 + 1, each year starts one weekday later than the one before, and
the pattern repeats every seven years.

## The moon

- One moon, on an **exact 28-day cycle**. The DM sets one **reference new
  moon** (a universal day); until then no phase is shown.
- A day's position in the cycle is `(day − reference) mod 28`, taken as a true
  modulo so days before the reference count backwards correctly.
- Eight phases of 3½ days each. A day takes the phase in force at its start,
  so the phases split into alternating runs of four and three days:

| Day of cycle | Phase           | Days |
| ------------ | --------------- | ---- |
| 0–3          | New             | 4    |
| 4–6          | Waxing crescent | 3    |
| 7–10         | First quarter   | 4    |
| 11–13        | Waxing gibbous  | 3    |
| 14–17        | Full            | 4    |
| 18–20        | Waning gibbous  | 3    |
| 21–24        | Last quarter    | 4    |
| 25–27        | Waning crescent | 3    |

## The zodiac

The **thirteen astronomical signs**, Ophiuchus included, by the constellation
the sun stands in rather than the twelve equal astrological sectors. The
ranges are the approximate IAU sun-in-constellation dates (the constellation
boundaries fixed by the IAU in 1930, as the sun crosses them in the present
era), laid onto the 365-day year with no leap day, and rounded to whole days.
Each sign runs from its first day to the day before the next sign's first day.
The dates vary by a day between published sources; these are the ones the code
uses, and SPEC-014 §5.3 fixed Ophiuchus as 29 November – 17 December.

| Sign        | First day    | Last day     | Days |
| ----------- | ------------ | ------------ | ---- |
| Capricorn   | 20 January   | 15 February  | 27   |
| Aquarius    | 16 February  | 10 March     | 23   |
| Pisces      | 11 March     | 17 April     | 38   |
| Aries       | 18 April     | 12 May       | 25   |
| Taurus      | 13 May       | 20 June      | 39   |
| Gemini      | 21 June      | 19 July      | 29   |
| Cancer      | 20 July      | 9 August     | 21   |
| Leo         | 10 August    | 15 September | 37   |
| Virgo       | 16 September | 29 October   | 44   |
| Libra       | 30 October   | 22 November  | 24   |
| Scorpio     | 23 November  | 28 November  | 6    |
| Ophiuchus   | 29 November  | 17 December  | 19   |
| Sagittarius | 18 December  | 19 January   | 33   |

The table is `ZODIAC_STARTS` in `app/lib/calendar/zodiacSignOf.ts`; change the
two together. Month and sign names here are the Gregorian and English ones for
reference only — in the app, month names come from each date system and sign
and phase names from the message catalogues.
