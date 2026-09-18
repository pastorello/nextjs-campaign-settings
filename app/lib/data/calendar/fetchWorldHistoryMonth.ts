import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";
import WorldHistoryQuery from "@/app/lib/definitions/interfaces/calendar/WorldHistoryQuery";
import eventsInRangeWhere from "./eventsInRangeWhere";
import {
  toWorldHistoryEvent,
  worldHistoryEventOrder,
  worldHistoryEventSelect,
} from "./worldHistoryEventSelect";
import worldHistoryWhere from "./worldHistoryWhere";

/**
 * The world history events the month grid can show for one month
 * (SPEC-014 §5.6, T7): those overlapping its days, and every yearly event
 * that started by its last day, whose occurrence may fall in it — not the
 * whole history (§5's "the grid only loads the month shown"). Filtered by
 * the page's links, as the list is; read with their links, since the grid
 * opens the list's edit form.
 */
export default async function fetchWorldHistoryMonth(
  query: Omit<WorldHistoryQuery, "page">,
  firstDay: number,
  lastDay: number
): Promise<WorldHistoryEvent[]> {
  try {
    const rows = await prisma.calendarEvent.findMany({
      where: {
        ...worldHistoryWhere(query),
        ...eventsInRangeWhere(firstDay, lastDay, true),
      },
      orderBy: worldHistoryEventOrder,
      select: worldHistoryEventSelect,
    });
    return rows.map(toWorldHistoryEvent);
  } catch (error) {
    throw toDatabaseError("fetching a month of world history", error);
  }
}
