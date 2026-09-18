"use server";

import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import calendarSettingsMeta from "@/app/lib/config/calendar/calendarSettingsMeta";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

const moonSchema = z.object({
  moonNewMoonDay: calendarSettingsMeta.moonNewMoonDay.validator,
});

/**
 * Sets the reference new moon (SPEC-014 §5.3), or clears it with `null` —
 * after which no moon phase is shown anywhere. An upsert on the singleton
 * row: the migration inserts it, but a missing row is read as "nothing
 * set" by `fetchCalendarSettings`, so writing must not depend on it either.
 */
export default async function setMoonReferenceDay(formData: {
  moonNewMoonDay: number | null;
}): Promise<MutationResult> {
  await requireSession();

  const parsed = moonSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const moonNewMoonDay = parsed.data.moonNewMoonDay;
  try {
    await prisma.calendarSettings.upsert({
      where: { id: 1 },
      create: { id: 1, moonNewMoonDay },
      update: { moonNewMoonDay },
    });
  } catch (error) {
    throw toDatabaseError("setting the reference new moon", error);
  }

  revalidateDashboard("world/calendar");
  return { ok: true };
}
