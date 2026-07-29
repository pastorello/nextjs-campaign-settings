import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";

/**
 * Deletes one record, or throws.
 *
 * It used to return a bare `boolean`, which made "no such row" and "the
 * database is unreachable" the same value — so the route handler mapped both
 * to HTTP 500 and the caller could not tell a typo in a URL from an outage
 * (TD-13).
 */
export async function deleteNpcById(id: number): Promise<void> {
  let existingItem;

  try {
    existingItem = await prisma.npc.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up NPC for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("NPC", id);
  }

  try {
    await prisma.npc.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting NPC", error);
  }
}
