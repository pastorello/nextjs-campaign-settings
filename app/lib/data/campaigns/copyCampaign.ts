"use server";

import { getTranslations } from "next-intl/server";

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

import writeAdventureCopy, { adventureCopyInclude } from "./writeAdventureCopy";

type CopyCampaignResult =
  Extract<MutationResult, { ok: false }> | { ok: true; id: number };

/**
 * Longer than `copyAdventure`'s 30 s: this writes every adventure of the
 * campaign, and a transaction that times out rolls back whole, so a generous
 * bound costs nothing (SPEC-032 §9, _Risks_).
 */
const COPY_TIMEOUT_MS = 60_000;
const COPY_MAX_WAIT_MS = 10_000;

/**
 * Copies a campaign (SPEC-032 §5.5): a new, active campaign of the same
 * system titled "Copia di …", with the synopsis and party size, and every
 * adventure as `copyAdventure` makes it, in ladder order and renumbered from 1.
 * It carries no members, no reveals and no current day. Each adventure's
 * events travel with it; an event of the campaign that names no adventure is
 * the campaign's own and is not copied, and world history is never touched.
 *
 * The source may be archived. One interactive transaction at `RepeatableRead`:
 * a failure part-way leaves no new campaign.
 */
export default async function copyCampaign(
  input: CampaignIdInput
): Promise<CopyCampaignResult> {
  await requireDm();

  const parsed = campaignIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { campaignId } = parsed.data;

  const t = await getTranslations("campaign.copy");

  let outcome: CopyCampaignResult;
  try {
    outcome = await prisma.$transaction(
      async (tx): Promise<CopyCampaignResult> => {
        const source = await tx.campaign.findUnique({
          where: { id: campaignId },
          include: {
            adventures: {
              orderBy: [{ position: "asc" }, { id: "asc" }],
              include: adventureCopyInclude,
            },
          },
        });
        if (!source) {
          return {
            ok: false,
            errors: { campaignId: [fieldError("campaignNotFound")] },
          };
        }

        const created = await tx.campaign.create({
          data: {
            title: t("titlePrefix", { title: source.title }),
            synopsis: source.synopsis,
            partySize: source.partySize,
            system: source.system,
          },
          select: { id: true },
        });

        let position = 0;
        for (const adventure of source.adventures) {
          position += 1;
          await writeAdventureCopy(tx, adventure, {
            campaignId: created.id,
            position,
            title: adventure.title,
          });
        }

        return { ok: true, id: created.id };
      },
      {
        isolationLevel: "RepeatableRead",
        timeout: COPY_TIMEOUT_MS,
        maxWait: COPY_MAX_WAIT_MS,
      }
    );
  } catch (error) {
    throw toDatabaseError("copying a campaign", error);
  }

  if (outcome.ok) {
    revalidateDashboard("campaign");
    revalidateDashboard("campaign/[campaignId]");
    revalidateDashboard("campaign/[campaignId]/calendar");
  }
  return outcome;
}
