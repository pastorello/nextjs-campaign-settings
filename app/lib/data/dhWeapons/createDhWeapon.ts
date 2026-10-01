"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import featurePairErrors, {
  blankToNull,
} from "@/app/lib/data/validation/featurePairErrors";
import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhWeapon from "@/app/lib/definitions/interfaces/daggerheart/DhWeapon";
import DhWeaponMetaField from "@/app/lib/definitions/enums/daggerheart/DhWeaponMetaField";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/** Creates a Daggerheart weapon (SPEC-029 T2). */
export default async function createDhWeapon(
  formData: DhWeapon
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildCreateSchema(PageType.DhWeapon).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload (TD-122); the schema is
  // built from a runtime field list, so this assertion narrows it back.
  const { imageId, ...fields } = parsed.data as Omit<DhWeapon, "id" | "image">;
  const weaponFeatureName = blankToNull(fields.weaponFeatureName) ?? null;
  const weaponFeatureText = blankToNull(fields.weaponFeatureText) ?? null;

  const featureErrors = featurePairErrors(
    weaponFeatureName,
    weaponFeatureText,
    {
      name: DhWeaponMetaField.featureName,
      text: DhWeaponMetaField.featureText,
    }
  );
  if (featureErrors) return { ok: false, errors: featureErrors };
  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "dhWeapon",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  try {
    await prisma.dhWeapon.create({
      data: {
        ...(imageId != null && { imageId }),
        ...fields,
        weaponFeatureName,
        weaponFeatureText,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating weapon", error);
  }

  revalidateDashboard("weapons");
  return { ok: true };
}
