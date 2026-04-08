import { useSearchParams } from "next/navigation";
import pageMetaFields from "../../config/pageMetaFields";
import parseSerializedArray from "./parseSerializedArray";
import FieldType from "../../definitions/types/FieldType";
import isValidString from "../validators/isValidString";
import isValidDataArray from "../validators/isValidDataArray";

const parser: Record<
  FieldType,
  (aValue: string) => string[] | number[] | number | string | boolean
> = {
  integer: (value) => parseInt(value) ?? -1,
  array: (value) => {
    const parsedArray = parseSerializedArray(value);
    if (isValidDataArray(parsedArray)) {
      return parsedArray;
    } else {
      return parseInt(value) ?? [];
    }
  },
  string: (value) => value,
  boolean: (value) => !!value,
};

const getSearchParam = (aMeta: string, aField: string | null) => {
  if (!pageMetaFields[aMeta] || !isValidString(aField)) {
    return null;
  }

  return parser[pageMetaFields[aMeta].fieldType](aField);
};

export default getSearchParam;
