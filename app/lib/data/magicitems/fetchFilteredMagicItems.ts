import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";

export async function fetchFilteredMagicItems(
  searchParams: SearchParamsInput
): Promise<MagicItem[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.magicitemsWhereInput>(
    theParams,
    queryFields[PageType.MagicItem]
  );

  try {
    const magicItems = await prisma.magicitems.findMany(theQuery);
    return magicItems.map((item) => ({
      ...item,
      attuned: item.attuned === true,
    }));
  } catch (error) {
    throw toDatabaseError("fetching magic items", error);
  }
}
