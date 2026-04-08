import Indexable from "../../definitions/types/Indexable";
import SelectValueType from "../../definitions/types/SelectValueType";
import isValidDataArray from "../validators/isValidDataArray";
import isValidString from "../validators/isValidString";

type MetaFilter = {
  metaField: string;
  value: SelectValueType;
  fieldType: string;
};

const filterByMeta = (
  list: Indexable[],
  searchTerm: string,
  termKey: string,
  meta: MetaFilter[] = []
): Indexable[] => {
  const validMetaFilters: MetaFilter[] = meta.filter((item) =>
    Array.isArray(item.value)
      ? (item.value as unknown[]).length > 0
      : Number(item.value) > -1
  );

  const parsedList: Indexable[] =
    isValidString(searchTerm) || isValidDataArray(validMetaFilters)
      ? list.filter((item: Indexable): boolean => {
          const itemName = isValidString(item[termKey])
            ? (item[termKey] as string)
            : "";
          const matchesTerm =
            !isValidString(searchTerm) ||
            itemName.toLowerCase().includes(searchTerm.toLowerCase()) === true;

          const matchesMeta = validMetaFilters.reduce((acc, item2) => {
            const fieldArray: number[] = (() => {
              const value = item[item2.metaField];
              if (
                Array.isArray(value) &&
                value.every((val): val is number => typeof val === "number")
              ) {
                return value;
              }
              return typeof value === "number" && value > -1 ? [value] : [];
            })();

            const matchesFilter =
              item2.fieldType === "array"
                ? fieldArray.some((item3) => item3 === Number(item2.value))
                : String(item[item2.metaField]) === String(item2.value);
            return matchesFilter ? acc : false;
          }, true as boolean);

          return matchesTerm && matchesMeta;
        })
      : list;

  return parsedList;
};

export default filterByMeta;
