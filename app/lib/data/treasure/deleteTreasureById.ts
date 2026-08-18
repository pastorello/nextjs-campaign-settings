import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";

/**
 * Deletes one treasure catalogue entry, or throws.
 *
 * No referencing-row check before the delete: unlike faction (whose NPCs are
 * `onDelete: Restrict`), `loot.treasureId` is `onDelete: SetNull` (SPEC-013
 * §6) — a loot row that pointed at this entry simply loses the link, the same
 * as `deleteMagicItemById`.
 */
export async function deleteTreasureById(id: number): Promise<void> {
  let existingTreasure;

  try {
    existingTreasure = await prisma.treasure.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up treasure for deletion", error);
  }

  if (!existingTreasure) {
    throw new NotFoundError("Treasure", id);
  }

  try {
    await prisma.treasure.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting treasure", error);
  }
}
