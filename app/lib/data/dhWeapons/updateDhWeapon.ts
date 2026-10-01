"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import releaseReplacedRecordImage from "@/app/lib/data/recordImages/releaseReplacedRecordImage";
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
import NotFoundError from "@/app/lib/errors/NotFoundError";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Updates a Daggerheart weapon (SPEC-029 T2). The feature pair is judged
 * on the row as it would be stored: the payload over the stored row.
 */
export default async function updateDhWeapon(
  formData: DhWeapon
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildUpdateSchema(PageType.DhWeapon).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Only the declared keys the payload carried, already coerced (TD-122).
  const { id, ...payload } = parsed.data as Partial<Omit<DhWeapon, "image">> & {
    id: number;
  };
  const data = {
    ...payload,
    ...(payload.weaponFeatureName !== undefined && {
      weaponFeatureName: blankToNull(payload.weaponFeatureName) ?? null,
    }),
    ...(payload.weaponFeatureText !== undefined && {
      weaponFeatureText: blankToNull(payload.weaponFeatureText) ?? null,
    }),
  };

  let stored;
  try {
    stored = await prisma.dhWeapon.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up weapon for update", error);
  }
  if (!stored) throw new NotFoundError("Weapon", id);

  const after = { ...stored, ...data };
  const featureErrors = featurePairErrors(
    after.weaponFeatureName ?? null,
    after.weaponFeatureText ?? null,
    {
      name: DhWeaponMetaField.featureName,
      text: DhWeaponMetaField.featureText,
    }
  );
  if (featureErrors) return { ok: false, errors: featureErrors };
  const imageErrors = await checkRecordImageReference(data.imageId, {
    relation: "dhWeapon",
    id,
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  try {
    await prisma.dhWeapon.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating weapon", error);
  }

  // The image this save replaced or removed goes once the update has
  // committed, so a failed save keeps it (SPEC-020 §5).
  await releaseReplacedRecordImage(stored.imageId, data.imageId);

  revalidateDashboard("weapons");
  return { ok: true };
}
