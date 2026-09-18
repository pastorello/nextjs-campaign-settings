"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import campaignEventSchema from "@/app/lib/data/validation/campaignEventSchema";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import CampaignEventInput from "@/app/lib/definitions/interfaces/calendar/CampaignEventInput";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import findCampaignId from "./findCampaignId";
import resolveCampaignEventOwner from "./resolveCampaignEventOwner";
import toCalendarEventScalars from "./toCalendarEventScalars";

/**
 * Adds an event to a campaign's calendar (SPEC-014 §5.4, T6), optionally
 * naming one of its adventures and one scene. Auth first, then the schema
 * (the fields, the date rules, no world history links), then that the
 * campaign exists and the adventure and scene are its own — the adventure
 * set from the scene when only the scene is named. Refusals are field
 * errors, keyed (TD-124).
 */
export default async function createCampaignEvent(
  campaignId: number,
  input: CampaignEventInput
): Promise<MutationResult> {
  await requireSession();

  const parsed = campaignEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const campaign = await findCampaignId(campaignId);
  const owner = await resolveCampaignEventOwner(
    campaign,
    parsed.data.adventureId,
    parsed.data.sceneId
  );
  if (!owner.ok) return { ok: false, errors: owner.errors };

  try {
    await prisma.calendarEvent.create({
      data: {
        ...toCalendarEventScalars(parsed.data),
        campaignId: campaign,
        adventureId: owner.adventureId,
        sceneId: owner.sceneId,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating campaign event", error);
  }

  revalidateDashboard("campaign/calendar");
  return { ok: true };
}
