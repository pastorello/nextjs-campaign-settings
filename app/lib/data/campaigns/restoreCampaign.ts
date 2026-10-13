"use server";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import {
  campaignIdSchema,
  type CampaignIdInput,
} from "@/app/lib/data/validation/campaignIdSchema";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

/**
 * Restores an archived campaign (SPEC-032 §5.6): clears `archivedAt`. Its
 * reveals and players were never touched, so it comes back as it was.
 * Restoring an active campaign is a no-op.
 */
export default async function restoreCampaign(
  input: CampaignIdInput
): Promise<MutationResult> {
  await requireDm();

  const parsed = campaignIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { campaignId } = parsed.data;

  try {
    const exists = await prisma.campaign.count({ where: { id: campaignId } });
    if (!exists) {
      return {
        ok: false,
        errors: { campaignId: [fieldError("campaignNotFound")] },
      };
    }
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { archivedAt: null },
    });
  } catch (error) {
    throw toDatabaseError("restoring a campaign", error);
  }

  revalidateDashboard("campaign");
  revalidateDashboard("campaign/[campaignId]");
  return { ok: true };
}
