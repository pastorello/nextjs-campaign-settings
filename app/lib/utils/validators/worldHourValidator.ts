import { z } from "zod";

/**
 * The optional hour beside a universal day (SPEC-014 §5.1): 0–23, or `null`
 * for none. For the `validator` of an hour field's `PageMeta` (T5/T6).
 */
const worldHourValidator = z.number().int().min(0).max(23).nullable();

export default worldHourValidator;
