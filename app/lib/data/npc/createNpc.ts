"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import NpcItem from "../../definitions/interfaces/npc/NpcItem";

export default async function createNpc(
  formData: NpcItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Npc).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const {
    name,
    description,
    title,
    alignment,
    alignmentDomain,
    position,
    location,
    faction,
    appearance,
    personality,
    motivations,
    secrets,
  } = formData;

  await prisma.npc.create({
    data: {
      name,
      description,
      title,
      alignment,
      alignmentDomain,
      position,
      location,
      faction,
      appearance,
      personality,
      motivations,
      secrets,
    },
  });

  revalidatePath("/npc");
  return { ok: true };
}
