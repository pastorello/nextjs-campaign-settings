import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhArmor from "@/app/lib/definitions/interfaces/daggerheart/DhArmor";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

/**
 * A page of Daggerheart armor (SPEC-029 T3), with their image keys. A
 * rules catalogue: every reader sees every row (SPEC-022 R14).
 */
export async function fetchFilteredDhArmor(
  searchParams: SearchParamsInput
): Promise<DhArmor[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhArmorWhereInput>(
    theParams,
    queryFields[PageType.DhArmor]
  );

  let armor;
  try {
    armor = await prisma.dhArmor.findMany({
      ...theQuery,
      include: recordImageKeysInclude,
    });
  } catch (error) {
    throw toDatabaseError("fetching armor", error);
  }

  const parsed = z.array(buildResultSchema(PageType.DhArmor)).safeParse(armor);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched armor", parsed.error);
  }

  return parsed.data as unknown as DhArmor[];
}
