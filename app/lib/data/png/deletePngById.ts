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
export async function deletePngById(id: number): Promise<void> {
  let existingItem;

  try {
    existingItem = await prisma.png.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up png for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("PNG", id);
  }

  try {
    await prisma.png.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting png", error);
  }
}
