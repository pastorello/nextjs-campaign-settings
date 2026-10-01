"use server";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import {
  setPlaceRevealSchema,
  type SetPlaceRevealInput,
} from "@/app/lib/data/validation/placeRevealSchema";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

/**
 * Reveals one place to one campaign, or hides it again (SPEC-022 T6b), from
 * the map's reveal dialog. Each checkbox is its own write: there is no form
 * to save, and each change shows at once in the dialog's hints.
 */
export default async function setPlaceReveal(
  input: SetPlaceRevealInput
): Promise<MutationResult> {
  await requireDm();

  const parsed = setPlaceRevealSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { kind, id, campaignId, revealed } = parsed.data;
  const revealedTo = revealed
    ? { connect: { id: campaignId } }
    : { disconnect: { id: campaignId } };

  try {
    const [placeExists, campaignExists] = await Promise.all([
      kind === "zone"
        ? prisma.zone.count({ where: { id } })
        : prisma.poi.count({ where: { id } }),
      prisma.campaign.count({ where: { id: campaignId } }),
    ]);
    if (!placeExists) {
      return {
        ok: false,
        errors: {
          id: [
            fieldError(kind === "zone" ? "placeNotFound" : "landmarkNotFound"),
          ],
        },
      };
    }
    if (!campaignExists) {
      return {
        ok: false,
        errors: { campaignId: [fieldError("campaignNotFound")] },
      };
    }
    if (kind === "zone") {
      await prisma.zone.update({ where: { id }, data: { revealedTo } });
    } else {
      await prisma.poi.update({ where: { id }, data: { revealedTo } });
    }
  } catch (error) {
    throw toDatabaseError("changing a place's reveal", error);
  }

  revalidateDashboard("geography");
  return { ok: true };
}
