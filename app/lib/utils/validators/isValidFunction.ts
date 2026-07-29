const isValidFunction = (f: unknown): f is (...args: unknown[]) => unknown =>
  typeof f === "function";

export default isValidFunction;
