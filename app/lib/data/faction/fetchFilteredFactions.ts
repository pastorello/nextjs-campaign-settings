import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import revealedToInclude from "@/app/lib/data/visibility/revealedToInclude";
import withRevealedIds from "@/app/lib/data/visibility/withRevealedIds";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import Faction from "@/app/lib/definitions/interfaces/faction/Faction";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

export async function fetchFilteredFactions(
  searchParams: SearchParamsInput
): Promise<Faction[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.factionWhereInput>(
    theParams,
    queryFields[PageType.Faction]
  );

  let factions;
  try {
    factions = await prisma.faction.findMany({
      ...theQuery,
      // SPEC-022 T6: the campaigns each record is revealed to.
      include: { ...recordImageKeysInclude, ...revealedToInclude },
    });
  } catch (error) {
    throw toDatabaseError("fetching factions", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.Faction))
    .safeParse(factions.map((row) => withRevealedIds(row)));
  if (!parsed.success) {
    throw new DatabaseError("validating fetched factions", parsed.error);
  }

  return parsed.data as unknown as Faction[];
}
