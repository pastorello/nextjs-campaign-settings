import { z } from "zod";

import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhAdversary from "@/app/lib/definitions/interfaces/daggerheart/DhAdversary";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

/**
 * A page of adversaries (SPEC-028 T2), each with its image keys and its
 * experiences and features in position order — the stat block shows them,
 * and the edit dialog edits them inline (ADR-0011). The rows are not
 * fields, so the result schema would strip them; they are put back beside
 * each parsed row. The DM's alone (§9 decision 3): no reader scope.
 */
export async function fetchFilteredDhAdversaries(
  searchParams: SearchParamsInput
): Promise<DhAdversary[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhAdversaryWhereInput>(
    theParams,
    queryFields[PageType.DhAdversary]
  );

  let adversaries;
  try {
    adversaries = await prisma.dhAdversary.findMany({
      ...theQuery,
      include: {
        ...recordImageKeysInclude,
        experiences: { orderBy: { position: "asc" } },
        features: { orderBy: { position: "asc" } },
      },
    });
  } catch (error) {
    throw toDatabaseError("fetching adversaries", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.DhAdversary))
    .safeParse(adversaries);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched adversaries", parsed.error);
  }

  return parsed.data.map((row, index) => ({
    ...(row as unknown as DhAdversary),
    experiences: adversaries[index]?.experiences ?? [],
    features: adversaries[index]?.features ?? [],
  }));
}
