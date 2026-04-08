const isValidFunction = (f: unknown): f is Function => typeof f === "function";

export default isValidFunction;
