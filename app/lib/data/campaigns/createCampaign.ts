"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import campaignMeta from "@/app/lib/config/campaigns/campaignMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";

/**
 * Creates the DM's campaign (SPEC-013 §5's empty-state flow: "on first use
 * there is no campaign; a form creates one"). Outside the metadata layer
 * (ADR-0011) — validated against `campaignMeta`'s own declarations rather
 * than `buildCreateSchema`/`PageType`, which `campaign` never registers for.
 *
 * Nothing stops a second row at the database level (`fetchCampaign`'s own
 * comment notes this), but the product only ever reads the first — a second
 * campaign is multi-campaign support, a different piece of work.
 */
export default async function createCampaign(
  formData: Campaign
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildBespokeCreateSchema(campaignMeta).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.campaign.create({
    data: {
      title: formData.title,
      synopsis: formData.synopsis,
      partySize: formData.partySize,
    },
  });

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
