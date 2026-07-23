"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import MagicItem from "../../definitions/interfaces/magicitem/MagicItem";
import MagicItemMetaField from "../../definitions/enums/magicitem/MagicItemMetaField";

export default async function updateMagicItem(
  formData: MagicItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.MagicItem).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.magicitems.update({
    where: {
      id: formData.id,
    },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as MagicItemMetaField;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as MagicItem),
  });

  revalidatePath("/magicitems");
  return { ok: true };
}
