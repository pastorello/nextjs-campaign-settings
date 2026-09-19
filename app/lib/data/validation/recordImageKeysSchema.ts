import { z } from "zod";

/**
 * A row's `image` relation as `recordImageKeysInclude` selects it, or `null`
 * for a record without an image (SPEC-020 T4). Optional too: a query that
 * does not include the relation reads no key at all, and that is not an
 * error.
 */
const recordImageKeysSchema = z
  .object({
    displayKey: z.string().min(1),
    thumbKey: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .nullable()
  .optional();

export default recordImageKeysSchema;
