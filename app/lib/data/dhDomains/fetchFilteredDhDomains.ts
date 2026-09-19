import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

/** One page of Daggerheart domains, filtered (SPEC-021 T2). */
export async function fetchFilteredDhDomains(
  searchParams: SearchParamsInput
): Promise<DhDomain[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhDomainWhereInput>(
    theParams,
    queryFields[PageType.DhDomain]
  );

  let domains;
  try {
    domains = await prisma.dhDomain.findMany({
      ...theQuery,
      include: recordImageKeysInclude,
    });
  } catch (error) {
    throw toDatabaseError("fetching domains", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.DhDomain))
    .safeParse(domains);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched domains", parsed.error);
  }

  return parsed.data as unknown as DhDomain[];
}
