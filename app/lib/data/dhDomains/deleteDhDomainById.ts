import deleteRecordImage from "@/app/lib/data/recordImages/deleteRecordImage";
import fieldError from "@/app/lib/data/validation/fieldError";
import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";
import ConflictError from "../../errors/ConflictError";

/**
 * Deletes one Daggerheart domain, or throws.
 *
 * Cards and classes reference a domain with `onDelete: Restrict` (SPEC-021
 * §6), so a domain still in use is refused — counted first, rather than
 * letting Postgres raise a `P2003` that says neither what nor how many
 * (SPEC-021 §5: "refused with a field error naming how many use it"). The
 * refusal travels as the `dhDomainInUse` key with both counts.
 */
export async function deleteDhDomainById(id: number): Promise<void> {
  let existingDomain;
  try {
    existingDomain = await prisma.dhDomain.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up domain for deletion", error);
  }

  if (!existingDomain) {
    throw new NotFoundError("Domain", id);
  }

  let cards;
  let classes;
  try {
    cards = await prisma.dhDomainCard.count({ where: { domainId: id } });
    classes = await prisma.dhClass.count({
      where: { OR: [{ domainAId: id }, { domainBId: id }] },
    });
  } catch (error) {
    throw toDatabaseError("checking domain references before deletion", error);
  }

  if (cards > 0 || classes > 0) {
    throw new ConflictError(
      `Cannot delete domain "${existingDomain.name}": ${cards} card(s) and ${classes} class(es) still use it`,
      fieldError("dhDomainInUse", { cards, classes })
    );
  }

  try {
    await prisma.dhDomain.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting domain", error);
  }

  // Its emblem goes with it (SPEC-020 §5.6), once the delete has committed.
  if (existingDomain.imageId != null)
    await deleteRecordImage(existingDomain.imageId);
}
