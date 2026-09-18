"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import { dateSystemSchema } from "@/app/lib/config/calendar/dateSystemSchemas";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import DateSystemInput from "@/app/lib/definitions/interfaces/calendar/DateSystemInput";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

/**
 * Adds one of the DM's own date systems (SPEC-014 §5.2): a name, an anchor
 * event and its universal year, the after/before labels, twelve month
 * names and seven weekday names — every one validated by `dateSystemMeta`.
 * A new system is never the universal count and never the default; the
 * default moves only through `setDefaultDateSystem`, so there is always
 * exactly one.
 */
export default async function createDateSystem(
  formData: DateSystemInput
): Promise<MutationResult> {
  await requireSession();

  const parsed = dateSystemSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload (TD-122).
  const data = parsed.data;

  try {
    await prisma.dateSystem.create({
      data: { ...data, isUniversal: false, isDefault: false },
    });
  } catch (error) {
    throw toDatabaseError("creating a date system", error);
  }

  revalidateDashboard("world/calendar");
  return { ok: true };
}
