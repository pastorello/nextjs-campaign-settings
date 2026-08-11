"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import Faction from "@/app/lib/definitions/interfaces/faction/Faction";
import { revalidatePath } from "next/cache";

export default async function createFaction(
  formData: Faction
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Faction).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, description } = formData;

  await prisma.faction.create({
    data: {
      name,
      description,
    },
  });

  revalidatePath("/factions");
  return { ok: true };
}
