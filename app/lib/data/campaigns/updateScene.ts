"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import sceneMeta from "@/app/lib/config/campaigns/sceneMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import otherSystemFieldErrors from "./otherSystemFieldErrors";
import fetchRulesSystem from "./fetchRulesSystem";

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
  await requireDm();

  const parsed = buildBespokeUpdateSchema(sceneMeta).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // SPEC-030: the campaign's system decides which fields exist.
  const system = await fetchRulesSystem({ sceneId: parsed.data.id as number });
  const systemErrors = otherSystemFieldErrors("scene", system, parsed.data);
  if (systemErrors) return { ok: false, errors: systemErrors };

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
