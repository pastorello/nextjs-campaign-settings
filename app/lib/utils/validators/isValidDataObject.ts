import elementExists from "./elementExists";

const isValidDataObject = (dataObject: unknown): dataObject is object => {
  return (
    typeof dataObject === "object" &&
    elementExists(dataObject) &&
    Object.keys(dataObject).length > 0
  );
};

export default isValidDataObject;
