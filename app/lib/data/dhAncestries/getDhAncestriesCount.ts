import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";

/** The ancestry list's counts (SPEC-027 T2). */
export async function getDhAncestriesCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  return getItemsCount(
    searchParams,
    queryFields[PageType.DhAncestry],
    prisma.dhAncestry
  );
}
