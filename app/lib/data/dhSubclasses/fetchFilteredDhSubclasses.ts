import { z } from "zod";

import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhSubclass from "@/app/lib/definitions/interfaces/daggerheart/DhSubclass";
import DhSubclassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhSubclassFeature";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

/**
 * The subclass list's rows, each with its features in position order (the
 * inline editor groups them by tier). Read in the same query and put back
 * beside each parsed row, since the result schema strips non-fields — the
 * same shape as `fetchFilteredDhClasses`.
 */
export async function fetchFilteredDhSubclasses(
  searchParams: SearchParamsInput
): Promise<DhSubclass[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhSubclassWhereInput>(
    theParams,
    queryFields[PageType.DhSubclass]
  );

  let subclasses;
  try {
    subclasses = await prisma.dhSubclass.findMany({
      ...theQuery,
      include: { features: { orderBy: { position: "asc" } } },
    });
  } catch (error) {
    throw toDatabaseError("fetching subclasses", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.DhSubclass))
    .safeParse(subclasses);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched subclasses", parsed.error);
  }

  return parsed.data.map((row, index) => ({
    ...(row as unknown as DhSubclass),
    // `tier` is a raw `String` column; the vocabulary is enforced on write.
    features: (subclasses[index]?.features ?? []) as DhSubclassFeature[],
  }));
}
