import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import Spell from "../../definitions/interfaces/spells/Spell";
import { buildResultSchema } from "../validation/buildEntitySchema";

export async function fetchFilteredSpells(
  searchParams: SearchParamsInput
): Promise<Spell[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.spellsWhereInput>(
    theParams,
    queryFields[PageType.Spell]
  );

  let result;
  try {
    result = await prisma.spells.findMany(theQuery);
  } catch (error) {
    throw toDatabaseError("fetching spells", error);
  }

  const parsed = z.array(buildResultSchema(PageType.Spell)).safeParse(result);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched spells", parsed.error);
  }

  // buildResultSchema is built from a ZodRawShape, which widens the inferred
  // key types — the same reason buildCreateSchema's callers need one too.
  return parsed.data as unknown as Spell[];
}
