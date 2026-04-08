"use server";

import prisma from "@/app/lib/connections/prisma";
import { revalidatePath } from "next/cache";
import MagicItem from "../../definitions/interfaces/magicitem/MagicItem";
import MagicItemMetaField from "../../definitions/enums/magicitem/MagicItemMetaField";

export default async function updateMagicItem(formData: MagicItem) {
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
}
