import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";
import buildDhEnvironmentWhere from "./buildDhEnvironmentWhere";

/** The environment list's counts (SPEC-028 T3), with its place filter. */
export async function getDhEnvironmentsCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  return getItemsCount(
    searchParams,
    queryFields[PageType.DhEnvironment],
    prisma.dhEnvironment,
    (where) => Promise.resolve(buildDhEnvironmentWhere(where) as typeof where)
  );
}
