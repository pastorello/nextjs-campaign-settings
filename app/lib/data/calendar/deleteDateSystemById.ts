"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import dateSystemIdValidator from "@/app/lib/utils/validators/dateSystemIdValidator";

/**
 * Deletes one of the DM's own date systems (SPEC-014 §5.2). Refused for the
 * universal count, which always exists, and for the current default — the
 * DM picks another default first — so the world never lacks either.
 *
 * **The guard is the delete's own `where`**, not a read before it: a
 * default that moved between a read and the delete could otherwise be
 * deleted. Only when nothing was deleted is the row read, to say why. No
 * stored date refers to a system (dates are universal days, ADR-0015), so
 * nothing cascades.
 *
 * Returns a `MutationResult` rather than throwing, unlike the campaign
 * deletes: both refusals are ordinary answers the panel shows, keyed on
 * `id` (TD-124).
 */
export default async function deleteDateSystemById(
  id: number
): Promise<MutationResult> {
  await requireSession();

  const parsed = dateSystemIdValidator.safeParse(id);
  if (!parsed.success) {
    return { ok: false, errors: { id: [{ key: "invalidType" }] } };
  }

  let existing;
  try {
    const { count } = await prisma.dateSystem.deleteMany({
      where: { id: parsed.data, isUniversal: false, isDefault: false },
    });
    if (count > 0) {
      revalidateDashboard("world/calendar");
      return { ok: true };
    }
    existing = await prisma.dateSystem.findUnique({
      where: { id: parsed.data },
      select: { isUniversal: true, isDefault: true },
    });
  } catch (error) {
    throw toDatabaseError("deleting a date system", error);
  }

  const key = !existing
    ? "dateSystemNotFound"
    : existing.isUniversal
      ? "universalDateSystemUndeletable"
      : "defaultDateSystemUndeletable";
  return { ok: false, errors: { id: [{ key }] } };
}
