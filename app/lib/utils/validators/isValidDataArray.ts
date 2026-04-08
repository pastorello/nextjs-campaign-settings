import elementExists from "./elementExists";

const isValidDataArray = (dataArray: unknown): dataArray is any[] => {
  return (
    elementExists(dataArray) && Array.isArray(dataArray) && dataArray.length > 0
  );
};

export default isValidDataArray;
