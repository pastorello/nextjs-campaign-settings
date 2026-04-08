"use client";

import clsx from "clsx";

import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";

import isValidString from "@/app/lib/utils/validators/isValidString";
import ButtonSize from "./BaseButton/ButtonSize";
import BaseButton from "./BaseButton";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import useFilterController from "@/app/lib/hooks/useFilterController";
import isValidDataArray from "@/app/lib/utils/validators/isValidDataArray";

interface SelectButtoneryProps {
  fieldKey: MetaConfigKey;
  itemStats?: ListItem;
  isFiltered?: boolean;
  omitAllButton?: boolean;
  buttonClassName?: string;
  buttonSize?: ButtonSize;
  filterOptions?: (number | string)[];
}

const getOptionsList = (
  fieldKey: MetaConfigKey,
  filterOptions?: (number | string)[]
) => {
  const optionsList = pageMetaFields[fieldKey].options ?? [];

  return isValidDataArray(filterOptions)
    ? optionsList.filter((option) => {
        const hasOption = !filterOptions.includes(option.value);
        return !hasOption;
      })
    : optionsList;
};

const SelectButtonery = ({
  fieldKey,
  itemStats,
  isFiltered = false,
  omitAllButton = false,
  buttonClassName,
  buttonSize = ButtonSize.medium,
  filterOptions,
}: SelectButtoneryProps) => {
  const optionsList = getOptionsList(fieldKey, filterOptions);
  const { onFilter, isActive, filterValue } = useFilterController(fieldKey);

  return (
    <>
      {!omitAllButton && (
        <BaseButton
          className={clsx(
            isValidString(buttonClassName)
              ? buttonClassName
              : "mb-2 w-full text-center",
            {
              "bg-violet-700": !isActive,
            }
          )}
          key={-1}
          onClick={() => onFilter(-1)}
          size={buttonSize}
        >
          {buttonSize === ButtonSize.squaredSmall ? (
            <>
              <div>Tutti</div>
              <div>{itemStats && `(${itemStats.total})`}</div>
            </>
          ) : itemStats ? (
            `Tutti (${itemStats.total})`
          ) : (
            "Tutti"
          )}
        </BaseButton>
      )}
      {optionsList.map((item) => (
        <BaseButton
          className={clsx(
            isValidString(buttonClassName)
              ? buttonClassName
              : "mb-2 w-full text-center",
            {
              "bg-violet-700": item.value === filterValue,
            }
          )}
          key={item.value}
          onClick={() => onFilter(item.value)}
          size={buttonSize}
        >
          {buttonSize === ButtonSize.squaredSmall ? (
            <>
              <div>{item.label}</div>
              <div>
                {itemStats &&
                  `(${
                    filterValue !== -1 && !isFiltered
                      ? itemStats.partial[item.value]
                      : itemStats.filtered[item.value]
                  })`}
              </div>
            </>
          ) : (
            `${item.label} ${
              itemStats
                ? `(
          ${
            filterValue !== -1 && !isFiltered
              ? itemStats.partial[item.value]
              : itemStats.filtered[item.value]
          }
          )`
                : ""
            }`
          )}
        </BaseButton>
      ))}
    </>
  );
};

export default SelectButtonery;
