import SelectOption from "../../definitions/types/SelectOption";
import isKeyOfItem from "../validators/isKeyOfItem";
import isValidDataArray from "../validators/isValidDataArray";
import isValidString from "../validators/isValidString";

const getDataLabel = (
  optionsList: SelectOption[],
  value: string | number | number[],
  customLabel?: string
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
            isValidString(customLabel) && isKeyOfItem(customLabel, item)
              ? item[customLabel]
              : item.label
          }`,
        ""
      ) || ""
    );
  }
  return "";
};

export default getDataLabel;
