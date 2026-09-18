import { Prisma } from "@/generated/prisma/client";

import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * The start day of the first or last matching event, or `null` when none
 * matches — where the month grid opens when the URL names no month
 * (SPEC-014 T7): world history at its latest event, a campaign without a
 * current day at its first.
 */
export default async function findEdgeEventDay(
  where: Prisma.calendarEventWhereInput,
  edge: "first" | "last"
): Promise<number | null> {
  try {
    const row = await prisma.calendarEvent.findFirst({
      where,
      orderBy: { startDay: edge === "first" ? "asc" : "desc" },
      select: { startDay: true },
    });
    return row?.startDay ?? null;
  } catch (error) {
    throw toDatabaseError("finding where the calendar opens", error);
  }
}
