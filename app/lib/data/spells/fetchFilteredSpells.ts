import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import Spell from "../../definitions/interfaces/spells/Spell";

export async function fetchFilteredSpells(
  searchParams: SearchParamsInput
): Promise<Spell[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.spellsWhereInput>(
    theParams,
    queryFields[PageType.Spell]
  );

  try {
    const result = await prisma.spells.findMany(theQuery);
    return result as Spell[];
  } catch (error) {
    throw toDatabaseError("fetching spells", error);
  }
}
