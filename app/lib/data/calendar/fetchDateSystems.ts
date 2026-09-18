import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import dateSystemSelect from "./dateSystemSelect";

/**
 * Every date system (SPEC-014 §5.2): the universal count first — it always
 * exists and heads every picker — then the DM's own systems by name.
 * Outside the metadata layer (§7: a settings panel, not a domain), so a
 * plain `select` rather than `getQuery`.
 */
export default async function fetchDateSystems(): Promise<DateSystem[]> {
  try {
    return await prisma.dateSystem.findMany({
      orderBy: [{ isUniversal: "desc" }, { name: "asc" }, { id: "asc" }],
      select: dateSystemSelect,
    });
  } catch (error) {
    throw toDatabaseError("fetching the date systems", error);
  }
}
