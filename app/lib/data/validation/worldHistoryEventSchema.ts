import { z } from "zod";

import worldHistoryLinkMeta from "@/app/lib/config/calendarEvent/worldHistoryLinkMeta";
import calendarEventShape from "./calendarEventShape";
import checkCalendarEventDates from "./checkCalendarEventDates";

/**
 * A world history event's payload (SPEC-014 §5.4): the shared event fields
 * and date rules, plus its links. That each linked id names a real row is
 * checked afterwards by `findMissingEventLinks` — a schema cannot read the
 * database.
 */
const worldHistoryEventSchema = z
  .object({
    ...calendarEventShape,
    zoneIds: worldHistoryLinkMeta.zoneIds.validator,
    npcIds: worldHistoryLinkMeta.npcIds.validator,
    deityIds: worldHistoryLinkMeta.deityIds.validator,
    factionIds: worldHistoryLinkMeta.factionIds.validator,
  })
  .superRefine(checkCalendarEventDates);

export default worldHistoryEventSchema;
