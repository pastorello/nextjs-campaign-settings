"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import adventureMeta from "@/app/lib/config/campaigns/adventureMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import { z } from "zod";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Creates an adventure on the campaign's ladder, or standalone when
 * `campaignId` is null (SPEC-013 §6, §9 "the DM intends to author standalone
 * adventures"). `campaignId` is deliberately not part of `adventureMeta`
 * (see its own comment) — the caller supplies it directly, so it is
 * validated here rather than through the meta-driven schema, the same split
 * `assignNpcLocation` uses for a field `NpcMeta` doesn't declare.
 */
export default async function createAdventure(
  formData: Adventure
): Promise<MutationResult> {
  await requireSession();

  const schema = buildBespokeCreateSchema(adventureMeta).extend({
    campaignId: z.coerce.number().int().positive().nullable(),
  });
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const {
    campaignId,
    position,
    targetLevel,
    title,
    synopsis,
    timeline,
    status,
    xpTarget,
    currencyTarget,
    currencyUnit,
    permanentItemTarget,
    consumableTarget,
  } = parsed.data as Omit<Adventure, "id">;

  try {
    await prisma.adventure.create({
      data: {
        campaignId,
        position,
        targetLevel,
        title,
        synopsis,
        timeline,
        status,
        xpTarget,
        currencyTarget,
        currencyUnit,
        permanentItemTarget,
        consumableTarget,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating adventure", error);
  }

  revalidateDashboard("campaign");
  return { ok: true };
}
