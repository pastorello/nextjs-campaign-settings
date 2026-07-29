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

export { entityFieldKeys };
