import type { z } from "zod";

import type worldHistoryEventSchema from "@/app/lib/data/validation/worldHistoryEventSchema";
import toCalendarEventScalars from "./toCalendarEventScalars";

type WorldHistoryEventData = z.output<typeof worldHistoryEventSchema>;

const asConnections = (ids: number[]) =>
  [...new Set(ids)].map((id) => ({ id }));

/**
 * A validated world history payload split into what Prisma writes
 * (SPEC-014 §5.4): the event's own columns, and its links as `{ id }`
 * lists — de-duplicated, since the form's multiselects could send an id
 * twice. The caller wraps the links in `connect` (create) or `set`
 * (update, so a link the DM removed is dropped). `campaignId` is always
 * `null`: that is what makes the event world history.
 */
export default function toWorldHistoryEventWrite(data: WorldHistoryEventData) {
  return {
    scalars: { ...toCalendarEventScalars(data), campaignId: null },
    links: {
      zones: asConnections(data.zoneIds),
      npcs: asConnections(data.npcIds),
      deities: asConnections(data.deityIds),
      factions: asConnections(data.factionIds),
    },
  };
}
