import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import Deity from "../../definitions/interfaces/deities/Deity";
import { buildResultSchema } from "../validation/buildEntitySchema";

export async function fetchFilteredDeities(
  searchParams: SearchParamsInput
): Promise<Deity[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.deitiesWhereInput>(
    theParams,
    queryFields[PageType.Deity]
  );

  let result;
  try {
    result = await prisma.deities.findMany(theQuery);
  } catch (error) {
    throw toDatabaseError("fetching deities", error);
  }

  const parsed = z.array(buildResultSchema(PageType.Deity)).safeParse(result);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched deities", parsed.error);
  }

  return parsed.data as unknown as Deity[];
}
