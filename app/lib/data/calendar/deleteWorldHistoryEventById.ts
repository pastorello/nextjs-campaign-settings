"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import findWorldHistoryEvent from "./findWorldHistoryEvent";

/**
 * Deletes a world history event (SPEC-014 §5.4, T5). Its links go with it —
 * the implicit join rows — and the linked places, NPCs, deities and
 * factions stay. A Server Action like `deleteSceneById`, since the page is
 * not a registered list with a `DELETE` route to fetch.
 */
export default async function deleteWorldHistoryEventById(
  id: number
): Promise<void> {
  await requireSession();

  const eventId = await findWorldHistoryEvent(id);

  try {
    await prisma.calendarEvent.delete({ where: { id: eventId } });
  } catch (error) {
    throw toDatabaseError("deleting world history event", error);
  }

  revalidateDashboard("world/history");
}
