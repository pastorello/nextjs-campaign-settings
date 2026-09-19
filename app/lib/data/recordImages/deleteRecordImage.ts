import prisma from "@/app/lib/connections/prisma";
import defaultRecordImageStore from "@/app/lib/storage/defaultRecordImageStore";

/**
 * Deletes a `recordImage` row and both of its files (SPEC-020 §5.6) — the
 * cleanup behind replacing an image, removing it, and deleting its record.
 *
 * Callers run it only after their own write has committed, so a record never
 * points at an image that is already gone ("new files stored, then the old
 * ones deleted", §5). It never throws: by then the record's change is done
 * and must be reported as done, so a failure here is logged and leaves at
 * worst an orphan row or file — the same state an abandoned upload leaves
 * (ADR-0017, "Orphans").
 *
 * The row goes first: once it is gone nothing can reference the keys, so a
 * file delete that then fails leaves a stray file, never a dangling row.
 */
export default async function deleteRecordImage(id: number): Promise<void> {
  let row;
  try {
    row = await prisma.recordImage.findUnique({
      where: { id },
      select: { displayKey: true, thumbKey: true },
    });
    if (!row) return;
    await prisma.recordImage.delete({ where: { id } });
  } catch (error) {
    console.error(`Failed to delete record image ${id}:`, error);
    return;
  }

  await Promise.all(
    [row.displayKey, row.thumbKey].map((key) =>
      defaultRecordImageStore.delete(key).catch((error: unknown) => {
        console.error(`Failed to delete record image file ${key}:`, error);
      })
    )
  );
}
