"use client";

import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import QueryParam from "../definitions/interfaces/pages/QueryParam";
import MetaValue from "../definitions/types/MetaValue";
import SelectValueType from "../definitions/types/SelectValueType";
import SortOrder from "../definitions/types/SortOrder";
import getSearchParam from "../utils/data/getSearchParam";
import MetaConfigKey from "../definitions/types/MetaConfigKey";

const useFilterController = (fieldKey: MetaConfigKey) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const sortParam = searchParams.get("sort");
  const queryValue = getSearchParam(
    fieldKey,
    searchParams.get(fieldKey)
  ) as SelectValueType;

  const sortValue =
    sortParam === SortOrder.desc ? SortOrder.desc : SortOrder.asc;
  const isActive = queryValue !== null;

  const setSearchParams = (
    queryTerms: QueryParam[],
    searchParams: ReadonlyURLSearchParams
  ) => {
    const params = new URLSearchParams(searchParams);

    queryTerms.forEach((item: QueryParam) => {
      if (item.value && Number(item.value) !== -1) {
        params.set(item.term, item.value);
        params.set("page", "1");
      } else {
        params.delete(item.term);
      }
    });

    replace(`${pathname}?${params.toString()}`);
  };

  // MetaValue rather than SelectValueType: this is handed straight to a
  // <Select>, and every control takes MetaValue since TD-08 step 4. The value
  // is stringified for the URL either way.
  const onFilter = (aValue: MetaValue) => {
    setSearchParams([{ term: fieldKey, value: String(aValue) }], searchParams);
  };

  return {
    onFilter,
    sortValue,
    isActive,
    filterValue: queryValue,
  };
};

export default useFilterController;
