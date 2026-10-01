import { z } from "zod";

import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhEnvironment from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironment";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";
import buildDhEnvironmentWhere from "./buildDhEnvironmentWhere";
import dhEnvironmentInclude from "./dhEnvironmentInclude";
import withEnvironmentLinks from "./withEnvironmentLinks";

const linkSchema = z.array(z.object({ id: z.number(), name: z.string() }));

/**
 * A page of environments (SPEC-028 T3), with their image keys, their
 * adversaries and places named, and their features in order. The rows are
 * not fields, so they are put back beside each parsed row. The DM's alone
 * (§9 decision 3): no reader scope.
 */
export async function fetchFilteredDhEnvironments(
  searchParams: SearchParamsInput
): Promise<DhEnvironment[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhEnvironmentWhereInput>(
    theParams,
    queryFields[PageType.DhEnvironment]
  );

  let environments;
  try {
    environments = await prisma.dhEnvironment.findMany({
      ...theQuery,
      where: buildDhEnvironmentWhere(theQuery.where as Record<string, unknown>),
      include: dhEnvironmentInclude,
    });
  } catch (error) {
    throw toDatabaseError("fetching environments", error);
  }

  const rows = environments.map(withEnvironmentLinks);
  const parsed = z
    .array(
      buildResultSchema(PageType.DhEnvironment).extend({
        adversaries: linkSchema,
        places: linkSchema,
      })
    )
    .safeParse(rows);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched environments", parsed.error);
  }

  return parsed.data.map((row, index) => ({
    ...(row as unknown as DhEnvironment),
    features: rows[index]?.features ?? [],
  }));
}
