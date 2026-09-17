"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import Faction from "@/app/lib/definitions/interfaces/faction/Faction";
import { revalidatePath } from "next/cache";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function createFaction(
  formData: Faction
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Faction).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const { name, description } = parsed.data as Omit<Faction, "id">;

  try {
    await prisma.faction.create({
      data: {
        name,
        description,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating faction", error);
  }

  revalidatePath("/factions");
  return { ok: true };
}
