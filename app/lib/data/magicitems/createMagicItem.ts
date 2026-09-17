"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import { revalidatePath } from "next/cache";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function createMagicItem(
  formData: MagicItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.MagicItem).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const { name, description, type, rarity, attuned, consumable } =
    parsed.data as Omit<MagicItem, "id">;

  try {
    await prisma.magicitems.create({
      data: {
        name,
        description,
        type,
        rarity,
        attuned,
        consumable,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating magic item", error);
  }

  revalidatePath("/magicitems");
  return { ok: true };
}
