/**
 * What `processRecordImage` makes of an upload (SPEC-020 §5, ADR-0017): a
 * display version (longest side at most 1600 px) and a 256 px square
 * thumbnail, both re-encoded with every metadata block stripped. The upload
 * itself is not kept.
 */
export default interface ProcessedRecordImage {
  display: Buffer;
  thumbnail: Buffer;
  /** Content type of both buffers. */
  mimeType: string;
  /** Size of the display version, after auto-orientation and resizing. */
  width: number;
  height: number;
}
