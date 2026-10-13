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
 * Archives a campaign (SPEC-032 §5.6): sets `archivedAt`, which takes it out of
 * the list, every picker and its players' view. Nothing is deleted or made
 * read-only, and archiving an archived campaign keeps its first timestamp.
 */
export default async function archiveCampaign(
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
    await prisma.campaign.updateMany({
      where: { id: campaignId, archivedAt: null },
      data: { archivedAt: new Date() },
    });
  } catch (error) {
    throw toDatabaseError("archiving a campaign", error);
  }

  revalidateDashboard("campaign");
  revalidateDashboard("campaign/[campaignId]");
  return { ok: true };
}
