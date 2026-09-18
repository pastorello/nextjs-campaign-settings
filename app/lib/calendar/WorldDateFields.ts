/**
 * What the DM has typed into `WorldDateInput`, before it is a universal day
 * (SPEC-014 §5.8). `year` and `day` stay strings while they are being
 * typed — "", "-", "3" are all legitimate intermediate states — and
 * `parseWorldDateFields` decides whether they name a date.
 */
interface WorldDateFields {
  /** The year in the chosen system; negative before its anchor. */
  year: string;
  /** 0-based, an index into the system's `monthNames`. */
  monthIndex: number;
  /** 1-based day of the month. */
  day: string;
  /** 0–23, or `null` for no hour. */
  hour: number | null;
}

export default WorldDateFields;
