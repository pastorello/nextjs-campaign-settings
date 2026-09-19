import StoredRecordImage from "@/app/lib/definitions/interfaces/images/StoredRecordImage";
import FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";
import ImageStore from "./ImageStore";
import processRecordImage from "./processRecordImage";

type StoreRecordImageResult =
  { ok: true; image: StoredRecordImage } | { ok: false; error: FieldErrorKey };

/**
 * Runs an upload through the record image pipeline and writes both versions
 * to `store` (ADR-0017). All or nothing: if the thumbnail cannot be written,
 * the display file already written is deleted again, so a failed upload
 * leaves no orphan behind.
 *
 * This is the seam SPEC-020 T2 builds on — it inserts the `recordImage` row
 * from the returned keys, and deletes both files if that insert fails.
 */
export default async function storeRecordImage(
  input: Buffer,
  store: ImageStore
): Promise<StoreRecordImageResult> {
  const processed = await processRecordImage(input);
  if (!processed.ok) return processed;

  const { display, thumbnail, mimeType, width, height } = processed.image;

  let displayKey: string;
  try {
    displayKey = await store.put(display, mimeType);
  } catch (error) {
    console.error("Failed to store a record image:", error);
    return { ok: false, error: "imageStoreFailed" };
  }

  try {
    const thumbKey = await store.put(thumbnail, mimeType);
    return {
      ok: true,
      image: { displayKey, thumbKey, mimeType, width, height },
    };
  } catch (error) {
    console.error("Failed to store a record image thumbnail:", error);
    await store.delete(displayKey).catch(() => undefined);
    return { ok: false, error: "imageStoreFailed" };
  }
}
