import isValidDataArray from "../validators/isValidDataArray";
import isValidString from "../validators/isValidString";

const parseSerializedArray = (serializedArray: string): number[] => {
  if (isValidString(serializedArray)) {
    let parsedArray = JSON.parse(serializedArray);

    if (isValidDataArray(parsedArray)) {
      parsedArray = parsedArray.map((item) => parseInt(item));
      parsedArray = parsedArray.reduce(
        (acc: number[], item: number) =>
          acc.indexOf(item) > -1 ? acc : [item, ...acc],
        []
      );
      return parsedArray;
    }
  }

  return [];
};

export default parseSerializedArray;
