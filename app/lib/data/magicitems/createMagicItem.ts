"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import { revalidatePath } from "next/cache";

export default async function createMagicItem(
  formData: MagicItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.MagicItem).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, description, type, rarity, attuned } = formData;

  await prisma.magicitems.create({
    data: {
      name,
      description,
      type,
      rarity,
      attuned,
    },
  });

  revalidatePath("/magicitems");
  return { ok: true };
}
