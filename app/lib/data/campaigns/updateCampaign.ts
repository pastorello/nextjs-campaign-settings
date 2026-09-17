"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import campaignMeta from "@/app/lib/config/campaigns/campaignMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { dashboardPath } from "@/i18n/dashboardPath";
import { DEFAULT_GAME_SYSTEM } from "@/app/lib/definitions/GameSystem";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Updates the DM's campaign — title, synopsis, party size. Outside the
 * metadata layer (ADR-0011), same reasoning as `createCampaign`.
 */
export default async function updateCampaign(
  formData: Campaign
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildBespokeUpdateSchema(campaignMeta).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<Campaign> & { id: number };

  try {
    await prisma.campaign.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating campaign", error);
  }

  revalidatePath(dashboardPath(DEFAULT_GAME_SYSTEM, "/campaign"));
  return { ok: true };
}
