"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import NpcItem from "../../definitions/interfaces/npc/NpcItem";
import NpcMetaField from "../../definitions/enums/npc/NpcMetaField";

export default async function updateNpc(
  formData: NpcItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Npc).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.npc.update({
    where: {
      id: formData.id,
    },
    data: Object.keys(formData)
      .filter((key) => key !== "id")
      .reduce((acc, key) => {
        const typedKey = key as NpcMetaField;
        return { ...acc, [typedKey]: formData[typedKey] };
      }, {} as NpcItem),
  });

  revalidatePath("/npc");
  return { ok: true };
}
