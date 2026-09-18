/**
 * What `WorldDateInput` reports to its form: a universal day (ADR-0015) and
 * an optional hour, 0–23 (SPEC-014 §5.1). `universalDay` is `null` while the
 * fields are empty or do not name a real date — the input shows why, and
 * the form's own validator (`universalDayValidator`) refuses the `null` on
 * submit.
 */
interface WorldDateValue {
  universalDay: number | null;
  hour: number | null;
}

export default WorldDateValue;
