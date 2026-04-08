import { DEFAULT_ITEMS_PER_PAGE } from "../config/constants";
import ListItem from "../definitions/interfaces/ListItem";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import getQuery from "./getQuery";

export interface ItemCount {
  total: number;
  filtered: number;
  totalPages: number;
  filteredPages: number;
}

export async function getItemsCount(
  searchParams: Record<string, any>,
  enabledMeta: MetaConfigKey[],
  crudFunction: ListItem
): Promise<{
  total: number;
  filtered: number;
  totalPages: number;
  filteredPages: number;
}> {
  const { where } = getQuery(searchParams, enabledMeta);

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
