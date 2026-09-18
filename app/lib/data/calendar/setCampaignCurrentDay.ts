"use server";

import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import campaignCalendarMeta from "@/app/lib/config/calendar/campaignCalendarMeta";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import findCampaignId from "./findCampaignId";

const currentDaySchema = z.object({
  currentDay: campaignCalendarMeta.currentDay.validator,
});

/**
 * Sets a campaign's current in-world day (SPEC-014 §5.5, T6), or clears it
 * with `null` — after which nothing on the campaign's views reads as past.
 * The DM sets and advances it by hand; nothing moves it on its own.
 */
export default async function setCampaignCurrentDay(
  campaignId: number,
  formData: { currentDay: number | null }
): Promise<MutationResult> {
  await requireSession();

  const parsed = currentDaySchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const id = await findCampaignId(campaignId);
  try {
    await prisma.campaign.update({
      where: { id },
      data: { currentDay: parsed.data.currentDay },
    });
  } catch (error) {
    throw toDatabaseError("setting the campaign's current day", error);
  }

  revalidateDashboard("campaign/calendar");
  return { ok: true };
}
