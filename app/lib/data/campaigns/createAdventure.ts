"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import adventureMeta from "@/app/lib/config/campaigns/adventureMeta";
import { buildBespokeCreateSchema } from "../validation/buildBespokeEntitySchema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

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
  } = formData;

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

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
