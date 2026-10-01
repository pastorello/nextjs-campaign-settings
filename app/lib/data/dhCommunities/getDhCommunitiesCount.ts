import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import fetchRevealedIds from "@/app/lib/data/visibility/fetchRevealedIds";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";
import buildDhCommunityWhere from "./buildDhCommunityWhere";

/** The community list's counts (SPEC-027 T3), with its relation filters. */
export async function getDhCommunitiesCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  const scope = await getVisibilityScope();
  const factionIds = await fetchRevealedIds("faction", scope);
  return getItemsCount(
    searchParams,
    queryFields[PageType.DhCommunity],
    prisma.dhCommunity,
    (where) =>
      Promise.resolve(
        buildDhCommunityWhere(where, scope, factionIds) as typeof where
      )
  );
}
