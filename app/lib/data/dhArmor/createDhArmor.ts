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
import DhArmor from "@/app/lib/definitions/interfaces/daggerheart/DhArmor";
import DhArmorMetaField from "@/app/lib/definitions/enums/daggerheart/DhArmorMetaField";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import armorThresholdErrors from "./armorThresholdErrors";

/** Creates a Daggerheart armor (SPEC-029 T3). */
export default async function createDhArmor(
  formData: DhArmor
): Promise<MutationResult> {
  await requireDm();

  const parsed = buildCreateSchema(PageType.DhArmor).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload (TD-122); the schema is
  // built from a runtime field list, so this assertion narrows it back.
  const { imageId, ...fields } = parsed.data as Omit<DhArmor, "id" | "image">;
  const armorFeatureName = blankToNull(fields.armorFeatureName) ?? null;
  const armorFeatureText = blankToNull(fields.armorFeatureText) ?? null;

  const featureErrors = featurePairErrors(armorFeatureName, armorFeatureText, {
    name: DhArmorMetaField.featureName,
    text: DhArmorMetaField.featureText,
  });
  if (featureErrors) return { ok: false, errors: featureErrors };
  const thresholdErrors = armorThresholdErrors(
    fields.armorMajor,
    fields.armorSevere
  );
  if (thresholdErrors) return { ok: false, errors: thresholdErrors };
  const imageErrors = await checkRecordImageReference(imageId, {
    relation: "dhArmor",
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  try {
    await prisma.dhArmor.create({
      data: {
        ...(imageId != null && { imageId }),
        ...fields,
        armorFeatureName,
        armorFeatureText,
      },
    });
  } catch (error) {
    throw toDatabaseError("creating armor", error);
  }

  revalidateDashboard("armor");
  return { ok: true };
}
