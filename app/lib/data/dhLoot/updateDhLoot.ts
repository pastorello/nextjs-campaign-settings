"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import releaseReplacedRecordImage from "@/app/lib/data/recordImages/releaseReplacedRecordImage";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import DhLoot from "@/app/lib/definitions/interfaces/daggerheart/DhLoot";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/** Updates a piece of Daggerheart loot (SPEC-029 T4), its image included. */
export default async function updateDhLoot(
  formData: DhLoot
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildUpdateSchema(PageType.DhLoot).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Only the declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<Omit<DhLoot, "image">> & {
    id: number;
  };

  const imageErrors = await checkRecordImageReference(data.imageId, {
    relation: "dhLoot",
    id,
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  // The image this save replaces or removes — deleted only once the update
  // has committed, so a failed save keeps the previous one (SPEC-020 §5).
  let previousImageId: number | null | undefined;
  try {
    if (data.imageId !== undefined) {
      previousImageId = (
        await prisma.dhLoot.findUnique({
          where: { id },
          select: { imageId: true },
        })
      )?.imageId;
    }
    await prisma.dhLoot.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating loot", error);
  }

  await releaseReplacedRecordImage(previousImageId, data.imageId);

  revalidateDashboard("loot");
  return { ok: true };
}
