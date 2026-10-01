"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import adventureMeta from "@/app/lib/config/campaigns/adventureMeta";
import { buildBespokeUpdateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import { z } from "zod";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import otherSystemFieldErrors from "./otherSystemFieldErrors";
import fetchRulesSystem from "./fetchRulesSystem";

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
  await requireDm();

  const schema = buildBespokeUpdateSchema(adventureMeta).extend({
    campaignId: z.coerce.number().int().positive().nullable().optional(),
  });
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // SPEC-030: the campaign's system decides which fields exist.
  const system = await fetchRulesSystem(
    parsed.data.campaignId !== undefined
      ? { campaignId: parsed.data.campaignId as number | null }
      : { adventureId: parsed.data.id as number }
  );
  const systemErrors = otherSystemFieldErrors("adventure", system, parsed.data);
  if (systemErrors) return { ok: false, errors: systemErrors };

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<Adventure> & { id: number };

  try {
    await prisma.adventure.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating adventure", error);
  }

  revalidateDashboard("campaign");
  return { ok: true };
}
