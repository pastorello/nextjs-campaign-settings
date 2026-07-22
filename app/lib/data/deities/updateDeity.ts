"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";

import Patrono from "../../definitions/interfaces/deities/Patrono";
import PatronoMetaField from "../../definitions/enums/deities/PatronoMetaField";

export default async function updateDeity(formData: Patrono) {
  await requireSession();

  await prisma.deities.update({
    where: {
      id: formData.id,
    },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as PatronoMetaField;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as Patrono),
  });

  revalidatePath("/deities");
}
