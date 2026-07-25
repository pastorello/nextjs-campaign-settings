import { DEFAULT_ITEMS_PER_PAGE } from "../config/constants";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import { SearchParamsInput } from "./validateParams";
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
  crudFunction: Countable
): Promise<ItemCount> {
  const { where } = getQuery(await searchParams, enabledMeta);

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
