import CalendarEventBase from "@/app/lib/definitions/interfaces/calendar/CalendarEventBase";
import CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";

/**
 * One entry of a campaign's calendar (SPEC-014 §5.4): the campaign's own
 * event, or a world history event shown beside it, read-only.
 */
export type CampaignCalendarItem =
  | (CampaignEvent & { kind: "campaign" })
  | (CalendarEventBase & { kind: "history" });

/** Both kinds in one chronological order: start day, untimed first. */
function byStart(a: CampaignCalendarItem, b: CampaignCalendarItem): number {
  return (
    a.startDay - b.startDay ||
    (a.startHour ?? -1) - (b.startHour ?? -1) ||
    (a.kind === b.kind ? 0 : a.kind === "history" ? -1 : 1) ||
    a.id - b.id
  );
}

/**
 * A campaign's events and the world history beside them, tagged by kind
 * and in one chronological order — what both the list and the month grid
 * show on the campaign calendar.
 */
export function toCampaignCalendarItems(
  events: readonly CampaignEvent[],
  history: readonly CalendarEventBase[]
): CampaignCalendarItem[] {
  return [
    ...events.map((event) => ({ ...event, kind: "campaign" as const })),
    ...history.map((event) => ({ ...event, kind: "history" as const })),
  ].sort(byStart);
}
