"use server";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import {
  campaignMemberSchema,
  type CampaignMemberInput,
} from "@/app/lib/data/validation/campaignMemberSchema";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

/**
 * Takes a player out of a campaign's group (SPEC-022 T5). Their next request
 * sees nothing of the campaign (§5). Removing someone who is not a member is
 * a no-op.
 */
export default async function removeCampaignMember(
  input: CampaignMemberInput
): Promise<MutationResult> {
  await requireDm();

  const parsed = campaignMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { campaignId, userId } = parsed.data;

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
      data: { members: { disconnect: { id: userId } } },
    });
  } catch (error) {
    throw toDatabaseError("removing a player from a campaign", error);
  }

  revalidateDashboard("campaign");
  return { ok: true };
}
