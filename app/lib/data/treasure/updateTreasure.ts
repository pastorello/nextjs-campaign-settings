"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import Treasure from "../../definitions/interfaces/treasure/Treasure";

export default async function updateTreasure(
  formData: Treasure
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Treasure).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<Treasure> & { id: number };

  await prisma.treasure.update({
    where: { id },
    data,
  });

  revalidatePath("/treasures");
  return { ok: true };
}
