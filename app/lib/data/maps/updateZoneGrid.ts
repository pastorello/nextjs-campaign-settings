"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import zoneGridMeta from "@/app/lib/config/geography/zoneGridMeta";
import type GridScale from "@/app/lib/definitions/enums/geography/GridScale";

const zoneGridSchema = z.object({
  id: z.coerce.number().int().positive(),
  gridColumns: zoneGridMeta.gridColumns.validator,
  gridScale: zoneGridMeta.gridScale.validator,
});

/**
 * Stores a map's grid configuration (SPEC-015 T4): the width in squares
 * and which of the four scales one square represents. Only ever writes
 * those two columns — the derived height is never stored (§5), and
 * changing the scale rewrites nothing else, so every displayed distance
 * updates by reinterpretation alone (§5's edge-case table). Field
 * validators come from `zoneGridMeta`, not restated here, so the panel
 * and the save cannot drift apart on what a legal width is.
 */
export default async function updateZoneGrid(formData: {
  id: number;
  gridColumns: number;
  gridScale: GridScale;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = zoneGridSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { id, gridColumns, gridScale } = parsed.data;

  try {
    await prisma.zone.update({
      where: { id },
      data: { gridColumns, gridScale },
    });
  } catch (error) {
    throw toDatabaseError("saving the map's grid", error);
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}
