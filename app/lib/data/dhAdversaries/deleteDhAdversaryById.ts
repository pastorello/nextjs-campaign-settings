import deleteRecordImage from "@/app/lib/data/recordImages/deleteRecordImage";
import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";
import ConflictError from "../../errors/ConflictError";
import fieldError from "../validation/fieldError";

/**
 * Deletes one adversary and, by the schema's cascade, its experiences and
 * features — or throws.
 *
 * Refused while an environment lists it (SPEC-028 §9 decision 2). The count
 * is read first rather than letting the join row's `Restrict` raise
 * `P2003`, whose error names nothing; the refusal carries a catalogue key
 * and the count.
 */
export async function deleteDhAdversaryById(id: number): Promise<void> {
  let existing;
  try {
    existing = await prisma.dhAdversary.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up adversary for deletion", error);
  }

  if (!existing) {
    throw new NotFoundError("Adversary", id);
  }

  let environmentCount;
  try {
    environmentCount = await prisma.dhEnvironmentAdversary.count({
      where: { adversaryId: id },
    });
  } catch (error) {
    throw toDatabaseError("checking adversary environments", error);
  }

  if (environmentCount > 0) {
    throw new ConflictError(
      `Cannot delete "${existing.name}": ${environmentCount} environment(s) list it`,
      fieldError("adversaryInEnvironments", { count: environmentCount })
    );
  }

  try {
    await prisma.dhAdversary.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting adversary", error);
  }

  // Its image goes with it (SPEC-020 §5.6), once the delete has committed.
  if (existing.imageId != null) await deleteRecordImage(existing.imageId);
}
