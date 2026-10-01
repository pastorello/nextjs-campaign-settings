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
import DhArmor from "@/app/lib/definitions/interfaces/daggerheart/DhArmor";
import DhArmorMetaField from "@/app/lib/definitions/enums/daggerheart/DhArmorMetaField";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import armorThresholdErrors from "./armorThresholdErrors";

/**
 * Updates a Daggerheart armor (SPEC-029 T3). The feature pair and the
 * thresholds are judged on the row as it would be stored: the payload over
 * the stored row.
 */
export default async function updateDhArmor(
  formData: DhArmor
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildUpdateSchema(PageType.DhArmor).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Only the declared keys the payload carried, already coerced (TD-122).
  const { id, ...payload } = parsed.data as Partial<Omit<DhArmor, "image">> & {
    id: number;
  };
  const data = {
    ...payload,
    ...(payload.armorFeatureName !== undefined && {
      armorFeatureName: blankToNull(payload.armorFeatureName) ?? null,
    }),
    ...(payload.armorFeatureText !== undefined && {
      armorFeatureText: blankToNull(payload.armorFeatureText) ?? null,
    }),
  };

  let stored;
  try {
    stored = await prisma.dhArmor.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up armor for update", error);
  }
  if (!stored) throw new NotFoundError("Armor", id);

  const after = { ...stored, ...data };
  const featureErrors = featurePairErrors(
    after.armorFeatureName ?? null,
    after.armorFeatureText ?? null,
    {
      name: DhArmorMetaField.featureName,
      text: DhArmorMetaField.featureText,
    }
  );
  if (featureErrors) return { ok: false, errors: featureErrors };
  const thresholdErrors = armorThresholdErrors(
    after.armorMajor,
    after.armorSevere
  );
  if (thresholdErrors) return { ok: false, errors: thresholdErrors };
  const imageErrors = await checkRecordImageReference(data.imageId, {
    relation: "dhArmor",
    id,
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  try {
    await prisma.dhArmor.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating armor", error);
  }

  // The image this save replaced or removed goes once the update has
  // committed, so a failed save keeps it (SPEC-020 §5).
  await releaseReplacedRecordImage(stored.imageId, data.imageId);

  revalidateDashboard("armor");
  return { ok: true };
}
