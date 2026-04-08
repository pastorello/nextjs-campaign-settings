const isValidString = (theString: unknown): theString is string => {
  return typeof theString === "string" && theString.length > 0;
};

export default isValidString;
