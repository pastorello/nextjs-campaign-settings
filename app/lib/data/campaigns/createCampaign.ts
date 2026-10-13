"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import campaignMeta from "@/app/lib/config/campaigns/campaignMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/** A refusal, or the created campaign's id (SPEC-032 §5.3 navigates to it). */
type CreateCampaignResult =
  Extract<MutationResult, { ok: false }> | { ok: true; id: number };

/**
 * Creates a campaign (SPEC-013 §5's empty-state flow, and SPEC-032 §5.3's
 * "create another"). Outside the metadata layer (ADR-0011) — validated
 * against `campaignMeta`'s own declarations rather than
 * `buildCreateSchema`/`PageType`, which `campaign` never registers for.
 *
 * Any number of campaigns may exist, in any system; the title is not a key
 * (SPEC-032 §8). Returns the new id so the form can open the campaign.
 */
export default async function createCampaign(
  formData: Campaign
): Promise<CreateCampaignResult> {
  await requireDm();

  const parsed = buildBespokeCreateSchema(campaignMeta).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload (TD-122).
  const { title, synopsis, partySize, system } = parsed.data as Omit<
    Campaign,
    "id"
  >;

  let id: number;
  try {
    ({ id } = await prisma.campaign.create({
      data: { title, synopsis, partySize, system },
      select: { id: true },
    }));
  } catch (error) {
    throw toDatabaseError("creating campaign", error);
  }

  revalidateDashboard("campaign");
  return { ok: true, id };
}
