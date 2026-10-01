"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhEnvironment from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironment";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import checkDhEnvironmentLinks from "./checkDhEnvironmentLinks";

/**
 * Creates a Daggerheart environment (SPEC-028 T3) with its potential
 * adversaries and its places, each of which must exist. Its features are
 * added afterwards, inline in the edit dialog (ADR-0011).
 */
export default async function createDhEnvironment(
  formData: DhEnvironment
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildCreateSchema(PageType.DhEnvironment).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload (TD-122); the schema is
  // built from a runtime field list, so this assertion narrows it back.
  const { imageId, environmentAdversaryIds, environmentPlaceIds, ...fields } =
    parsed.data as Omit<
      DhEnvironment,
      "id" | "image" | "adversaries" | "places" | "features"
    >;

  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "dhEnvironment",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };
  const linkErrors = await checkDhEnvironmentLinks(
    environmentAdversaryIds,
    environmentPlaceIds
  );
  if (linkErrors) return { ok: false, errors: linkErrors };

  try {
    await prisma.dhEnvironment.create({
      data: {
        ...(imageId != null && { imageId }),
        ...fields,
        adversaries: {
          create: [...new Set(environmentAdversaryIds ?? [])].map(
            (adversaryId) => ({ adversaryId })
          ),
        },
        places: {
          connect: (environmentPlaceIds ?? []).map((id) => ({ id })),
        },
      },
    });
  } catch (error) {
    throw toDatabaseError("creating environment", error);
  }

  revalidateDashboard("environments");
  return { ok: true };
}
