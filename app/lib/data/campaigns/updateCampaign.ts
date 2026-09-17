"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import campaignMeta from "@/app/lib/config/campaigns/campaignMeta";
import CampaignMetaField from "@/app/lib/definitions/enums/campaign/CampaignMetaField";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Every field but `system`: a campaign does not switch systems (SPEC-018,
 * decided 2026-09-11). Leaving it out of the schema strips it from the
 * payload, so a submitted `system` is never written.
 */
const updatableCampaignMeta = Object.fromEntries(
  Object.values(campaignMeta)
    .filter((field) => field !== campaignMeta[CampaignMetaField.system])
    .map((field) => [field.metaField, field])
);

/**
 * Updates the DM's campaign — title, synopsis, party size. Outside the
 * metadata layer (ADR-0011), same reasoning as `createCampaign`.
 */
export default async function updateCampaign(
  formData: Omit<Campaign, "system">
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildBespokeUpdateSchema(updatableCampaignMeta).safeParse(
    formData
  );
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<Omit<Campaign, "system">> & {
    id: number;
  };

  try {
    await prisma.campaign.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating campaign", error);
  }

  revalidateDashboard("campaign");
  return { ok: true };
}
