"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import adventureMeta from "@/app/lib/config/campaigns/adventureMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { dashboardPath } from "@/i18n/dashboardPath";
import { DEFAULT_GAME_SYSTEM } from "@/app/lib/definitions/GameSystem";
import { z } from "zod";

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

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<Adventure> & { id: number };

  await prisma.adventure.update({
    where: { id },
    data,
  });

  revalidatePath(dashboardPath(DEFAULT_GAME_SYSTEM, "/campaign"));
  return { ok: true };
}
