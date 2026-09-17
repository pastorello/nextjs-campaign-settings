"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import Faction from "../../definitions/interfaces/faction/Faction";

export default async function updateFaction(
  formData: Faction
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Faction).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<Faction> & { id: number };

  await prisma.faction.update({
    where: { id },
    data,
  });

  revalidatePath("/factions");
  return { ok: true };
}
