import prisma from "../../connections/prisma";
import DatabaseError from "../../errors/DatabaseError";
import NotFoundError from "../../errors/NotFoundError";

/**
 * Deletes one record, or throws.
 *
 * It used to return a bare `boolean`, which made "no such row" and "the
 * database is unreachable" the same value — so the route handler mapped both
 * to HTTP 500 and the caller could not tell a typo in a URL from an outage
 * (TD-13).
 */
export async function deleteSpellById(id: number): Promise<void> {
  let existingItem;

  try {
    existingItem = await prisma.spells.findUnique({ where: { id } });
  } catch (error) {
    throw new DatabaseError("looking up spells for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("Incantesimo", id);
  }

  try {
    await prisma.spells.delete({ where: { id } });
  } catch (error) {
    throw new DatabaseError("deleting spells", error);
  }
}
