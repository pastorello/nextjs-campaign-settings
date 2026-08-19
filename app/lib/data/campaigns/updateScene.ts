"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import SceneMetaField from "@/app/lib/definitions/enums/campaign/SceneMetaField";
import sceneMeta from "@/app/lib/config/campaigns/sceneMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";

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

  await prisma.scene.update({
    where: { id: formData.id },
    data: Object.values(SceneMetaField).reduce(
      (acc, key) => ({ ...acc, [key]: formData[key] }),
      {} as Partial<Scene>
    ),
  });

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
