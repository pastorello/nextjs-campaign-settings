"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import NpcItem from "../../definitions/interfaces/npc/NpcItem";
import NpcMetaField from "../../definitions/enums/npc/NpcMetaField";
import isForeignKeyViolation from "@/app/lib/errors/isForeignKeyViolation";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function updateNpc(
  formData: NpcItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Npc).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
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
  } catch (error) {
    // See createNpc — the same stale-faction-id case, reached on an edit
    // rather than a create.
    if (isForeignKeyViolation(error)) {
      return {
        ok: false,
        errors: { faction: ["That faction no longer exists."] },
      };
    }
    throw toDatabaseError("updating npc", error);
  }

  revalidatePath("/npc");
  return { ok: true };
}
