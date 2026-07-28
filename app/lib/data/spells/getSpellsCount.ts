import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";

export async function getSpellsCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  const result: ItemCount = await getItemsCount(
    searchParams,
    queryFields[PageType.Spell],
    prisma.spells
  );

  return result;
}
