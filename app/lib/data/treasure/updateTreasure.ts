"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import Treasure from "../../definitions/interfaces/treasure/Treasure";
import TreasureMetaField from "../../definitions/enums/treasure/TreasureMetaField";

export default async function updateTreasure(
  formData: Treasure
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Treasure).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.treasure.update({
    where: {
      id: formData.id,
    },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as TreasureMetaField;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as Treasure),
  });

  revalidatePath("/treasures");
  return { ok: true };
}
