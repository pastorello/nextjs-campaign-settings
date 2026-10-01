import deleteRecordImage from "@/app/lib/data/recordImages/deleteRecordImage";
import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";

/**
 * Deletes a Daggerheart environment (SPEC-028 T3) and, by the schema's
 * cascades, its features and its adversary links; the adversaries and the
 * places stay. Nothing references an environment yet, so nothing refuses.
 */
export async function deleteDhEnvironmentById(id: number): Promise<void> {
  let existing;
  try {
    existing = await prisma.dhEnvironment.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up environment for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Environment", id);
  }

  try {
    await prisma.dhEnvironment.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting environment", error);
  }

  // Its image goes with it (SPEC-020 §5.6), once the delete has committed.
  if (existing.imageId != null) await deleteRecordImage(existing.imageId);
}
