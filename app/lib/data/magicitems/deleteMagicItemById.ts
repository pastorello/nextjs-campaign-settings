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
export async function deleteMagicItemById(id: number): Promise<void> {
  let existingItem;

  try {
    existingItem = await prisma.magicitems.findUnique({ where: { id } });
  } catch (error) {
    throw new DatabaseError("looking up magicitems for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("Oggetto magico", id);
  }

  try {
    await prisma.magicitems.delete({ where: { id } });
  } catch (error) {
    throw new DatabaseError("deleting magicitems", error);
  }
}
