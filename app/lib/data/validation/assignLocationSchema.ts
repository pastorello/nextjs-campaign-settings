import { z } from "zod";

const assignLocationFields = {
  id: z.coerce.number().int().positive(),
  zoneId: z.coerce.number().int().positive().nullable(),
  poiId: z.coerce.number().int().positive().nullable(),
};

/**
 * Validates an `assignLocation` payload (SPEC-008 T3). Structural only:
 * `poiId` cannot be set without a `zoneId`, since a landmark always belongs
 * to exactly one zone (§6). The deeper invariant — that the given `zoneId`
 * actually *is* the chosen POI's own zone — needs a database read and is
 * checked by `resolveLocationAssignment.ts`, not here.
 */
export function buildAssignLocationSchema() {
  return z
    .object(assignLocationFields)
    .refine((data) => !(data.poiId !== null && data.zoneId === null), {
      message:
        "poiId cannot be set without a zoneId — a POI always belongs to a zone.",
      path: ["zoneId"],
    });
}
