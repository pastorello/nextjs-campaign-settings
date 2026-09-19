/**
 * A record image once both of its files are in the record image store
 * (ADR-0017). The fields are the columns SPEC-020 §6 proposes for the
 * `recordImage` row, so SPEC-020 T2 can persist this shape as it is.
 */
export default interface StoredRecordImage {
  /** Storage key of the display version (longest side at most 1600 px). */
  displayKey: string;
  /** Storage key of the 256 px square thumbnail. */
  thumbKey: string;
  mimeType: string;
  /** Size of the display version. */
  width: number;
  height: number;
}
