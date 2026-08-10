import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
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
    factions = await prisma.faction.findMany(theQuery);
  } catch (error) {
    throw toDatabaseError("fetching factions", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.Faction))
    .safeParse(factions);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched factions", parsed.error);
  }

  return parsed.data as unknown as Faction[];
}
