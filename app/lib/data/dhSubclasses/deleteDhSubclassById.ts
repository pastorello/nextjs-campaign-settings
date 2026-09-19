import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";

/**
 * Deletes one subclass and, by the schema's cascade, its features — or
 * throws. Nothing references a subclass, so there is nothing to refuse.
 */
export async function deleteDhSubclassById(id: number): Promise<void> {
  let existing;
  try {
    existing = await prisma.dhSubclass.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up subclass for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Subclass", id);
  }

  try {
    await prisma.dhSubclass.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting subclass", error);
  }
}
