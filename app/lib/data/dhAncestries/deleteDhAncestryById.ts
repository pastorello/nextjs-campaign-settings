import deleteRecordImage from "@/app/lib/data/recordImages/deleteRecordImage";
import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";

/**
 * Deletes a Daggerheart ancestry (SPEC-027 T2). Nothing references one yet
 * (characters are a later spec), so nothing can refuse it.
 */
export async function deleteDhAncestryById(id: number): Promise<void> {
  let existing;
  try {
    existing = await prisma.dhAncestry.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up ancestry for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Ancestry", id);
  }

  try {
    await prisma.dhAncestry.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting ancestry", error);
  }

  // Its image goes with it (SPEC-020 §5.6), once the delete has committed.
  if (existing.imageId != null) await deleteRecordImage(existing.imageId);
}
