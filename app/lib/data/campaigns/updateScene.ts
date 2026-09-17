"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import sceneMeta from "@/app/lib/config/campaigns/sceneMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { dashboardPath } from "@/i18n/dashboardPath";
import { DEFAULT_GAME_SYSTEM } from "@/app/lib/definitions/GameSystem";

/**
 * Updates a scene's own fields, including its position — the direct,
 * single-row edit half of "explicit integer position, editable"
 * (`reorderScenes` is the bulk half). Written from `sceneMeta`'s own field
 * list, not "every key but `id`" — `Scene` also carries `adventureId`,
 * `awarded`, `createdAt`/`updatedAt`, none of which this form edits.
 */
export default async function updateScene(
  formData: Scene
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildBespokeUpdateSchema(sceneMeta).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<Scene> & { id: number };

  await prisma.scene.update({
    where: { id },
    data,
  });

  revalidatePath(dashboardPath(DEFAULT_GAME_SYSTEM, "/campaign"));
  return { ok: true };
}
