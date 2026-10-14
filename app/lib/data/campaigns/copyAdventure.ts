"use server";

import { getTranslations } from "next-intl/server";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import {
  copyAdventureSchema,
  type CopyAdventureInput,
} from "@/app/lib/data/validation/copyAdventureSchema";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

import { activeCampaigns } from "./activeCampaigns";
import buildAdventureCopy from "./buildAdventureCopy";

type CopyAdventureResult =
  Extract<MutationResult, { ok: false }> | { ok: true; id: number };

/**
 * The most the copy may take. The default 5 s is for a handful of rows; an
 * adventure of a dozen scenes is a few hundred, and a transaction that times
 * out rolls back whole, so a generous bound costs nothing (SPEC-032 §9).
 */
const COPY_TIMEOUT_MS = 30_000;
const COPY_MAX_WAIT_MS = 10_000;

/**
 * Copies an adventure into a campaign of its rules system, or standalone
 * (SPEC-032 §5.4): scenes, creatures and loot with every link kept, progress
 * reset, and the adventure's own calendar events travelling with it. The
 * original is only read. The copy goes at the end of the destination's ladder.
 *
 * The destination is checked here, not only left out of the picker: it must
 * exist, not be archived, and play the adventure's system; a standalone
 * adventure is 5e (`fetchRulesSystem`), so only a 5e adventure may go there.
 *
 * One interactive transaction at `RepeatableRead`: the snapshot read, the
 * copy and the events (which need the new scene ids) are all or nothing.
 */
export default async function copyAdventure(
  input: CopyAdventureInput
): Promise<CopyAdventureResult> {
  await requireDm();

  const parsed = copyAdventureSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { adventureId, destinationCampaignId } = parsed.data;

  const t = await getTranslations("campaign.copy");

  let outcome: CopyAdventureResult;
  try {
    outcome = await prisma.$transaction(
      async (tx): Promise<CopyAdventureResult> => {
        const source = await tx.adventure.findUnique({
          where: { id: adventureId },
          include: {
            scenes: { include: { creatures: true, loot: true } },
            calendarEvents: true,
          },
        });
        if (!source) {
          return {
            ok: false,
            errors: { adventureId: [fieldError("adventureNotFound")] },
          };
        }

        const sourceCampaign =
          source.campaignId === null
            ? null
            : await tx.campaign.findUnique({
                where: { id: source.campaignId },
                select: { system: true },
              });
        const sourceSystem = sourceCampaign?.system ?? "dnd5e";

        let destinationSystem = "dnd5e";
        if (destinationCampaignId !== null) {
          const destination = await tx.campaign.findFirst({
            where: { id: destinationCampaignId, ...activeCampaigns },
            select: { system: true },
          });
          if (!destination) {
            return {
              ok: false,
              errors: {
                destinationCampaignId: [fieldError("campaignNotFound")],
              },
            };
          }
          destinationSystem = destination.system;
        }
        if (destinationSystem !== sourceSystem) {
          return {
            ok: false,
            errors: {
              destinationCampaignId: [fieldError("copyWrongSystem")],
            },
          };
        }

        const last = await tx.adventure.aggregate({
          where: { campaignId: destinationCampaignId },
          _max: { position: true },
        });
        const sameCampaign = destinationCampaignId === source.campaignId;

        const copy = buildAdventureCopy(source, {
          campaignId: destinationCampaignId,
          position: (last._max.position ?? 0) + 1,
          title: sameCampaign
            ? t("titlePrefix", { title: source.title })
            : source.title,
        });

        const created = await tx.adventure.create({
          data: {
            ...copy.adventure,
            scenes: {
              create: copy.scenes.map(({ scene, creatures, loot }) => ({
                ...scene,
                creatures: { create: creatures },
                loot: { create: loot },
              })),
            },
          },
          select: {
            id: true,
            // Ids follow the order the nested creates ran in.
            scenes: { select: { id: true }, orderBy: { id: "asc" } },
          },
        });

        if (copy.events.length > 0) {
          await tx.calendarEvent.createMany({
            data: copy.events.map(({ event, sceneIndex }) => ({
              ...event,
              campaignId: destinationCampaignId,
              adventureId: created.id,
              sceneId:
                sceneIndex === null
                  ? null
                  : (created.scenes[sceneIndex]?.id ?? null),
            })),
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
    throw toDatabaseError("copying an adventure", error);
  }

  if (outcome.ok) {
    revalidateDashboard("campaign");
    revalidateDashboard("campaign/[campaignId]");
    revalidateDashboard("campaign/[campaignId]/calendar");
  }
  return outcome;
}
