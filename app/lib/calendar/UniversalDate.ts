/**
 * A day as a year, month and day, in the universal count (ADR-0015).
 *
 * `monthIndex` is 0-based (0 = the first month) because month names come from
 * the date system's `monthNames` array; `day` is 1-based because it is the
 * number the DM reads and types. A date system re-labels `universalYear` only.
 */
interface UniversalDate {
  universalYear: number;
  monthIndex: number;
  day: number;
}

export default UniversalDate;
