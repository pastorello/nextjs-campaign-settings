"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import sceneMeta from "@/app/lib/config/campaigns/sceneMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { dashboardPath } from "@/i18n/dashboardPath";
import { DEFAULT_GAME_SYSTEM } from "@/app/lib/definitions/GameSystem";
import { z } from "zod";

/**
 * Adds a scene to an adventure (SPEC-013 §5). `adventureId` is deliberately
 * not part of `sceneMeta` — the caller supplies it directly from the
 * adventure page the scene is created on, the same split `createAdventure`
 * uses for `campaignId`.
 */
export default async function createScene(
  formData: Scene
): Promise<MutationResult> {
  await requireSession();

  const schema = buildBespokeCreateSchema(sceneMeta).extend({
    adventureId: z.coerce.number().int().positive(),
  });
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const {
    adventureId,
    position,
    kind,
    title,
    description,
    xpAward,
    grantsHeroPoint,
    zoneId,
  } = parsed.data as Omit<Scene, "id">;

  await prisma.scene.create({
    data: {
      adventureId,
      position,
      kind,
      title,
      description,
      xpAward,
      grantsHeroPoint,
      zoneId,
    },
  });

  revalidatePath(dashboardPath(DEFAULT_GAME_SYSTEM, "/campaign"));
  return { ok: true };
}
