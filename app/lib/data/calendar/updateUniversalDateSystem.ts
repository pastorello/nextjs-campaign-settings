"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import { universalDateSystemSchema } from "@/app/lib/config/calendar/dateSystemSchemas";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import UniversalDateSystemInput from "@/app/lib/definitions/interfaces/calendar/UniversalDateSystemInput";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

/**
 * Names the universal count (SPEC-014 §5.2): its name, its year label and
 * abbreviation ("dall'alba dei tempi" / "a.T."), its months and weekdays.
 * There is exactly one universal row (a partial unique index from T2), so
 * it is addressed by its flag rather than an id the client could get wrong.
 */
export default async function updateUniversalDateSystem(
  formData: UniversalDateSystemInput
): Promise<MutationResult> {
  await requireSession();

  const parsed = universalDateSystemSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload (TD-122): an anchor
  // year or a "before" label in the payload is stripped by the schema,
  // never written — the universal count's year 0 is the dawn of time.
  const data = parsed.data;

  try {
    await prisma.dateSystem.updateMany({
      where: { isUniversal: true },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating the universal count", error);
  }

  revalidateDashboard("world/calendar");
  return { ok: true };
}
