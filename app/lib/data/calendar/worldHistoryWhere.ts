import { Prisma } from "@/generated/prisma/client";

import WorldHistoryQuery from "@/app/lib/definitions/interfaces/calendar/WorldHistoryQuery";

/**
 * World history's events matching the page's link filters (SPEC-014
 * §5.6): the events with no campaign, linked to the query's place, NPC,
 * deity and faction — all that are set must match. Shared by the list
 * (`fetchWorldHistory`) and the month grid (`fetchWorldHistoryMonth`), so
 * both views filter alike.
 */
export default function worldHistoryWhere(
  query: Omit<WorldHistoryQuery, "page">
): Prisma.calendarEventWhereInput {
  return {
    campaignId: null,
    ...(query.place !== null && { zones: { some: { id: query.place } } }),
    ...(query.npc !== null && { npcs: { some: { id: query.npc } } }),
    ...(query.deity !== null && { deities: { some: { id: query.deity } } }),
    ...(query.faction !== null && {
      factions: { some: { id: query.faction } },
    }),
  };
}
