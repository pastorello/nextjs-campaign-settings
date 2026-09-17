"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import MagicItem from "../../definitions/interfaces/magicitem/MagicItem";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function updateMagicItem(
  formData: MagicItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.MagicItem).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<MagicItem> & { id: number };

  try {
    await prisma.magicitems.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating magic item", error);
  }

  revalidatePath("/magicitems");
  return { ok: true };
}
