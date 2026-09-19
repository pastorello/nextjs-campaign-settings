import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";
import ConflictError from "../../errors/ConflictError";
import fieldError from "../validation/fieldError";

/**
 * Deletes one class and, by the schema's cascade, its features — or throws.
 *
 * Refused while subclasses belong to it (SPEC-021 §5: "delete or move the
 * subclasses first"). The count is read before the delete rather than
 * letting `dhSubclass.classId`'s `onDelete: Restrict` raise `P2003`, whose
 * error names nothing; the refusal carries a catalogue key and the count.
 */
export async function deleteDhClassById(id: number): Promise<void> {
  let existingClass;
  try {
    existingClass = await prisma.dhClass.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up class for deletion", error);
  }

  if (!existingClass) {
    throw new NotFoundError("Class", id);
  }

  let subclassCount;
  try {
    subclassCount = await prisma.dhSubclass.count({ where: { classId: id } });
  } catch (error) {
    throw toDatabaseError("checking class subclasses before deletion", error);
  }

  if (subclassCount > 0) {
    throw new ConflictError(
      `Cannot delete "${existingClass.name}": ${subclassCount} subclass(es) still belong to it`,
      fieldError("classHasSubclasses", { count: subclassCount })
    );
  }

  try {
    await prisma.dhClass.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting class", error);
  }
}
