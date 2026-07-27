import elementExists from "./elementExists";

const isValidDataArray = (dataArray: unknown): dataArray is unknown[] => {
  return (
    elementExists(dataArray) && Array.isArray(dataArray) && dataArray.length > 0
  );
};

export default isValidDataArray;
