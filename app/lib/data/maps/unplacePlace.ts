"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

const inputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Sends a positioned place back to the unpositioned pool (SPEC-016 T1, §5) —
 * the popover's "Sposta nei luoghi non posizionati". Clears `lat`/`lng` and,
 * for an area (SPEC-009), its `footprint` too: an unpositioned place has no
 * position of either kind. Its own map, and its children's coordinates on
 * it, are untouched.
 *
 * The root has no parent to be unpositioned relative to. Refused as a
 * `MutationResult` field error, the same shape `updateZonePosition` already
 * uses for its own root-resize refusal, rather than `deletePlace`'s thrown
 * `ConflictError` — un-placing has no confirmation step (§9's open question,
 * agreed 2026-08-21), so the caller renders this inline rather than catching
 * an exception.
 */
export default async function unplacePlace(formData: {
  id: number;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = inputSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  let parentId: number | null;
  try {
    const zone = await prisma.zone.findUnique({
      where: { id: parsed.data.id },
      select: { parentId: true },
    });
    parentId = zone?.parentId ?? null;
  } catch (error) {
    throw toDatabaseError("un-placing zone", error);
  }

  if (parentId === null) {
    return {
      ok: false,
      errors: { id: ["The root place cannot be un-placed."] },
    };
  }

  try {
    await prisma.zone.update({
      where: { id: parsed.data.id },
      data: { lat: null, lng: null, footprint: Prisma.JsonNull },
    });
  } catch (error) {
    throw toDatabaseError("un-placing zone", error);
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}
