"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import {
  findContainingSibling,
  type Footprint,
} from "@/app/modules/maps/lib/utils/footprint";
import { buildPoiCreateSchema } from "../validation/poiSchema";
import type {
  PoiCreateInput,
  PoiCreateResult,
} from "../../definitions/interfaces/maps/Poi";

function isFootprint(value: unknown): value is Footprint {
  return Array.isArray(value) && value.length === 2;
}

/**
 * Creates a landmark POI (TD-14 / SPEC-002, reshaped by SPEC-008 T8).
 * Outside the metadata layer by design — see SPEC-002 §7 — so it validates
 * against `poiSchema.ts` directly rather than `buildEntitySchema`. Returns
 * the new row's id, unlike the other domains' `create*` actions — see
 * `PoiCreateResult`.
 */
export default async function createPoi(
  formData: PoiCreateInput
): Promise<PoiCreateResult> {
  await requireSession();

  const parsed = buildPoiCreateSchema().safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { title, lat, lng, category, zoneId, description } = parsed.data;

  // SPEC-009 §7 — a landmark, like any pin, may not land inside a sibling
  // area. The client's own check (T4) is a convenience; this is the rule.
  let siblingZones;
  try {
    siblingZones = await prisma.zone.findMany({
      where: { parentId: zoneId },
      select: { title: true, footprint: true },
    });
  } catch (error) {
    throw toDatabaseError("checking the point against sibling areas", error);
  }

  const areaSiblings = siblingZones
    .filter((zone) => isFootprint(zone.footprint))
    .map((zone) => ({
      title: zone.title,
      footprint: zone.footprint as Footprint,
    }));
  const containing = findContainingSibling([lat, lng], areaSiblings);
  if (containing) {
    return {
      ok: false,
      errors: {
        lat: [`This point is inside an existing area: ${containing.title}.`],
      },
    };
  }

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
        zoneId,
        ...(description !== undefined && { description }),
      },
    });
  } catch (error) {
    throw toDatabaseError("creating poi", error);
  }

  revalidatePath("/geography");
  return { ok: true, id: created.id };
}
