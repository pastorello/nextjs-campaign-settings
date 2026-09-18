import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import dateSystemSelect from "./dateSystemSelect";

/**
 * The world's default date system (SPEC-014 §5.2) — the one every date is
 * shown in unless the viewer toggles another. A partial unique index keeps
 * it to one row, and the migration seeds the universal count as the
 * default; should that row ever be missing, the universal count stands in,
 * because a page that shows dates must always have a system to show them in.
 * `null` only on a database the SPEC-014 migration has not run on.
 */
export default async function fetchDefaultDateSystem(): Promise<DateSystem | null> {
  try {
    return await prisma.dateSystem.findFirst({
      where: { OR: [{ isDefault: true }, { isUniversal: true }] },
      // `true` sorts after `false`: the default first, then the universal count.
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
      select: dateSystemSelect,
    });
  } catch (error) {
    throw toDatabaseError("fetching the default date system", error);
  }
}
