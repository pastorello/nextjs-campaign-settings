import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";
import ConflictError from "../../errors/ConflictError";

/**
 * Deletes one faction, or throws.
 *
 * The referencing-NPC check runs before the delete, rather than letting
 * Postgres's `onDelete: Restrict` raise `P2003`: the FK error carries no
 * names, and SPEC-006 §5 requires the refusal to name the blocking NPCs
 * rather than surface a database error.
 */
export async function deleteFactionById(id: number): Promise<void> {
  let existingFaction;

  try {
    existingFaction = await prisma.faction.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up faction for deletion", error);
  }

  if (!existingFaction) {
    throw new NotFoundError("Fazione", id);
  }

  let referencingNpcs;
  try {
    referencingNpcs = await prisma.npc.findMany({
      where: { faction: id },
      select: { name: true },
    });
  } catch (error) {
    throw toDatabaseError("checking faction references before deletion", error);
  }

  if (referencingNpcs.length > 0) {
    throw new ConflictError(
      `Impossibile eliminare "${existingFaction.name}": ${referencingNpcs
        .map((npc) => npc.name)
        .join(", ")} appartengono ancora a questa fazione`
    );
  }

  try {
    await prisma.faction.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting faction", error);
  }
}
