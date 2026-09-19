"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import releaseReplacedRecordImage from "@/app/lib/data/recordImages/releaseReplacedRecordImage";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/** Updates a Daggerheart domain (SPEC-021 T2), its emblem included. */
export default async function updateDhDomain(
  formData: DhDomain
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.DhDomain).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Only the declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<Omit<DhDomain, "image">> & {
    id: number;
  };

  const imageErrors = await checkRecordImageReference(data.imageId, {
    relation: "dhDomain",
    id,
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  // The emblem this save replaces or removes — deleted only once the update
  // has committed, so a failed save keeps the previous one (SPEC-020 §5).
  let previousImageId: number | null | undefined;
  try {
    if (data.imageId !== undefined) {
      previousImageId = (
        await prisma.dhDomain.findUnique({
          where: { id },
          select: { imageId: true },
        })
      )?.imageId;
    }
    await prisma.dhDomain.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating domain", error);
  }

  await releaseReplacedRecordImage(previousImageId, data.imageId);

  revalidateDashboard("domains");
  // A card view draws its domain's colour, emblem and name.
  revalidateDashboard("domain-cards");
  return { ok: true };
}
