import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";
import buildLocationWhere from "../maps/buildLocationWhere";

export async function getDeitiesCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  const result: ItemCount = await getItemsCount(
    searchParams,
    queryFields[PageType.Deity],
    prisma.deities,
    buildLocationWhere
  );

  return result;
}
