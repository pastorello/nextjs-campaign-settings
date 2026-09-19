import { z } from "zod";

import PageType from "@/app/lib/definitions/types/PageType";
import DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import DhDomainCardDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCardDomain";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "../../connections/prisma";
import { buildResultSchema } from "../validation/buildEntitySchema";

export interface DhDomainWithCards {
  domain: DhDomain;
  /** Ordered by level, then name — the domain page groups them by level. */
  cards: (DhDomainCard & { domain: DhDomainCardDomain })[];
}

/**
 * One domain and all of its cards, for the domain's page (SPEC-021 §5.2), or
 * `null` when there is no such domain. Each card carries its domain's name,
 * colour and emblem, which is what a card view draws.
 */
export default async function fetchDhDomainWithCards(
  id: number
): Promise<DhDomainWithCards | null> {
  let row;
  try {
    row = await prisma.dhDomain.findUnique({
      where: { id },
      include: {
        ...recordImageKeysInclude,
        cards: { orderBy: [{ cardLevel: "asc" }, { name: "asc" }] },
      },
    });
  } catch (error) {
    throw toDatabaseError("fetching domain with its cards", error);
  }

  if (!row) return null;

  const domain = buildResultSchema(PageType.DhDomain).safeParse(row);
  const cards = z
    .array(buildResultSchema(PageType.DhDomainCard))
    .safeParse(row.cards);
  if (!domain.success) {
    throw new DatabaseError("validating fetched domain", domain.error);
  }
  if (!cards.success) {
    throw new DatabaseError("validating fetched domain cards", cards.error);
  }

  // The schemas are built from runtime field lists, so their output types
  // are widened; these assertions narrow them back.
  const parsedDomain = domain.data as unknown as DhDomain;
  return {
    domain: parsedDomain,
    cards: (cards.data as unknown as DhDomainCard[]).map((card) => ({
      ...card,
      domain: {
        id: parsedDomain.id,
        name: parsedDomain.name,
        colour: parsedDomain.colour,
        image: parsedDomain.image,
      },
    })),
  };
}
