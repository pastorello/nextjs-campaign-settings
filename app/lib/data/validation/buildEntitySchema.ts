import { z, ZodRawShape } from "zod";

import PageType from "@/app/lib/definitions/types/PageType";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import pagesConfig from "@/app/lib/config/pagesConfig";

// `id` is excluded here: the database generates it on create, and it is added
// back, required, on update.
function entityFieldKeys(pageType: PageType) {
  return pagesConfig[pageType].filter((key) => key !== "id");
}

function fieldValidators(pageType: PageType): ZodRawShape {
  // Built in one go: ZodRawShape is readonly, so it cannot be filled by index.
  return Object.fromEntries(
    entityFieldKeys(pageType).map((key) => [key, pageMetaFields[key].validator])
  );
}

/**
 * Full-object schema for a create payload: every declared field present and
 * valid. Unknown keys (e.g. a stray `id`) are stripped, not rejected.
 */
export function buildCreateSchema(pageType: PageType) {
  return z.object(fieldValidators(pageType));
}

/**
 * Schema for an update payload, which carries only the edited fields plus the
 * id. Every field is therefore optional, and `id` is required and positive.
 */
export function buildUpdateSchema(pageType: PageType) {
  return z
    .object(fieldValidators(pageType))
    .partial()
    .extend({ id: z.coerce.number().int().positive() });
}

function resultFieldValidators(pageType: PageType): ZodRawShape {
  // Several DB columns are nullable (e.g. `spells.concentration`) though the
  // domain interfaces declare them required — a pre-existing gap between the
  // schema and the type, not one this closes. Falling back to the field's own
  // `defaultValue` keeps a read honouring what the interface promises without
  // rejecting rows that have always been valid.
  return Object.fromEntries(
    entityFieldKeys(pageType).map((key) => {
      const field = pageMetaFields[key];
      return [
        key,
        field.validator
          .nullable()
          .transform((value) => value ?? field.defaultValue),
      ];
    })
  );
}

/**
 * Schema for a row read back from Prisma (TD-02b) — the same field shape as a
 * create payload, plus `id`. Replaces a blind `as Spell[]` with a real check:
 * a schema/interface drift (a renamed column, a type that no longer matches)
 * now fails loudly instead of silently reaching the UI.
 */
export function buildResultSchema(pageType: PageType) {
  return z.object(resultFieldValidators(pageType)).extend({
    id: z.number().int().positive(),
  });
}

export { entityFieldKeys };
