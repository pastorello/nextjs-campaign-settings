"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";

import Deity from "../../definitions/interfaces/deities/Deity";
import DeityMetaField from "../../definitions/enums/deities/DeityMetaField";

export default async function updateDeity(
  formData: Deity
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Deity).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.deities.update({
    where: {
      id: formData.id,
    },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as DeityMetaField;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as Deity),
  });

  revalidatePath("/deities");
  return { ok: true };
}
