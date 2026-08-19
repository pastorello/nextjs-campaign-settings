"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import CampaignMetaField from "@/app/lib/definitions/enums/campaign/CampaignMetaField";
import campaignMeta from "@/app/lib/config/campaigns/campaignMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";

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

  await prisma.campaign.update({
    where: { id: formData.id },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as CampaignMetaField;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as Partial<Campaign>),
  });

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
