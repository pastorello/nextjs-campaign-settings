"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import { dateSystemSchema } from "@/app/lib/config/calendar/dateSystemSchemas";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import DateSystemInput from "@/app/lib/definitions/interfaces/calendar/DateSystemInput";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import dateSystemIdValidator from "@/app/lib/utils/validators/dateSystemIdValidator";

/**
 * Every field at once, like the form that submits it, plus the row's id.
 * A full replace rather than a partial one: the panel always sends the
 * whole system, and a partial schema would let a missing month list pass.
 */
const updateSchema = dateSystemSchema.extend({
  id: dateSystemIdValidator,
});

/**
 * Edits one of the DM's own date systems (SPEC-014 §5.2). Changing the
 * anchor year re-labels every date's year in this system and moves no
 * event, since events are stored as universal days (ADR-0015) — the form
 * warns before saving; nothing here needs to follow the change through.
 *
 * **Never the universal count**, which the DM names but cannot re-anchor:
 * its fields are `updateUniversalDateSystem`'s. The guard is in the
 * write's own `where`, so a request naming the universal row writes
 * nothing, and the refusal is keyed on `id` (TD-124).
 */
export default async function updateDateSystem(
  formData: DateSystemInput & { id: number }
): Promise<MutationResult> {
  await requireSession();

  const parsed = updateSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload (TD-122).
  const { id, ...data } = parsed.data;

  let existing;
  try {
    const { count } = await prisma.dateSystem.updateMany({
      where: { id, isUniversal: false },
      data,
    });
    if (count > 0) {
      revalidateDashboard("world/calendar");
      return { ok: true };
    }
    existing = await prisma.dateSystem.findUnique({
      where: { id },
      select: { isUniversal: true },
    });
  } catch (error) {
    throw toDatabaseError("updating a date system", error);
  }

  return {
    ok: false,
    errors: {
      id: [
        { key: existing ? "universalDateSystemFixed" : "dateSystemNotFound" },
      ],
    },
  };
}
