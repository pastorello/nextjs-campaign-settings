"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import Treasure from "@/app/lib/definitions/interfaces/treasure/Treasure";
import { revalidatePath } from "next/cache";

export default async function createTreasure(
  formData: Treasure
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Treasure).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, description, category, value } = formData;

  await prisma.treasure.create({
    data: {
      name,
      description,
      category,
      value,
    },
  });

  revalidatePath("/treasures");
  return { ok: true };
}
