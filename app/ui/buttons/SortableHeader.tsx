"use client";

import { useDebouncedCallback } from "use-debounce";
import { useTranslations } from "next-intl";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import SortOrder from "@/app/lib/definitions/types/SortOrder";
import SortButton from "../buttons/SortButton";
import Select from "../forms/inputs/Select";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import isValidDataArray from "@/app/lib/utils/validators/isValidDataArray";
import getSearchParam from "@/app/lib/utils/data/getSearchParam";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";
import MetaValue from "@/app/lib/definitions/types/MetaValue";
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
  const t = useTranslations();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

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
    (queryTerms: QueryParam[], searchParams: ReadonlyURLSearchParams) => {
      const params = new URLSearchParams(searchParams);

      queryTerms.forEach((item: QueryParam) => {
        if (item.value && Number(item.value) !== -1) {
          params.set(item.term, item.value);
          params.set("page", "1");
        } else {
          params.delete(item.term);
        }
      });

      router.replace(`${pathname}?${params.toString()}`);
    },
    300
  );

  // MetaValue: this goes to a <Select>, and every control takes MetaValue
  // since TD-08 step 4. It is stringified for the URL regardless.
  const onFilter = (aValue: MetaValue) => {
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
    const filterConfig = fieldMeta[fieldKey];
    const filterOptions =
      filterConfig && isValidDataArray(filterConfig.options)
        ? resolveOptions(filterConfig.options, t)
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
            label={label}
          />
        </div>
      )}
    </div>
  );
};

export default SortableHeader;
