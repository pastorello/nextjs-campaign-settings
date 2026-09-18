/**
 * A universal day read in one date system, split into what a date shows
 * (SPEC-014 §5.1–5.2). Every part is already text or a number the reader
 * sees; how they are joined is UI copy (`calendar.date.*` in the
 * catalogues), so the order can differ by locale.
 */
interface WorldDateParts {
  /** The system's name for the weekday — DM content, untranslated. */
  weekday: string;
  /** Day of the month, 1-based. */
  day: number;
  /** The system's name for the month — DM content, untranslated. */
  month: string;
  /** The labelled year: "330 a.C.", "0 d.C.", "1230 d.C.". */
  year: string;
  /** "14:00", or `null` when the date has no hour. */
  hour: string | null;
}

export default WorldDateParts;
