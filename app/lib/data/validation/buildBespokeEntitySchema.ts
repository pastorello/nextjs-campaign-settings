import { z, ZodRawShape } from "zod";

import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";

/**
 * `buildEntitySchema.ts`'s pair, for the domains ADR-0011 keeps outside the
 * metadata layer (`campaign`, `adventure`, `scene`, `sceneCreature`, `loot`).
 * Those never register in `pagesConfig.ts`/`pageMetaFields.ts`, so there is
 * no `PageType` to look them up by — the caller hands over its own
 * `Record<string, PageMeta>` (`adventureMeta`, `sceneMeta`, …) directly.
 * Same two shapes as the registered-domain builder: a full-object schema for
 * create, a partial-plus-required-`id` schema for update.
 */
function fieldValidators(meta: Record<string, PageMeta>): ZodRawShape {
  return Object.fromEntries(
    Object.values(meta).map((field) => [field.metaField, field.validator])
  );
}

export function buildBespokeCreateSchema(meta: Record<string, PageMeta>) {
  return z.object(fieldValidators(meta));
}

export function buildBespokeUpdateSchema(meta: Record<string, PageMeta>) {
  return z
    .object(fieldValidators(meta))
    .partial()
    .extend({ id: z.coerce.number().int().positive() });
}
