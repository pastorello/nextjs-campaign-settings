"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import releaseReplacedRecordImage from "@/app/lib/data/recordImages/releaseReplacedRecordImage";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhAdversary from "@/app/lib/definitions/interfaces/daggerheart/DhAdversary";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import adversaryShapeErrors from "./adversaryShapeErrors";

/**
 * Updates a Daggerheart adversary (SPEC-028 T2). The cross-field rules are
 * judged on the row as it would be stored: the payload's fields over the
 * stored ones, so changing only the type still checks the density.
 */
export default async function updateDhAdversary(
  formData: DhAdversary
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildUpdateSchema(PageType.DhAdversary).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Only the declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<
    Omit<DhAdversary, "image" | "experiences" | "features">
  > & { id: number };

  let stored;
  try {
    stored = await prisma.dhAdversary.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up adversary for update", error);
  }
  if (!stored) throw new NotFoundError("Adversary", id);

  const shapeErrors = adversaryShapeErrors({ ...stored, ...data });
  if (shapeErrors) return { ok: false, errors: shapeErrors };
  const imageErrors = await checkRecordImageReference(data.imageId, {
    relation: "dhAdversary",
    id,
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  try {
    await prisma.dhAdversary.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating adversary", error);
  }

  // The image this save replaced or removed goes once the update has
  // committed, so a failed save keeps it (SPEC-020 §5).
  await releaseReplacedRecordImage(stored.imageId, data.imageId);

  revalidateDashboard("adversaries");
  return { ok: true };
}
