# ADR-0015: Time as a universal day number

- **Status:** Accepted
- **Date:** 2026-09-18
- **Deciders:** the maintainer (DM), with Claude Code
- **Related:** [SPEC-014](../specs/014-calendar-and-timeline.md) (§5.1–5.3, and task T1, which writes this); [ADR-0013](./0013-game-systems.md) (the calendar is world-level, shared by every game system); `app/lib/calendar/`; [`docs/domain/calendar.md`](../domain/calendar.md)

## Context

SPEC-014 gives the setting a calendar: planned campaign events and world history
on one timeline, shown as a sorted list and as a month grid with weekdays, a
moon phase and a zodiac sign per day. The shape of that calendar was decided
with the DM on 2026-09-18:

- Time begins at a **dawn of time**. Nothing precedes it.
- Every year has **365 days** in twelve months of the Gregorian lengths. No leap
  years.
- A **seven-day week** runs unbroken from the first day, so a month starts on a
  different weekday each year.
- The world has **several ways of counting years** — a universal count from the
  dawn of time, and others anchored to an event ("330 a.C.", "1230 d.C."). A
  date system renames months and weekdays and **re-labels the year**; it does
  not change the shape of the year. A given day is the same day and month in
  every system.
- A date may carry an optional **hour**, 0–23. No minutes.

The questions this ADR settles are how a date is stored, and which code owns
the arithmetic. They matter because they decide what sorting, range queries,
"past vs upcoming", re-anchoring a date system and the month grid all cost —
and because off-by-one errors around year 0 and negative years are the spec's
first named risk.

## Decision

**We will store every date as one integer, the universal day number, and derive
everything else from it in pure functions under `app/lib/calendar/`.**

- **Day 0** is the first day (1 January) of **universal year 0**, the dawn of
  time. Day numbers are never negative; a date before the dawn is invalid.
- `universalYear = floor(day / 365)`; the day of the year is `day mod 365`,
  split into a month index (0–11) and a day of the month (1-based) by the fixed
  Gregorian month lengths.
- **Weekday** is `day mod 7`; day 0 is the first weekday in every system.
- **A date system only re-labels the year**: `systemYear = universalYear −
anchorYear`, and back. Year 0 exists — the anchor event's own year — so no
  "there is no year 0" correction is needed in either direction. A label is
  the year's absolute value plus "after" (year ≥ 0) or "before" (year < 0):
  −330 reads "330 a.C.", 0 reads "0 d.C.".
- **The hour** is a separate, nullable integer beside the day (`startHour`,
  `endHour` in SPEC-014 §6). It never enters the day number.
- The moon phase and zodiac sign are functions of the day number too (a
  reference new-moon day and a fixed table); see
  [`docs/domain/calendar.md`](../domain/calendar.md).

## Alternatives considered

### Year / month / day columns stored in each date system

Store what the DM typed — a system id, a year, a month, a day — per date. It
reads naturally in `psql`, and a date round-trips to the form without any
conversion.

Not chosen, because the timeline is shared across systems and the stored form
would not be. Sorting or range-querying events entered in different systems
would need the conversion in SQL on every read; "events in this month" would be
a three-column comparison joined to each row's system; and **editing a system's
anchor year would silently move every event dated in it** — the opposite of
SPEC-014 §5.2, where re-anchoring re-labels years and moves nothing. Keeping
the universal year/month/day as three columns (no system id) avoids the anchor
problem but still makes ordering and ranges three-column comparisons, and still
allows invalid combinations (31 April) at the storage level, where a single
integer has none.

### Real date types (`Date`, Postgres `date` / `timestamp`)

Use the platform's calendar and get formatting, arithmetic and indexing for
free.

Not chosen, because the platform's calendar is the real one, and this world's
is not: `Date` and Postgres both have leap years, a proleptic Gregorian week
anchored to real history, and no concept of a dawn of time at a chosen year 0.
Every derived value — the weekday, the day of the year, the month grid — would
have to correct for rules this world does not have, and a date near the dawn
would be thousands of years before 1970 in a type whose edges (year 0 / 1 BC,
time zones on `timestamp`) are exactly where off-by-one errors live. An integer
has no such edges, and a plain `Int` column orders and ranges correctly with an
ordinary index.

## Consequences

**Positive**

- Sorting, ranges, "past / upcoming" against a campaign's current day, and
  paging history by year are integer comparisons on one indexed column.
- Re-anchoring a date system or switching the displayed system changes no
  stored data.
- Weekday, moon phase and zodiac are pure functions of one number, testable
  exhaustively without a database or a browser.
- An impossible date (31 April, a day before the dawn) cannot be stored; it can
  only fail validation on the way in.

**Negative**

- Raw SQL and `psql` show a day number, not a readable date. Anything that
  displays a date must go through `app/lib/calendar/`.
- Leap years, if ever wanted, would change the meaning of every stored number;
  that is a data migration, not a setting.

**Neutral / follow-up work**

- The date input and display components (SPEC-014 T4) convert through these
  functions; names of months, weekdays, signs and phases come from the date
  system rows and the message catalogues, not from `app/lib/calendar/`, which
  returns indices and string-literal unions only.

## Revisit when

The DM wants a world calendar that is not "twelve fixed Gregorian months, no
leap years": leap years, DM-defined month lengths, or more than one moon. Each
is a non-goal of SPEC-014 today, and each changes the day-to-date mapping this
ADR fixes.
