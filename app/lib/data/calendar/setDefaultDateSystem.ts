"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import dateSystemIdValidator from "@/app/lib/utils/validators/dateSystemIdValidator";

/**
 * Thrown inside the transaction below to roll back the cleared default when
 * the chosen system does not exist. Module-private control flow, like
 * `placeLandmark`'s `PlacementRefused`: the caller gets a field error.
 */
class DateSystemMissing extends Error {}

/**
 * Makes a date system the world's default (SPEC-014 §5.2) — the one every
 * date is shown in until a viewer's toggle says otherwise.
 *
 * **Exactly one default, always.** A partial unique index (T2) allows at
 * most one; this keeps at least one. The old default is cleared first —
 * the index would refuse two — then the new one set, **in one
 * transaction**: if the chosen row is gone, the second write matches
 * nothing and the transaction rolls back, restoring the old default rather
 * than leaving the world with none. The interactive form, as in
 * `placeLandmark` (ADR-0012): the array form cannot stop on "matched
 * nothing".
 */
export default async function setDefaultDateSystem(
  id: number
): Promise<MutationResult> {
  await requireSession();

  const parsed = dateSystemIdValidator.safeParse(id);
  if (!parsed.success) {
    return { ok: false, errors: { id: [{ key: "invalidType" }] } };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.dateSystem.updateMany({
        where: { isDefault: true, id: { not: parsed.data } },
        data: { isDefault: false },
      });
      const { count } = await tx.dateSystem.updateMany({
        where: { id: parsed.data },
        data: { isDefault: true },
      });
      if (count === 0) throw new DateSystemMissing();
    });
  } catch (error) {
    if (error instanceof DateSystemMissing) {
      return { ok: false, errors: { id: [{ key: "dateSystemNotFound" }] } };
    }
    throw toDatabaseError("setting the default date system", error);
  }

  revalidateDashboard("world/calendar");
  return { ok: true };
}
