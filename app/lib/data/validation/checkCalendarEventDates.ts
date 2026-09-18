import { z } from "zod";

import { DAYS_PER_YEAR } from "@/app/lib/calendar/monthLengths";
import type FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";

interface CalendarEventDates {
  startDay: number;
  startHour: number | null;
  endDay: number | null;
  endHour: number | null;
  repeatsYearly: boolean;
}

/**
 * The rules an event's dates obey together (SPEC-014 §5.4, edge cases) —
 * what no single field's validator can see. Each one refuses on the field
 * the DM has to change, so the form shows it there:
 *
 * - an end hour needs an end day (a one-day event has no end at all);
 * - the end is not before the start — equal days are a one-day event, and
 *   on the same day an end hour before the start hour is refused too;
 * - a yearly event spans at most a year: its last day is at most 364 days
 *   after its first, so it never overlaps its own next occurrence.
 *
 * Shared by world history (T5) and campaign events (T6): each refines its
 * `z.object({ ...calendarEventShape, … })` with this.
 */
export default function checkCalendarEventDates(
  dates: CalendarEventDates,
  context: z.RefinementCtx
): void {
  const refuse = (path: keyof CalendarEventDates, message: FieldErrorKey) =>
    context.addIssue({ code: "custom", path: [path], message });

  const { startDay, startHour, endDay, endHour, repeatsYearly } = dates;

  if (endDay === null) {
    if (endHour !== null) refuse("endHour", "invalid");
    return;
  }

  const endsBeforeStart =
    endDay < startDay ||
    (endDay === startDay &&
      startHour !== null &&
      endHour !== null &&
      endHour < startHour);
  if (endsBeforeStart) {
    refuse("endDay", "endBeforeStart");
    return;
  }

  if (repeatsYearly && endDay - startDay >= DAYS_PER_YEAR) {
    refuse("endDay", "repeatSpansOverAYear");
  }
}
