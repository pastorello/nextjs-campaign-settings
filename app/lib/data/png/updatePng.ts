"use server";

import prisma from "@/app/lib/connections/prisma";
import { revalidatePath } from "next/cache";
import PngItem from "../../definitions/interfaces/png/PngItem";
import PngMetaField from "../../definitions/enums/png/PngMetaField";

export default async function updatePng(formData: PngItem) {
  await prisma.png.update({
    where: {
      id: formData.id,
    },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as PngMetaField;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as PngItem),
  });

  revalidatePath("/png");
}
