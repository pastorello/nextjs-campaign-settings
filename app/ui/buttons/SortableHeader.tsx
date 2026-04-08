"use client";

import { useDebouncedCallback } from "use-debounce";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import SortOrder from "@/app/lib/definitions/types/SortOrder";
import SortButton from "../buttons/SortButton";
import Select from "../forms/inputs/Select";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import isValidDataArray from "@/app/lib/utils/validators/isValidDataArray";
import getSearchParam from "@/app/lib/utils/data/getSearchParam";
import SelectValueType from "@/app/lib/definitions/types/SelectValueType";
import QueryParam from "@/app/lib/definitions/interfaces/pages/QueryParam";

interface SortableHeaderProps {
  label: string;
  fieldKey: string;
  isSortable?: boolean;
  isFiltrable?: boolean;
}

const SortableHeader = ({
  label,
  fieldKey,
  isSortable = true,
  isFiltrable = true,
}: SortableHeaderProps) => {
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
  const defaultOption = { value: -1, label: label };
  let LabelComponent = <span>{label}</span>;

  const setSearchParams = useDebouncedCallback(
    (queryTerms: QueryParam[], searchParams) => {
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
    },
    300
  );

  const onFilter = (aValue: SelectValueType) => {
    setSearchParams([{ term: fieldKey, value: String(aValue) }], searchParams);
  };
  const onSort = () => {
    setSearchParams(
      [
        {
          term: "sort",
          value: sortValue === SortOrder.asc ? SortOrder.desc : SortOrder.asc,
        },
        {
          term: "fieldSort",
          value: JSON.stringify({
            [fieldKey]:
              sortValue === SortOrder.asc ? SortOrder.desc : SortOrder.asc,
          }),
        },
      ],
      searchParams
    );
  };

  if (isFiltrable === true) {
    const filterConfig = pageMetaFields[fieldKey];
    const filterOptions =
      filterConfig && isValidDataArray(filterConfig.options)
        ? filterConfig.options
        : [];

    const filterProps = {
      value: isActive ? queryValue : -1,
      onChange: onFilter,
      options: [defaultOption, ...filterOptions],
    };

    LabelComponent = <Select {...filterProps} />;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">{LabelComponent}</div>
      {isSortable === true && (
        <div className="w-[30px] shrink-0">
          <SortButton
            sortOrder={sortValue}
            onClick={onSort}
            isActive={isActive}
          />
        </div>
      )}
    </div>
  );
};

export default SortableHeader;
