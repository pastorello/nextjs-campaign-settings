"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhAdversary from "@/app/lib/definitions/interfaces/daggerheart/DhAdversary";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import adversaryShapeErrors from "./adversaryShapeErrors";

/**
 * Creates a Daggerheart adversary (SPEC-028 T2). Its experiences and
 * features are added afterwards, inline in the edit dialog (ADR-0011).
 */
export default async function createDhAdversary(
  formData: DhAdversary
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildCreateSchema(PageType.DhAdversary).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload (TD-122); the schema is
  // built from a runtime field list, so this assertion narrows it back.
  const { imageId, ...fields } = parsed.data as Omit<
    DhAdversary,
    "id" | "image" | "experiences" | "features"
  >;

  const shapeErrors = adversaryShapeErrors(fields);
  if (shapeErrors) return { ok: false, errors: shapeErrors };
  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "dhAdversary",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  try {
    await prisma.dhAdversary.create({
      data: { ...(imageId != null && { imageId }), ...fields },
    });
  } catch (error) {
    throw toDatabaseError("creating adversary", error);
  }

  revalidateDashboard("adversaries");
  return { ok: true };
}
