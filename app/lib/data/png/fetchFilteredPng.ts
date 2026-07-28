import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "../../connections/prisma";
import PngItem from "../../definitions/interfaces/png/PngItem";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";

export async function fetchFilteredPng(
  searchParams: SearchParamsInput
): Promise<PngItem[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.pngWhereInput>(
    theParams,
    queryFields[PageType.Png]
  );

  try {
    const result = await prisma.png.findMany(theQuery);
    return result as PngItem[];
  } catch (error) {
    throw toDatabaseError("fetching NPCs", error);
  }
}
