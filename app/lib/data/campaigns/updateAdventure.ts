"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import AdventureMetaField from "@/app/lib/definitions/enums/campaign/AdventureMetaField";
import adventureMeta from "@/app/lib/config/campaigns/adventureMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type AdventureUpdateField = AdventureMetaField | "campaignId";

/**
 * Updates an adventure's own fields, including its position — the direct,
 * single-row edit half of SPEC-013 §5's "explicit integer position,
 * editable." `reorderAdventures` is the bulk half, for the drag-and-drop
 * ladder. `campaignId` can be repointed the same way (e.g. attaching a
 * standalone adventure to a campaign later); see `createAdventure` for why
 * it is validated outside `adventureMeta`.
 */
export default async function updateAdventure(
  formData: Adventure
): Promise<MutationResult> {
  await requireSession();

  const schema = buildBespokeUpdateSchema(adventureMeta).extend({
    campaignId: z.coerce.number().int().positive().nullable().optional(),
  });
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.adventure.update({
    where: { id: formData.id },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as AdventureUpdateField;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as Partial<Adventure>),
  });

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
