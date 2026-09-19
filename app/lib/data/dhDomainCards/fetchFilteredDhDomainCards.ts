import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";
import dhDomainCardDomainSchema, {
  dhDomainCardDomainSelect,
} from "../validation/dhDomainCardDomainSchema";

/** One page of Daggerheart domain cards, filtered, each with its domain. */
export async function fetchFilteredDhDomainCards(
  searchParams: SearchParamsInput
): Promise<DhDomainCard[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhDomainCardWhereInput>(
    theParams,
    queryFields[PageType.DhDomainCard]
  );

  let cards;
  try {
    cards = await prisma.dhDomainCard.findMany({
      ...theQuery,
      include: { domain: { select: dhDomainCardDomainSelect } },
    });
  } catch (error) {
    throw toDatabaseError("fetching domain cards", error);
  }

  const parsed = z
    .array(
      buildResultSchema(PageType.DhDomainCard).extend({
        domain: dhDomainCardDomainSchema,
      })
    )
    .safeParse(cards);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched domain cards", parsed.error);
  }

  return parsed.data as unknown as DhDomainCard[];
}
