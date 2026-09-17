"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import Treasure from "@/app/lib/definitions/interfaces/treasure/Treasure";
import { revalidatePath } from "next/cache";

export default async function createTreasure(
  formData: Treasure
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Treasure).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const { name, description, category, value } = parsed.data as Omit<
    Treasure,
    "id"
  >;

  await prisma.treasure.create({
    data: {
      name,
      description,
      category,
      value,
    },
  });

  revalidatePath("/treasures");
  return { ok: true };
}
