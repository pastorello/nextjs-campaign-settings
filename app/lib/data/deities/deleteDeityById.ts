import deleteRecordImage from "@/app/lib/data/recordImages/deleteRecordImage";
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
export async function deleteDeityById(id: number): Promise<void> {
  let existingItem;

  try {
    existingItem = await prisma.deities.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up deities for deletion", error);
  }

  if (!existingItem) {
    throw new NotFoundError("Divinità", id);
  }

  try {
    await prisma.deities.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting deities", error);
  }

  // Its image goes with it (SPEC-020 §5.6), once the delete has committed.
  if (existingItem.imageId != null)
    await deleteRecordImage(existingItem.imageId);
}
