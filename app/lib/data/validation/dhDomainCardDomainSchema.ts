import { z } from "zod";

import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import recordImageKeysSchema from "./recordImageKeysSchema";

/**
 * What a card view draws of a card's domain (SPEC-021 T3), as a query selects
 * it — one join in the query that reads the cards, not one lookup per card —
 * and the schema that lets it survive the result parse. Shared by the domain
 * card list and the class page (T6).
 */
export const dhDomainCardDomainSelect = {
  id: true,
  name: true,
  colour: true,
  ...recordImageKeysInclude,
} as const;

const dhDomainCardDomainSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  colour: z.string(),
  image: recordImageKeysSchema,
});

export default dhDomainCardDomainSchema;
