import { eventTiming, type EventOccurrence } from "./eventTiming";

interface UpcomingCandidate {
  id: number;
  startDay: number;
  startHour: number | null;
  endDay: number | null;
  repeatsYearly: boolean;
}

export interface UpcomingEvent<Event> extends EventOccurrence {
  event: Event;
}

/**
 * The next `count` events after a campaign's current day (SPEC-014 §5.5 —
 * the campaign page shows three): those whose counting occurrence starts
 * after today, soonest first — a yearly event by its next occurrence. An
 * event spanning today is current, not upcoming, and is left out. Ties go
 * to the untimed event first (as the lists order a day), then the older
 * row. Empty with no current day.
 */
export function upcomingEvents<Event extends UpcomingCandidate>(
  events: readonly Event[],
  today: number | null,
  count: number
): UpcomingEvent<Event>[] {
  const upcoming: UpcomingEvent<Event>[] = [];
  for (const event of events) {
    const timed = eventTiming(event, today);
    if (timed?.timing !== "upcoming") continue;
    upcoming.push({
      event,
      startDay: timed.startDay,
      endDay: timed.endDay,
    });
  }

  return upcoming
    .sort(
      (a, b) =>
        a.startDay - b.startDay ||
        (a.event.startHour ?? -1) - (b.event.startHour ?? -1) ||
        a.event.id - b.event.id
    )
    .slice(0, count);
}
