import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import Patrono from "../../definitions/interfaces/deities/Patrono";

export async function fetchFilteredDeities(
  searchParams: SearchParamsInput
): Promise<Patrono[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.deitiesWhereInput>(
    theParams,
    queryFields[PageType.Deity]
  );

  try {
    const result = await prisma.deities.findMany(theQuery);
    return result as Patrono[];
  } catch (error) {
    throw toDatabaseError("fetching deities", error);
  }
}
