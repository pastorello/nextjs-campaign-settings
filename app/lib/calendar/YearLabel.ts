/**
 * Which side of its anchor a system year falls on. Year 0, the anchor's own
 * year, is "after" ("0 d.C.", SPEC-014 §9 decision 2).
 */
export type YearEra = "after" | "before";

/**
 * What a year label is made of; the display layer adds the system's own
 * `afterAbbrev` / `beforeAbbrev` (or full label). Year −330 is
 * `{ absoluteYear: 330, era: "before" }`, read "330 a.C.".
 */
interface YearLabel {
  absoluteYear: number;
  era: YearEra;
}

export default YearLabel;
