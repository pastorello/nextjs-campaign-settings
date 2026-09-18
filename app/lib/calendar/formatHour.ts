/**
 * An hour, 0–23, as SPEC-014 §9 decision 4 writes it: "14:00", and "09:00"
 * for a single digit, so a column of hours lines up. No minutes exist
 * (§3), so the ":00" is fixed rather than a format a locale could change.
 */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
