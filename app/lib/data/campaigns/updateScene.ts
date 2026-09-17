"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import sceneMeta from "@/app/lib/config/campaigns/sceneMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

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
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<Scene> & { id: number };

  try {
    await prisma.scene.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating scene", error);
  }

  revalidateDashboard("campaign");
  return { ok: true };
}
