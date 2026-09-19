"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import fieldError from "@/app/lib/data/validation/fieldError";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import DhFeatureMetaField from "@/app/lib/definitions/enums/daggerheart/DhFeatureMetaField";
import dhClassFeatureMeta from "@/app/lib/config/daggerheart/dhClassFeatureMeta";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import type FirstDhClassFeature from "@/app/lib/definitions/interfaces/daggerheart/FirstDhClassFeature";

import distinctDomainsError from "./distinctDomainsError";

/**
 * Creates a class with its first feature, in one write (SPEC-021 §5: at
 * least one feature — see `FirstDhClassFeature`).
 */
export default async function createDhClass(
  formData: DhClass & FirstDhClassFeature
): Promise<MutationResult> {
  await requireSession();

  if (formData.firstFeatureName == null && formData.firstFeatureText == null) {
    return {
      ok: false,
      errors: { firstFeatureName: [fieldError("classNeedsFeature")] },
    };
  }

  const parsed = buildCreateSchema(PageType.DhClass)
    .extend({
      firstFeatureName: dhClassFeatureMeta[DhFeatureMetaField.name].validator,
      firstFeatureText: dhClassFeatureMeta[DhFeatureMetaField.text].validator,
    })
    .safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const {
    name,
    description,
    domainAId,
    domainBId,
    startingEvasion,
    startingHp,
    classItems,
    hopeFeatureName,
    hopeFeatureText,
    origin,
    firstFeatureName,
    firstFeatureText,
  } = parsed.data as Omit<DhClass, "id" | "domainAId" | "domainBId"> & {
    domainAId: number;
    domainBId: number;
    firstFeatureName: string;
    firstFeatureText: string;
  };

  const domainErrors = distinctDomainsError(domainAId, domainBId);
  if (domainErrors) return { ok: false, errors: domainErrors };

  try {
    await prisma.dhClass.create({
      data: {
        name,
        description,
        domainAId,
        domainBId,
        startingEvasion,
        startingHp,
        classItems,
        hopeFeatureName,
        hopeFeatureText,
        origin,
        features: {
          create: [
            { position: 1, name: firstFeatureName, text: firstFeatureText },
          ],
        },
      },
    });
  } catch (error) {
    throw toDatabaseError("creating class", error);
  }

  revalidateDashboard("admin/classes");
  return { ok: true };
}
