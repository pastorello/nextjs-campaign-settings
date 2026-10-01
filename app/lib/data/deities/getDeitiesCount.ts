import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";
import getVisibilityScope from "../visibility/getVisibilityScope";
import revealedWhere from "../visibility/revealedWhere";
import { readerQueryInput } from "../visibility/readerQuery";
import buildLocationWhere from "../maps/buildLocationWhere";

export async function getDeitiesCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  // SPEC-022 T8b: the same scope as the list, so a player's counts and
  // pages agree with the rows they are shown.
  const scope = await getVisibilityScope();
  const { params, fields } = readerQueryInput(
    PageType.Deity,
    await searchParams,
    scope
  );
  const result: ItemCount = await getItemsCount(
    params,
    fields,
    prisma.deities,
    (where, raw) => buildLocationWhere(where, raw, scope),
    revealedWhere(scope)
  );

  return result;
}
