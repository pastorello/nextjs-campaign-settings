"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import type AssignLocationInput from "../../definitions/interfaces/maps/AssignLocationInput";
import { buildAssignLocationSchema } from "../validation/assignLocationSchema";
import resolveLocationAssignment from "../maps/resolveLocationAssignment";

/**
 * Assigns or clears a deity's location (SPEC-008 T3) — the sole writer of
 * `deities.zoneId`/`poiId`. Bespoke, outside `buildEntitySchema`'s generic
 * update path: `location` is deliberately absent from `formFields` (§7),
 * since assignment happens through a dedicated modal, never `DeityForm`.
 */
export default async function assignDeityLocation(
  formData: AssignLocationInput
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildAssignLocationSchema().safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const resolved = await resolveLocationAssignment(
    parsed.data.zoneId,
    parsed.data.poiId
  );
  if (!resolved.ok) {
    return resolved;
  }

  try {
    await prisma.deities.update({
      where: { id: parsed.data.id },
      data: { zoneId: resolved.zoneId, poiId: resolved.poiId },
    });
  } catch (error) {
    throw toDatabaseError("assigning deity location", error);
  }

  revalidatePath("/deities");
  return { ok: true };
}
