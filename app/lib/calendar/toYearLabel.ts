import type YearLabel from "./YearLabel";

/** Splits a signed system year into its absolute value and era. */
export function toYearLabel(systemYear: number): YearLabel {
  return systemYear < 0
    ? { absoluteYear: -systemYear, era: "before" }
    : { absoluteYear: systemYear, era: "after" };
}
