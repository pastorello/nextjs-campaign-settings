import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "../../connections/prisma";
import NpcItem from "../../definitions/interfaces/npc/NpcItem";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";

export async function fetchFilteredNpc(
  searchParams: SearchParamsInput
): Promise<NpcItem[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.npcWhereInput>(
    theParams,
    queryFields[PageType.Npc]
  );

  try {
    const result = await prisma.npc.findMany(theQuery);
    return result as NpcItem[];
  } catch (error) {
    throw toDatabaseError("fetching NPCs", error);
  }
}
