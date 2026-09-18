import type CalendarMonth from "./CalendarMonth";
import type MoonPhase from "./MoonPhase";
import type ZodiacSign from "./ZodiacSign";

/** What the month grid needs of an event to place it on its days. */
export interface GridEventDates {
  startDay: number;
  startHour: number | null;
  endDay: number | null;
  endHour: number | null;
  repeatsYearly: boolean;
}

/**
 * One event on one day of the grid. A multi-day event has a placement on
 * every day it spans (clipped to the month); a yearly event, on each
 * year's occurrence (SPEC-014 §5.4).
 */
export interface MonthDayEvent<Event> {
  event: Event;
  /** The occurrence's own first and last universal days, unclipped. */
  occurrenceStartDay: number;
  occurrenceEndDay: number;
  /** The occurrence began on an earlier day. */
  continuesFromBefore: boolean;
  /** The occurrence goes on to a later day. */
  continuesAfter: boolean;
  /** The start hour, on the occurrence's first day only. */
  startHour: number | null;
  /** The end hour, on the occurrence's last day only. */
  endHour: number | null;
}

export interface MonthViewDay<Event> {
  universalDay: number;
  /** The day of the month, 1-based. */
  day: number;
  /** 0–6; column 0 is every system's first weekday name (§5.1). */
  weekday: number;
  /** `null` until the DM sets a reference new moon (§5.3). */
  moonPhase: MoonPhase | null;
  zodiacSign: ZodiacSign;
  /** By occurrence start, untimed first, then in the order given. */
  events: MonthDayEvent<Event>[];
}

/**
 * A month laid out for the grid (SPEC-014 §5.6, T7): its days, and the
 * same days cut into weeks of seven, padded with `null` before the first
 * day and after the last so every week is a full row.
 */
export interface MonthView<Event> extends CalendarMonth {
  firstDay: number;
  lastDay: number;
  leadingBlanks: number;
  trailingBlanks: number;
  days: MonthViewDay<Event>[];
  weeks: (MonthViewDay<Event> | null)[][];
}
