"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/** Creates a Daggerheart domain (SPEC-021 T2). */
export default async function createDhDomain(
  formData: DhDomain
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.DhDomain).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload (TD-122); the schema is
  // built from a runtime field list, so this assertion narrows it back.
  const { name, description, colour, origin, imageId } = parsed.data as Omit<
    DhDomain,
    "id" | "image"
  >;

  // SPEC-020 T3 — an uploaded emblem must exist and belong to no other record.
  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "dhDomain",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  try {
    await prisma.dhDomain.create({
      data: {
        ...(imageId != null && { imageId }),
        name,
        description,
        colour,
        origin,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating domain", error);
  }

  revalidateDashboard("domains");
  return { ok: true };
}
