import deleteRecordImage from "@/app/lib/data/recordImages/deleteRecordImage";
import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";

/**
 * Deletes a Daggerheart community (SPEC-027 T3). Its links go with it; the
 * places and factions it named are untouched (§5).
 */
export async function deleteDhCommunityById(id: number): Promise<void> {
  let existing;
  try {
    existing = await prisma.dhCommunity.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up community for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Community", id);
  }

  try {
    await prisma.dhCommunity.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting community", error);
  }

  // Its image goes with it (SPEC-020 §5.6), once the delete has committed.
  if (existing.imageId != null) await deleteRecordImage(existing.imageId);
}
