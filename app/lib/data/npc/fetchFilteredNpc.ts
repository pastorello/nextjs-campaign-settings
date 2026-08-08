import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import prisma from "../../connections/prisma";
import NpcItem from "../../definitions/interfaces/npc/NpcItem";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";
import buildLocationWhere from "../maps/buildLocationWhere";
import applyLocationSort from "../maps/applyLocationSort";

export async function fetchFilteredNpc(
  searchParams: SearchParamsInput
): Promise<NpcItem[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.npcWhereInput>(
    theParams,
    queryFields[PageType.Npc]
  );

  let result;
  try {
    result = await prisma.npc.findMany({
      where: await buildLocationWhere(theQuery.where, theParams),
      orderBy: applyLocationSort(theQuery.orderBy),
      skip: theQuery.skip,
      take: theQuery.take,
    });
  } catch (error) {
    throw toDatabaseError("fetching NPCs", error);
  }

  const parsed = z.array(buildResultSchema(PageType.Npc)).safeParse(result);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched NPCs", parsed.error);
  }

  return parsed.data as unknown as NpcItem[];
}
