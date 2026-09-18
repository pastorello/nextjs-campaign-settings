import { z } from "zod";

import { MAX_UNIVERSAL_DAY } from "@/app/lib/calendar/maxUniversalDay";

/**
 * A stored date: a universal day (ADR-0015), whole, not before the dawn of
 * time (day 0) and small enough for the `integer` column. For the
 * `validator` of a date field's `PageMeta` (SPEC-014 T5/T6) — the same
 * check `WorldDateInput` makes as the DM types, so the server refuses what
 * the input already flagged, with the same key.
 */
const universalDayValidator = z
  .number()
  .int()
  .min(0, { message: "beforeDawnOfTime" })
  .max(MAX_UNIVERSAL_DAY);

export default universalDayValidator;
