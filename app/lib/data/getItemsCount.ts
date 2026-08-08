import { DEFAULT_ITEMS_PER_PAGE } from "../config/constants";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import { RawSearchParams, SearchParamsInput } from "./validateParams";
import type { WhereClause } from "../definitions/types/QueryClauses";
import getQuery from "./getQuery";

export interface ItemCount {
  total: number;
  filtered: number;
  totalPages: number;
  filteredPages: number;
}

/** The slice of a Prisma model delegate this needs: a `count` that takes a where. */
interface Countable {
  count(args?: { where?: WhereClause }): Promise<number>;
}

export async function getItemsCount(
  searchParams: SearchParamsInput,
  enabledMeta: MetaConfigKey[],
  crudFunction: Countable,
  // Layers a domain-specific where transform on top of getQuery's generic
  // equality where — SPEC-008 T6's Zone/POI filter needs this (a tree-walk
  // resolved `IN`, not an equality), which getQuery's mechanism can't
  // express. Optional and identity by default so the other two domains stay
  // exactly as they were.
  applyWhere?: (
    where: WhereClause,
    rawSearchParams: RawSearchParams
  ) => Promise<WhereClause>
): Promise<ItemCount> {
  const rawSearchParams = await searchParams;
  const { where: baseWhere } = getQuery(rawSearchParams, enabledMeta);
  const where = applyWhere
    ? await applyWhere(baseWhere, rawSearchParams)
    : baseWhere;

  const total = await crudFunction.count();
  const filtered = await crudFunction.count({ where });

  const result: ItemCount = {
    total,
    filtered,
    totalPages: Math.ceil(total / DEFAULT_ITEMS_PER_PAGE),
    filteredPages: Math.ceil(filtered / DEFAULT_ITEMS_PER_PAGE),
  };

  return result;
}
