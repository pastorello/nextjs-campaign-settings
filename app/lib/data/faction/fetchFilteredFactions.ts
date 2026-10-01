import { z } from "zod";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import revealedToInclude from "@/app/lib/data/visibility/revealedToInclude";
import withRevealedIds from "@/app/lib/data/visibility/withRevealedIds";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import revealedWhere from "@/app/lib/data/visibility/revealedWhere";
import {
  andWhere,
  forReader,
  readerQueryInput,
} from "@/app/lib/data/visibility/readerQuery";
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
  // SPEC-022 T8b (R5): a player gets the records revealed to their
  // campaign, without the DM-only fields.
  const scope = await getVisibilityScope();
  const { params, fields } = readerQueryInput(
    PageType.Faction,
    await searchParams,
    scope
  );
  const theQuery = getQuery<Prisma.factionWhereInput>(params, fields);

  let factions;
  try {
    factions = await prisma.faction.findMany({
      ...theQuery,
      where: andWhere(theQuery.where, revealedWhere(scope)),
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

  return forReader(
    PageType.Faction,
    parsed.data as unknown as Faction[],
    scope
  );
}
