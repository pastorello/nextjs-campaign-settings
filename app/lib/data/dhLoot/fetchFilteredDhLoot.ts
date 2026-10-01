import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhLoot from "@/app/lib/definitions/interfaces/daggerheart/DhLoot";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

/**
 * A page of Daggerheart loot (SPEC-029 T4), with their image keys. The DM's
 * alone (§9 decision 1): no reader scope.
 */
export async function fetchFilteredDhLoot(
  searchParams: SearchParamsInput
): Promise<DhLoot[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhLootWhereInput>(
    theParams,
    queryFields[PageType.DhLoot]
  );

  let loot;
  try {
    loot = await prisma.dhLoot.findMany({
      ...theQuery,
      include: recordImageKeysInclude,
    });
  } catch (error) {
    throw toDatabaseError("fetching loot", error);
  }

  const parsed = z.array(buildResultSchema(PageType.DhLoot)).safeParse(loot);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched loot", parsed.error);
  }

  return parsed.data as unknown as DhLoot[];
}
