"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import findCampaignEvent from "./findCampaignEvent";

/**
 * Deletes a campaign event (SPEC-014 §5.4, T6); its adventure and scene
 * stay. A Server Action like `deleteWorldHistoryEventById`, since the
 * calendar is not a registered list with a `DELETE` route to fetch.
 */
export default async function deleteCampaignEventById(
  id: number
): Promise<void> {
  await requireSession();

  const event = await findCampaignEvent(id);

  try {
    await prisma.calendarEvent.delete({ where: { id: event.id } });
  } catch (error) {
    throw toDatabaseError("deleting campaign event", error);
  }

  revalidateDashboard("campaign/calendar");
}
