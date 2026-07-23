"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import PngItem from "../../definitions/interfaces/png/PngItem";
import PngMetaField from "../../definitions/enums/png/PngMetaField";

export default async function updatePng(
  formData: PngItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Png).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

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
  return { ok: true };
}
