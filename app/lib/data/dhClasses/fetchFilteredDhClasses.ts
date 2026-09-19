import { z } from "zod";

import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

/**
 * The class list's rows, each with its features in position order — the
 * edit dialog opened from a row edits them inline (ADR-0011). The features
 * are not fields, so the result schema would strip them; they are read in
 * the same query and put back beside each parsed row.
 */
export async function fetchFilteredDhClasses(
  searchParams: SearchParamsInput
): Promise<DhClass[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhClassWhereInput>(
    theParams,
    queryFields[PageType.DhClass]
  );

  let classes;
  try {
    classes = await prisma.dhClass.findMany({
      ...theQuery,
      include: { features: { orderBy: { position: "asc" } } },
    });
  } catch (error) {
    throw toDatabaseError("fetching classes", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.DhClass))
    .safeParse(classes);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched classes", parsed.error);
  }

  return parsed.data.map((row, index) => ({
    ...(row as unknown as DhClass),
    features: classes[index]?.features ?? [],
  }));
}
