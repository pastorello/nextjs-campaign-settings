import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";

export async function getDhDomainsCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  return getItemsCount(
    searchParams,
    queryFields[PageType.DhDomain],
    prisma.dhDomain
  );
}
