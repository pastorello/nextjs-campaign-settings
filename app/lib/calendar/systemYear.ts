/**
 * Year numbering in a date system (SPEC-014 §5.2): the system's year is the
 * universal year minus the universal year of its anchor event. Year 0 exists
 * — it is the anchor's own year — so the conversion is a plain subtraction in
 * both directions, with no skipped year. The universal count is the system
 * whose anchor year is 0.
 */
export function systemYearFromUniversalYear(
  universalYear: number,
  anchorYear: number
): number {
  return universalYear - anchorYear;
}

/** The inverse of `systemYearFromUniversalYear`. */
export function universalYearFromSystemYear(
  systemYear: number,
  anchorYear: number
): number {
  return systemYear + anchorYear;
}
