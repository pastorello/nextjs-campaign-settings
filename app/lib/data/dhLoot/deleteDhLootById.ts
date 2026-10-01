import deleteRecordImage from "@/app/lib/data/recordImages/deleteRecordImage";
import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";

/**
 * Deletes a piece of Daggerheart loot (SPEC-029 T4). Nothing references
 * one yet (a scene's loot is SPEC-030's), so nothing can refuse it.
 */
export async function deleteDhLootById(id: number): Promise<void> {
  let existing;
  try {
    existing = await prisma.dhLoot.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up loot for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Loot", id);
  }

  try {
    await prisma.dhLoot.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting loot", error);
  }

  // Its image goes with it (SPEC-020 §5.6), once the delete has committed.
  if (existing.imageId != null) await deleteRecordImage(existing.imageId);
}
