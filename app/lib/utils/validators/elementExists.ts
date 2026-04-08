const elementExists = (element: unknown): element is object => {
  return typeof element !== "undefined" && element !== null;
};

export default elementExists;
