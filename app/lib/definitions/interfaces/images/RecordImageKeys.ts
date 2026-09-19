/**
 * What a card or list row needs to show a record's image (SPEC-020 T4): the
 * two storage keys, read through the owning row's `image` relation in the
 * same query as the row, and the display version's size so the `<img>` can
 * reserve its box before the bytes arrive. `null` on the row means no image.
 */
export default interface RecordImageKeys {
  /** Storage key of the display version (longest side at most 1600 px). */
  displayKey: string;
  /** Storage key of the 256 px square thumbnail. */
  thumbKey: string;
  /** Size of the display version. */
  width: number;
  height: number;
}
