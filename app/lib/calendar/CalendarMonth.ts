/**
 * One month of the universal count (SPEC-014 §5.6's month grid): a
 * universal year and a month index, 0–11. Kept in universal years, not a
 * system's, so the same month survives a change of displayed date system —
 * a system only re-numbers years (ADR-0015).
 */
interface CalendarMonth {
  universalYear: number;
  monthIndex: number;
}

export default CalendarMonth;
