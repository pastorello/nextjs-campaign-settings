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
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import Deity from "../../definitions/interfaces/deities/Deity";
import { buildResultSchema } from "../validation/buildEntitySchema";
import buildLocationWhere from "../maps/buildLocationWhere";
import applyLocationSort from "../maps/applyLocationSort";

export async function fetchFilteredDeities(
  searchParams: SearchParamsInput
): Promise<Deity[]> {
  // SPEC-022 T8b (R3): a player gets the records revealed to their
  // campaign, without the DM-only fields.
  const scope = await getVisibilityScope();
  const { params, fields } = readerQueryInput(
    PageType.Deity,
    await searchParams,
    scope
  );
  const theQuery = getQuery<Prisma.deitiesWhereInput>(params, fields);

  let result;
  try {
    result = await prisma.deities.findMany({
      where: andWhere(
        await buildLocationWhere(theQuery.where, params, scope),
        revealedWhere(scope)
      ),
      orderBy: applyLocationSort(theQuery.orderBy),
      skip: theQuery.skip,
      take: theQuery.take,
      // SPEC-022 T6: the campaigns each record is revealed to.
      include: { ...recordImageKeysInclude, ...revealedToInclude },
    });
  } catch (error) {
    throw toDatabaseError("fetching deities", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.Deity))
    .safeParse(result.map((row) => withRevealedIds(row)));
  if (!parsed.success) {
    throw new DatabaseError("validating fetched deities", parsed.error);
  }

  return forReader(PageType.Deity, parsed.data as unknown as Deity[], scope);
}
