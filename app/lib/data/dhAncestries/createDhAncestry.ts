"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import DhAncestry from "@/app/lib/definitions/interfaces/daggerheart/DhAncestry";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Creates a Daggerheart ancestry (SPEC-027 T2). Both features are required
 * fields, so one alone is refused field by field.
 */
export default async function createDhAncestry(
  formData: DhAncestry
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildCreateSchema(PageType.DhAncestry).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload (TD-122); the schema is
  // built from a runtime field list, so this assertion narrows it back.
  const { imageId, ...fields } = parsed.data as Omit<
    DhAncestry,
    "id" | "image"
  >;

  // SPEC-020 T3 — an uploaded image must exist and belong to no other record.
  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "dhAncestry",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  try {
    await prisma.dhAncestry.create({
      data: { ...(imageId != null && { imageId }), ...fields },
    });
  } catch (error) {
    throw toDatabaseError("creating ancestry", error);
  }

  revalidateDashboard("ancestries");
  return { ok: true };
}
