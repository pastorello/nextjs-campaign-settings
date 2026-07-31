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
    result = await prisma.npc.findMany(theQuery);
  } catch (error) {
    throw toDatabaseError("fetching NPCs", error);
  }

  const parsed = z.array(buildResultSchema(PageType.Npc)).safeParse(result);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched NPCs", parsed.error);
  }

  return parsed.data as unknown as NpcItem[];
}
