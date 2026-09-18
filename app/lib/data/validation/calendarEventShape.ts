import calendarEventMeta from "@/app/lib/config/calendarEvent/calendarEventMeta";

/**
 * The fields every event's payload has (SPEC-014 §5.4), each validated by
 * its `calendarEventMeta` declaration. A kind of event spreads this into its
 * own `z.object` beside what it adds — world history its links (T5), a
 * campaign event its owner (T6) — and refines the whole with
 * `checkCalendarEventDates`, which needs every date field at once.
 *
 * A shape, not a schema: Zod refuses to `.extend()` a refined object, and a
 * generic "build a schema with extras" helper loses the field types the
 * refinement needs. Spelled out field by field rather than through
 * `buildBespokeCreateSchema`, so the parsed data keeps its types.
 *
 * One schema serves create and update: an event's form always sends every
 * field, and the date rules could not be checked on a partial payload.
 */
const calendarEventShape = {
  title: calendarEventMeta.title.validator,
  description: calendarEventMeta.description.validator,
  startDay: calendarEventMeta.startDay.validator,
  startHour: calendarEventMeta.startHour.validator,
  endDay: calendarEventMeta.endDay.validator,
  endHour: calendarEventMeta.endHour.validator,
  repeatsYearly: calendarEventMeta.repeatsYearly.validator,
};

export default calendarEventShape;
