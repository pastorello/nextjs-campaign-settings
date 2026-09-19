import fieldError from "@/app/lib/data/validation/fieldError";
import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import RecordImageOwner from "@/app/lib/definitions/types/RecordImageOwner";

const HOLDER = { select: { id: true } } as const;

/**
 * The half of the `imageId` rule a Zod validator cannot check (SPEC-020 T3):
 * the id must name an existing `recordImage`, and one no other record
 * already carries. The unique index would refuse the second case anyway, but
 * as a bare P2002 from whichever table; this names the field instead. The
 * index is per table, though, so across two owner tables this lookup is the
 * only guard: it must select every owner relation `recordImage` declares.
 *
 * `imageId` absent or `null` needs no check — nothing is being attached.
 * Returns field errors keyed `imageId`, or `null`.
 */
export default async function checkRecordImageReference(
  imageId: number | null | undefined,
  owner: RecordImageOwner
): Promise<FieldErrors | null> {
  if (imageId == null) return null;

  let row;
  try {
    row = await prisma.recordImage.findUnique({
      where: { id: imageId },
      select: {
        npc: HOLDER,
        deity: HOLDER,
        magicItem: HOLDER,
        treasure: HOLDER,
        faction: HOLDER,
        zone: HOLDER,
        dhDomain: HOLDER,
      },
    });
  } catch (error) {
    throw toDatabaseError("looking up a record image", error);
  }

  if (!row) return { imageId: [fieldError("imageNotFound")] };

  const holders = Object.entries(row) as [
    RecordImageOwner["relation"],
    { id: number } | null,
  ][];
  const heldElsewhere = holders.some(
    ([relation, holder]) =>
      holder !== null &&
      !(relation === owner.relation && holder.id === owner.id)
  );

  return heldElsewhere ? { imageId: [fieldError("imageInUse")] } : null;
}
