import { ResolvedOption } from "../../definitions/types/SelectOption";
import isValidDataArray from "../validators/isValidDataArray";

const getDataLabel = (
  optionsList: ResolvedOption[],
  value: string | number | number[],
  useShort?: boolean
) => {
  const result = optionsList.filter((item) =>
    isValidDataArray(value)
      ? value.some((item2) => item2 === item.value)
      : item.value === value
  );

  if (isValidDataArray(result)) {
    return (
      result.reduce(
        (acc, item, index) =>
          `${acc}${index !== 0 ? ", " : ""}${
            useShort && item.shortLabel !== undefined
              ? item.shortLabel
              : item.label
          }`,
        ""
      ) || ""
    );
  }
  return "";
};

export default getDataLabel;
