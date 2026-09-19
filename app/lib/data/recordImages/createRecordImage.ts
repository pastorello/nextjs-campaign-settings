import prisma from "@/app/lib/connections/prisma";
import StoredRecordImage from "@/app/lib/definitions/interfaces/images/StoredRecordImage";
import ImageStore from "@/app/lib/storage/ImageStore";

/**
 * Persists a stored upload as a `recordImage` row (SPEC-020 T2/T3) and
 * returns its id — the value a record's `imageId` field then carries. If the
 * insert fails, both files are deleted again, so a failed upload leaves no
 * orphan on disk (ADR-0017's follow-up for T2). Returns `null` on failure;
 * the caller reports `imageStoreFailed`.
 *
 * Not a Server Action: only the authenticated upload route calls it.
 */
export default async function createRecordImage(
  image: StoredRecordImage,
  store: ImageStore
): Promise<number | null> {
  try {
    const row = await prisma.recordImage.create({
      data: image,
      select: { id: true },
    });
    return row.id;
  } catch (error) {
    console.error("Failed to save a record image row:", error);
    await Promise.all([
      store.delete(image.displayKey).catch(() => undefined),
      store.delete(image.thumbKey).catch(() => undefined),
    ]);
    return null;
  }
}
