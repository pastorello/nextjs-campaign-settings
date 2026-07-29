import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import Deity from "../../definitions/interfaces/deities/Deity";

export async function fetchFilteredDeities(
  searchParams: SearchParamsInput
): Promise<Deity[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.deitiesWhereInput>(
    theParams,
    queryFields[PageType.Deity]
  );

  try {
    const result = await prisma.deities.findMany(theQuery);
    return result as Deity[];
  } catch (error) {
    throw toDatabaseError("fetching deities", error);
  }
}
