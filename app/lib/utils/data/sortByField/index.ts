import Indexable from "@/app/lib/definitions/types/Indexable";
import PrimitiveValue from "@/app/lib/definitions/types/PrimitiveValue";
import SortOrder from "@/app/lib/definitions/types/SortOrder";
import isValidDataObject from "../../validators/isValidDataObject";
import isValidString from "../../validators/isValidString";
import isValidFunction from "../../validators/isValidFunction";
import isValidDataArray from "../../validators/isValidDataArray";
import createEmptyArray from "../createEmptyArray";

interface SortConfig {
  order: SortOrder;
  isCaseSentitive: boolean;
  sortedValues: any[];
  fieldGetter: (item: Indexable, field: string) => string | number | boolean;
  fieldName?: string;
}

const getDefaultConfig = (customConfig?: Partial<SortConfig>): SortConfig => ({
  order: SortOrder.asc,
  isCaseSentitive: false,
  sortedValues: [],
  fieldGetter: (item: Indexable, field: string): PrimitiveValue =>
    (item[field] as PrimitiveValue) || "",
  ...(isValidDataObject(customConfig)
    ? (customConfig as Partial<SortConfig>)
    : {}),
});

const getElement = (
  anElement: Indexable | PrimitiveValue,
  config: SortConfig
): string | number => {
  let theElement =
    isValidString(config.fieldName) &&
    isValidDataObject(anElement) &&
    isValidFunction(config.fieldGetter)
      ? config.fieldGetter(anElement as Indexable, config.fieldName as string)
      : anElement;

  if (isValidString(theElement) && config.isCaseSentitive !== true) {
    theElement = (theElement as string).toLowerCase();
  }

  return theElement as string | number;
};

const sortByField = <T extends Indexable[] | number[] | string[]>(
  list: T,
  fieldName?: string,
  extraConfig?: Partial<SortConfig>
): T => {
  const config = getDefaultConfig({ fieldName, ...extraConfig });

  if (!isValidDataArray(list)) return createEmptyArray(list);

  const sortedList = [...list].sort((item1, item2) => {
    const sortCriteria = config.order === SortOrder.asc ? 1 : -1;

    let firstElement = getElement(item1, config);
    let secondElement = getElement(item2, config);

    //Give an array of possible values, define your custom sort order
    if (isValidDataArray(config.sortedValues)) {
      firstElement = config.sortedValues.indexOf(firstElement);
      secondElement = config.sortedValues.indexOf(secondElement);
    }

    if (firstElement === secondElement) {
      return 0;
    }
    if (firstElement < secondElement) {
      return -sortCriteria;
    }
    return sortCriteria;
  });

  return sortedList as T;
};

export default sortByField;
