import { z } from "zod";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import revealedToInclude from "@/app/lib/data/visibility/revealedToInclude";
import withRevealedIds from "@/app/lib/data/visibility/withRevealedIds";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import revealedWhere from "@/app/lib/data/visibility/revealedWhere";
import fetchRevealedIds from "@/app/lib/data/visibility/fetchRevealedIds";
import {
  andWhere,
  forReader,
  readerQueryInput,
} from "@/app/lib/data/visibility/readerQuery";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import prisma from "../../connections/prisma";
import NpcItem from "../../definitions/interfaces/npc/NpcItem";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";
import buildNpcWhere from "./buildNpcWhere";
import applyLocationSort from "../maps/applyLocationSort";

export async function fetchFilteredNpc(
  searchParams: SearchParamsInput
): Promise<NpcItem[]> {
  // SPEC-022 T8b (R2): a player gets the NPCs revealed to their campaign,
  // without the DM-only fields, and a faction they have not been shown
  // reads as none.
  const scope = await getVisibilityScope();
  const { params, fields } = readerQueryInput(
    PageType.Npc,
    await searchParams,
    scope
  );
  const theQuery = getQuery<Prisma.npcWhereInput>(params, fields);
  const factionIds = await fetchRevealedIds("faction", scope);

  let result;
  try {
    result = await prisma.npc.findMany({
      where: andWhere(
        await buildNpcWhere(theQuery.where, params, scope, factionIds),
        revealedWhere(scope)
      ),
      orderBy: applyLocationSort(theQuery.orderBy),
      skip: theQuery.skip,
      take: theQuery.take,
      // SPEC-022 T6: the campaigns each record is revealed to.
      include: { ...recordImageKeysInclude, ...revealedToInclude },
    });
  } catch (error) {
    throw toDatabaseError("fetching NPCs", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.Npc))
    .safeParse(result.map((row) => withRevealedIds(row)));
  if (!parsed.success) {
    throw new DatabaseError("validating fetched NPCs", parsed.error);
  }

  return forReader(
    PageType.Npc,
    parsed.data as unknown as NpcItem[],
    scope
  ).map((row) =>
    factionIds !== null && row.faction !== null && !factionIds.has(row.faction)
      ? { ...row, faction: null }
      : row
  );
}
