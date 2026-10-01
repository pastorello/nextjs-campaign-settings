import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";

/** The loot list's counts (SPEC-029 T4). */
export async function getDhLootCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  return getItemsCount(
    searchParams,
    queryFields[PageType.DhLoot],
    prisma.dhLoot
  );
}
