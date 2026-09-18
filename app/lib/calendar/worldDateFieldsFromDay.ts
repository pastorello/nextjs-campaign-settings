import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import { systemYearFromUniversalYear } from "./systemYear";
import { universalDayToDate } from "./universalDayToDate";
import type WorldDateFields from "./WorldDateFields";

/**
 * A stored date as `WorldDateInput` shows it in `system` — the inverse of
 * `parseWorldDateFields`, so a saved value is re-displayed through the same
 * conversion it was typed through (SPEC-014 §5.8). A `null` day gives empty
 * fields on the first month.
 */
export function worldDateFieldsFromDay(
  universalDay: number | null,
  hour: number | null,
  system: DateSystem
): WorldDateFields {
  if (universalDay === null) {
    return { year: "", monthIndex: 0, day: "", hour };
  }
  const { universalYear, monthIndex, day } = universalDayToDate(universalDay);
  return {
    year: String(systemYearFromUniversalYear(universalYear, system.anchorYear)),
    monthIndex,
    day: String(day),
    hour,
  };
}
