"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";
import sceneCreatureMeta from "@/app/lib/config/campaigns/sceneCreatureMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { dashboardPath } from "@/i18n/dashboardPath";
import { DEFAULT_GAME_SYSTEM } from "@/app/lib/definitions/GameSystem";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Updates a creature row's own fields, including its position. Written
 * from `sceneCreatureMeta`'s own field list, not "every key but `id`" —
 * `SceneCreature` also carries `sceneId` and `awarded`, neither of which
 * this form edits (same reasoning as `updateScene`).
 */
export default async function updateSceneCreature(
  formData: SceneCreature
): Promise<MutationResult> {
  await requireSession();

  const parsed =
    buildBespokeUpdateSchema(sceneCreatureMeta).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<SceneCreature> & {
    id: number;
  };

  try {
    await prisma.sceneCreature.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating scene creature", error);
  }

  revalidatePath(dashboardPath(DEFAULT_GAME_SYSTEM, "/campaign"));
  return { ok: true };
}
