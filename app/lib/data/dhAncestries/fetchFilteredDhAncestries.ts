import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhAncestry from "@/app/lib/definitions/interfaces/daggerheart/DhAncestry";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

/**
 * A page of Daggerheart ancestries (SPEC-027 T2), with their image keys. A
 * rules catalogue: every reader sees every row (SPEC-022 R14).
 */
export async function fetchFilteredDhAncestries(
  searchParams: SearchParamsInput
): Promise<DhAncestry[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhAncestryWhereInput>(
    theParams,
    queryFields[PageType.DhAncestry]
  );

  let ancestries;
  try {
    ancestries = await prisma.dhAncestry.findMany({
      ...theQuery,
      include: recordImageKeysInclude,
    });
  } catch (error) {
    throw toDatabaseError("fetching ancestries", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.DhAncestry))
    .safeParse(ancestries);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched ancestries", parsed.error);
  }

  return parsed.data as unknown as DhAncestry[];
}
