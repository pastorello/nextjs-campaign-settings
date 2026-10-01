import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhCommunity from "@/app/lib/definitions/interfaces/daggerheart/DhCommunity";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import fetchRevealedIds from "@/app/lib/data/visibility/fetchRevealedIds";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";
import buildDhCommunityWhere from "./buildDhCommunityWhere";
import dhCommunityLinksInclude from "./dhCommunityLinksInclude";
import withCommunityLinks from "./withCommunityLinks";

const linkSchema = z.array(z.object({ id: z.number(), name: z.string() }));

/**
 * A page of Daggerheart communities (SPEC-027 T3), with their image keys and
 * their linked places and factions. A catalogue, so every reader sees every
 * community; a player sees only the links their campaign may see (SPEC-022).
 */
export async function fetchFilteredDhCommunities(
  searchParams: SearchParamsInput
): Promise<DhCommunity[]> {
  const scope = await getVisibilityScope();
  const factionIds = await fetchRevealedIds("faction", scope);
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhCommunityWhereInput>(
    theParams,
    queryFields[PageType.DhCommunity]
  );

  let communities;
  try {
    communities = await prisma.dhCommunity.findMany({
      ...theQuery,
      where: buildDhCommunityWhere(
        theQuery.where as Record<string, unknown>,
        scope,
        factionIds
      ),
      include: dhCommunityLinksInclude,
    });
  } catch (error) {
    throw toDatabaseError("fetching communities", error);
  }

  const parsed = z
    .array(
      buildResultSchema(PageType.DhCommunity).extend({
        places: linkSchema,
        factions: linkSchema,
      })
    )
    .safeParse(
      communities.map((row) => withCommunityLinks(row, scope, factionIds))
    );
  if (!parsed.success) {
    throw new DatabaseError("validating fetched communities", parsed.error);
  }

  return parsed.data as unknown as DhCommunity[];
}
