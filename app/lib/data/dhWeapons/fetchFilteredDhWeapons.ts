import { z } from "zod";
import queryFields from "@/app/lib/config/queryFields";
import PageType from "@/app/lib/definitions/types/PageType";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import DhWeapon from "@/app/lib/definitions/interfaces/daggerheart/DhWeapon";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import { buildResultSchema } from "../validation/buildEntitySchema";

/**
 * A page of Daggerheart weapons (SPEC-029 T2), with their image keys. A
 * rules catalogue: every reader sees every row (SPEC-022 R14).
 */
export async function fetchFilteredDhWeapons(
  searchParams: SearchParamsInput
): Promise<DhWeapon[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.dhWeaponWhereInput>(
    theParams,
    queryFields[PageType.DhWeapon]
  );

  let weapons;
  try {
    weapons = await prisma.dhWeapon.findMany({
      ...theQuery,
      include: recordImageKeysInclude,
    });
  } catch (error) {
    throw toDatabaseError("fetching weapons", error);
  }

  const parsed = z
    .array(buildResultSchema(PageType.DhWeapon))
    .safeParse(weapons);
  if (!parsed.success) {
    throw new DatabaseError("validating fetched weapons", parsed.error);
  }

  return parsed.data as unknown as DhWeapon[];
}
