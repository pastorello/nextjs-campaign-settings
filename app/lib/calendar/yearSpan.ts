import { DAYS_PER_YEAR } from "./monthLengths";

/**
 * The whole universal years that hold the given days, as a range of
 * universal days — first day of the earliest year to last day of the
 * latest — or `null` for no days. The campaign calendar's "range shown"
 * (SPEC-014 §5.4): its list is grouped by year, so the world history it
 * shows beside the campaign's events is every event in those years.
 */
export function yearSpan(
  days: readonly number[]
): { firstDay: number; lastDay: number } | null {
  if (days.length === 0) return null;
  const firstYear = Math.floor(Math.min(...days) / DAYS_PER_YEAR);
  const lastYear = Math.floor(Math.max(...days) / DAYS_PER_YEAR);
  return {
    firstDay: firstYear * DAYS_PER_YEAR,
    lastDay: (lastYear + 1) * DAYS_PER_YEAR - 1,
  };
}
