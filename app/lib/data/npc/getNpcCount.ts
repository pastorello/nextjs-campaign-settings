import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";
import buildLocationWhere from "../maps/buildLocationWhere";

export async function getNpcCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  const result: ItemCount = await getItemsCount(
    searchParams,
    queryFields[PageType.Npc],
    prisma.npc,
    buildLocationWhere
  );

  return result;
}
