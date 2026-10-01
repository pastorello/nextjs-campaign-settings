import { z } from "zod";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import revealedToInclude from "@/app/lib/data/visibility/revealedToInclude";
import withRevealedIds from "@/app/lib/data/visibility/withRevealedIds";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import revealedWhere from "@/app/lib/data/visibility/revealedWhere";
import {
  andWhere,
  forReader,
  readerQueryInput,
} from "@/app/lib/data/visibility/readerQuery";
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
  // SPEC-022 T8b (R4): a player gets the records revealed to their
  // campaign, without the DM-only fields.
  const scope = await getVisibilityScope();
  const { params, fields } = readerQueryInput(
    PageType.MagicItem,
    await searchParams,
    scope
  );
  const theQuery = getQuery<Prisma.magicitemsWhereInput>(params, fields);

  let magicItems;
  try {
    magicItems = await prisma.magicitems.findMany({
      ...theQuery,
      where: andWhere(theQuery.where, revealedWhere(scope)),
      // SPEC-022 T6: the campaigns each record is revealed to.
      include: { ...recordImageKeysInclude, ...revealedToInclude },
    });
  } catch (error) {
    throw toDatabaseError("fetching magic items", error);
  }

  // `attuned` is nullable in the DB; buildResultSchema's null-to-default
  // fallback replaces the `attuned === true` coercion this used to do by hand.
  const parsed = z
    .array(buildResultSchema(PageType.MagicItem))
    .safeParse(
      magicItems.map((row) => withRevealedIds(row, "revealedToDnd5e"))
    );
  if (!parsed.success) {
    throw new DatabaseError("validating fetched magic items", parsed.error);
  }

  return forReader(
    PageType.MagicItem,
    parsed.data as unknown as MagicItem[],
    scope
  );
}
