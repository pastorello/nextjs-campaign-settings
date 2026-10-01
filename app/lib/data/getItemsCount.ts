import { DEFAULT_ITEMS_PER_PAGE } from "../config/constants";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import { RawSearchParams, SearchParamsInput } from "./validateParams";
import type { WhereClause } from "../definitions/types/QueryClauses";
import getQuery from "./getQuery";
import { andWhere } from "./visibility/readerQuery";

export interface ItemCount {
  total: number;
  filtered: number;
  totalPages: number;
  filteredPages: number;
}

/** The slice of a Prisma model delegate this needs: a `count` that takes a where. */
interface Countable {
  count(args?: { where?: object }): Promise<number>;
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
  ) => Promise<WhereClause>,
  // SPEC-022 T8b: the rows the reader may see at all (`revealedWhere`).
  // Both counts are taken within it: a player's total must not count the
  // records their campaign has not been shown.
  scopeWhere: object = {}
): Promise<ItemCount> {
  const rawSearchParams = await searchParams;
  const { where: baseWhere } = getQuery(rawSearchParams, enabledMeta);
  const where = applyWhere
    ? await applyWhere(baseWhere, rawSearchParams)
    : baseWhere;

  const scoped = Object.keys(scopeWhere).length > 0;
  const total = scoped
    ? await crudFunction.count({ where: scopeWhere })
    : await crudFunction.count();
  const filtered = await crudFunction.count({
    where: andWhere(where, scopeWhere),
  });

  const result: ItemCount = {
    total,
    filtered,
    totalPages: Math.ceil(total / DEFAULT_ITEMS_PER_PAGE),
    filteredPages: Math.ceil(filtered / DEFAULT_ITEMS_PER_PAGE),
  };

  return result;
}
