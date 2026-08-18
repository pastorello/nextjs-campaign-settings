import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import Treasure from "@/app/lib/definitions/interfaces/treasure/Treasure";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

export async function fetchFilteredTreasures(
  searchParams: SearchParamsInput
): Promise<Treasure[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.treasureWhereInput>(
    theParams,
    queryFields[PageType.Treasure]
  );

  let treasures;
  try {
    treasures = await prisma.treasure.findMany(theQuery);
  } catch (error) {
    throw toDatabaseError("fetching treasure", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.Treasure))
    .safeParse(treasures);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched treasure", parsed.error);
  }

  return parsed.data as unknown as Treasure[];
}
