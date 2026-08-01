"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { buildPoiCreateSchema } from "../validation/poiSchema";
import type {
  PoiCreateInput,
  PoiCreateResult,
} from "../../definitions/interfaces/maps/Poi";

/**
 * Creates a POI (TD-14 / SPEC-002). Outside the metadata layer by design —
 * see SPEC-002 §7 — so it validates against `poiSchema.ts` directly rather
 * than `buildEntitySchema`. Returns the new row's id, unlike the other
 * domains' `create*` actions — see `PoiCreateResult`.
 */
export default async function createPoi(
  formData: PoiCreateInput
): Promise<PoiCreateResult> {
  await requireSession();

  const parsed = buildPoiCreateSchema().safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { title, lat, lng, category, description, linkedType, linkedId } =
    parsed.data;

  let created;
  try {
    // Spread-if-defined, not `data: parsed.data`: under
    // `exactOptionalPropertyTypes`, Zod's inferred `description?: string |
    // undefined` does not structurally match Prisma's `description?: string
    // | null` — an optional property may be *omitted*, but if present may
    // not literally hold `undefined`. This keeps each key out of `data`
    // entirely when unset, rather than present-and-`undefined`.
    created = await prisma.poi.create({
      data: {
        title,
        lat,
        lng,
        category,
        ...(description !== undefined && { description }),
        ...(linkedType !== undefined && { linkedType }),
        ...(linkedId !== undefined && { linkedId }),
      },
    });
  } catch (error) {
    throw toDatabaseError("creating poi", error);
  }

  revalidatePath("/geography");
  return { ok: true, id: created.id };
}
