"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import campaignEventSchema from "@/app/lib/data/validation/campaignEventSchema";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import CampaignEventInput from "@/app/lib/definitions/interfaces/calendar/CampaignEventInput";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import findCampaignEvent from "./findCampaignEvent";
import resolveCampaignEventOwner from "./resolveCampaignEventOwner";
import toCalendarEventScalars from "./toCalendarEventScalars";

/**
 * Edits a campaign event (SPEC-014 §5.4, T6). The form sends every field,
 * so this replaces them all; the adventure and scene are checked against
 * the event's own campaign, which an edit never changes. A world history
 * event is not a campaign event: naming one is a not-found.
 */
export default async function updateCampaignEvent(
  id: number,
  input: CampaignEventInput
): Promise<MutationResult> {
  await requireSession();

  const parsed = campaignEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const event = await findCampaignEvent(id);
  const owner = await resolveCampaignEventOwner(
    event.campaignId,
    parsed.data.adventureId,
    parsed.data.sceneId
  );
  if (!owner.ok) return { ok: false, errors: owner.errors };

  try {
    await prisma.calendarEvent.update({
      where: { id: event.id },
      data: {
        ...toCalendarEventScalars(parsed.data),
        adventureId: owner.adventureId,
        sceneId: owner.sceneId,
      },
    });
  } catch (error) {
    throw toDatabaseError("updating campaign event", error);
  }

  revalidateDashboard("campaign/calendar");
  return { ok: true };
}
