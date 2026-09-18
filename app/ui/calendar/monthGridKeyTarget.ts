/** Where a key pressed on a month grid's day moves the focus. */
export type MonthGridKeyTarget =
  { kind: "day"; day: number } | { kind: "month"; offset: -1 | 1 };

/** The facts about the focused day the key handling needs. */
export interface FocusedGridDay {
  /** Day of the month, from 1. */
  day: number;
  /** Its column, 0 to `weekLength − 1`. */
  weekday: number;
  daysInMonth: number;
  weekLength: number;
}

/**
 * The month grid's keyboard navigation (SPEC-014 T9), after the ARIA grid
 * pattern: arrows move a day or a week, Home/End go to the start/end of the
 * week's row, PageUp/PageDown to the previous/next month. A move that would
 * leave the month stays on the focused day rather than wrapping — the month
 * is one page, and PageUp/PageDown are the way off it. `null` for a key the
 * grid does not handle, so it keeps its default behaviour.
 */
export function monthGridKeyTarget(
  key: string,
  { day, weekday, daysInMonth, weekLength }: FocusedGridDay
): MonthGridKeyTarget | null {
  const stayWithin = (target: number) =>
    target >= 1 && target <= daysInMonth ? target : day;

  switch (key) {
    case "ArrowLeft":
      return { kind: "day", day: stayWithin(day - 1) };
    case "ArrowRight":
      return { kind: "day", day: stayWithin(day + 1) };
    case "ArrowUp":
      return { kind: "day", day: stayWithin(day - weekLength) };
    case "ArrowDown":
      return { kind: "day", day: stayWithin(day + weekLength) };
    case "Home":
      return { kind: "day", day: Math.max(1, day - weekday) };
    case "End":
      return {
        kind: "day",
        day: Math.min(daysInMonth, day + (weekLength - 1 - weekday)),
      };
    case "PageUp":
      return { kind: "month", offset: -1 };
    case "PageDown":
      return { kind: "month", offset: 1 };
    default:
      return null;
  }
}
