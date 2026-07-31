import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

export async function fetchFilteredMagicItems(
  searchParams: SearchParamsInput
): Promise<MagicItem[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.magicitemsWhereInput>(
    theParams,
    queryFields[PageType.MagicItem]
  );

  let magicItems;
  try {
    magicItems = await prisma.magicitems.findMany(theQuery);
  } catch (error) {
    throw toDatabaseError("fetching magic items", error);
  }

  // `attuned` is nullable in the DB; buildResultSchema's null-to-default
  // fallback replaces the `attuned === true` coercion this used to do by hand.
  const parsed = z
    .array(buildResultSchema(PageType.MagicItem))
    .safeParse(magicItems);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched magic items", parsed.error);
  }

  return parsed.data as unknown as MagicItem[];
}
