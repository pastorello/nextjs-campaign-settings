"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";
import SceneCreatureMetaField from "@/app/lib/definitions/enums/campaign/SceneCreatureMetaField";
import sceneCreatureMeta from "@/app/lib/config/campaigns/sceneCreatureMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";

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

  await prisma.sceneCreature.update({
    where: { id: formData.id },
    data: Object.values(SceneCreatureMetaField).reduce(
      (acc, key) => ({ ...acc, [key]: formData[key] }),
      {} as Partial<SceneCreature>
    ),
  });

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
