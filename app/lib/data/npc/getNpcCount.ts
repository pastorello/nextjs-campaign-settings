import PageType from "@/app/lib/definitions/types/PageType";
import prisma from "../../connections/prisma";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";
import getVisibilityScope from "../visibility/getVisibilityScope";
import revealedWhere from "../visibility/revealedWhere";
import fetchRevealedIds from "../visibility/fetchRevealedIds";
import { readerQueryInput } from "../visibility/readerQuery";
import buildNpcWhere from "./buildNpcWhere";

export async function getNpcCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  // SPEC-022 T8b: the same scope as `fetchFilteredNpc`, so a player's
  // counts and pages agree with the rows they are shown.
  const scope = await getVisibilityScope();
  const { params, fields } = readerQueryInput(
    PageType.Npc,
    await searchParams,
    scope
  );
  const factionIds = await fetchRevealedIds("faction", scope);
  const result: ItemCount = await getItemsCount(
    params,
    fields,
    prisma.npc,
    (where, raw) => buildNpcWhere(where, raw, scope, factionIds),
    revealedWhere(scope)
  );

  return result;
}
