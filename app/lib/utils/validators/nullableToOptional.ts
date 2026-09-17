import { z } from "zod";

/**
 * Bridges a nullable-column field into `PageMeta`'s string branch (TD-130).
 *
 * A field mapped to a nullable Postgres column has a domain interface typed
 * `string | null`, not optional, so a caller that leaves it unset supplies
 * an explicit `null` rather than omitting the key. `.optional()` alone only
 * tolerates `undefined`; this preprocesses `null` the same way before
 * handing off to `schema`. `PageMeta`'s `StringFieldMeta.validator` type is
 * `ZodType<string | undefined>` by design (a string field is never null
 * elsewhere in the metadata layer) — `z.preprocess` still satisfies it
 * since its *output* type is unchanged, only what it accepts on the way in.
 *
 * Previously five separate local copies — `sceneMeta`, `sceneCreatureMeta`,
 * `campaignMeta`, `adventureMeta` and `zoneMeta` each declared their own
 * identical function — see TD-130.
 */
export default function nullableToOptional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((raw) => (raw === null ? undefined : raw), schema);
}
