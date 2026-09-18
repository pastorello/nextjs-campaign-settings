import type { z } from "zod";

import type calendarEventShape from "@/app/lib/data/validation/calendarEventShape";

type CalendarEventFields = z.output<z.ZodObject<typeof calendarEventShape>>;

/**
 * A validated event's own columns, as Prisma writes them (SPEC-014 §5.4) —
 * shared by world history (T5) and campaign events (T6), which add their
 * owner or links beside these. A blank description is written as `null`,
 * not left out, so clearing it on edit clears it.
 */
export default function toCalendarEventScalars(data: CalendarEventFields) {
  return {
    title: data.title,
    description: data.description ?? null,
    startDay: data.startDay,
    startHour: data.startHour,
    endDay: data.endDay,
    endHour: data.endHour,
    repeatsYearly: data.repeatsYearly,
  };
}
