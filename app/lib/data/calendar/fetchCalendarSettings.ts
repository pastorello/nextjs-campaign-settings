import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import CalendarSettings from "@/app/lib/definitions/interfaces/calendar/CalendarSettings";

/**
 * The calendar settings singleton (SPEC-014 §6). The migration inserts it,
 * but a missing row reads as "nothing set" rather than an error: its one
 * field is optional, and "no reference new moon" already means "no phases
 * shown" (§5.3).
 */
export default async function fetchCalendarSettings(): Promise<CalendarSettings> {
  try {
    const row = await prisma.calendarSettings.findUnique({
      where: { id: 1 },
      select: { moonNewMoonDay: true },
    });
    return { moonNewMoonDay: row?.moonNewMoonDay ?? null };
  } catch (error) {
    throw toDatabaseError("fetching the calendar settings", error);
  }
}
