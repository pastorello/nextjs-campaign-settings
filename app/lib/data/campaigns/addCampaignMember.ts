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
 * Adds a player to a campaign's group (SPEC-022 T5). A DM is never a member:
 * a group is a campaign's *players*, and a DM sees everything anyway.
 * Adding a member twice is a no-op.
 */
export default async function addCampaignMember(
  input: CampaignMemberInput
): Promise<MutationResult> {
  await requireDm();

  const parsed = campaignMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { campaignId, userId } = parsed.data;

  try {
    const [campaign, account] = await Promise.all([
      prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true },
      }),
      prisma.users.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
    ]);
    if (!campaign) {
      return {
        ok: false,
        errors: { campaignId: [fieldError("campaignNotFound")] },
      };
    }
    if (!account) {
      return { ok: false, errors: { userId: [fieldError("accountNotFound")] } };
    }
    if (account.role !== "player") {
      return { ok: false, errors: { userId: [fieldError("notAPlayer")] } };
    }
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { members: { connect: { id: userId } } },
    });
  } catch (error) {
    throw toDatabaseError("adding a player to a campaign", error);
  }

  revalidateDashboard("campaign");
  return { ok: true };
}
