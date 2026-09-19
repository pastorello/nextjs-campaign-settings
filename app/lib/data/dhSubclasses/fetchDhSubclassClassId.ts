import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "../../connections/prisma";

/**
 * The class a subclass belongs to, or `null` when there is no such subclass
 * — what a link to a subclass needs to land on its class's page (SPEC-021
 * T7).
 */
export default async function fetchDhSubclassClassId(
  id: number
): Promise<number | null> {
  try {
    const row = await prisma.dhSubclass.findUnique({
      where: { id },
      select: { classId: true },
    });
    return row?.classId ?? null;
  } catch (error) {
    throw toDatabaseError("fetching subclass's class", error);
  }
}
