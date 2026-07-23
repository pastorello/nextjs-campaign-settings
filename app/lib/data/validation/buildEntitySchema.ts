import { z, ZodRawShape } from "zod";

import PageType from "@/app/lib/definitions/types/PageType";
import pageMetaFields from "@/app/lib/config/pageMetaFields";

// The fields that make up each entity's write payload, by their real key — the
// lowercase name shared by the payload object, the metadata registry and the DB
// column. `id` is deliberately excluded: the database generates it on create,
// and it is added back, required, on update.
//
// This list is what `pagesConfig` was meant to be, but that registry is
// currently dead and its references do not even resolve (it accesses
// `pageMetaFields.tempoDiLancio` where the key is `tempodilancio`). Rebuilding
// it properly is TD-08's job; validation cannot wait for it, so the keys live
// here, guarded by a test that every one resolves to a declared validator.
const entityFieldKeys: Record<PageType, readonly string[]> = {
  [PageType.Spell]: [
    "nome",
    "descrizione",
    "livello",
    "circolo",
    "classi",
    "sottoclassi",
    "tempodilancio",
    "gittata",
    "componenti",
    "durata",
    "tirosalvezza",
    "rituale",
    "concentrazione",
    "intensificato",
  ],
  [PageType.MagicItem]: ["nome", "descrizione", "rarita", "tipo", "sintonia"],
  [PageType.Png]: [
    "nome",
    "descrizione",
    "titolo",
    "allineamento",
    "dominioallineamento",
    "mansione",
    "luogo",
    "fazione",
    "aspetto",
    "personalita",
    "motivazioni",
    "segreti",
  ],
  [PageType.Deity]: [
    "nome",
    "titolopatrono",
    "tipopatrono",
    "gradopatrono",
    "card",
    "astri",
    "elemento",
    "classe",
    "festivita",
    "colore",
    "tradizione",
    "allineamento",
    "dominioallineamento",
    "residenza",
    "luogo",
    "significato",
  ],
};

function fieldValidators(pageType: PageType): ZodRawShape {
  // Built in one go: ZodRawShape is readonly, so it cannot be filled by index.
  return Object.fromEntries(
    entityFieldKeys[pageType].map((key) => [key, pageMetaFields[key].validator])
  ) as ZodRawShape;
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
