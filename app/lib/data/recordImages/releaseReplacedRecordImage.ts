import deleteRecordImage from "./deleteRecordImage";

/**
 * After a record's save has committed, deletes the image it no longer
 * carries (SPEC-020 T3): replaced by another, or removed (`next` is `null`).
 * A no-op when there was no image, when the save kept the same one, and when
 * the payload never mentioned the field at all (`next` is `undefined` — an
 * update carries only what changed).
 */
export default async function releaseReplacedRecordImage(
  previous: number | null | undefined,
  next: number | null | undefined
): Promise<void> {
  if (previous == null || next === undefined || previous === next) return;
  await deleteRecordImage(previous);
}
