import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";

/** The armor list's counts (SPEC-029 T3). */
export async function getDhArmorCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  return getItemsCount(
    searchParams,
    queryFields[PageType.DhArmor],
    prisma.dhArmor
  );
}
