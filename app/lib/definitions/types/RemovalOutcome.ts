/**
 * Which of the two named outcomes the DM picked when removing a place or a
 * landmark from a map (SPEC-023 §5). The two are deliberately not a boolean:
 * "remove from the map" and "delete permanently" are different operations on
 * different tables, and the dialog's whole point is that neither is the
 * default the other one falls back to.
 */
enum RemovalOutcome {
  /** Back to the unpositioned pool (SPEC-017) — the row survives. */
  unplace = "unplace",
  /** Destroyed, under SPEC-010's rules — children move up to the grandparent. */
  delete = "delete",
}

export default RemovalOutcome;
