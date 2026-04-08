const isArrayEmpty = (arr: unknown) => !Array.isArray(arr) || arr.length === 0;

export default isArrayEmpty;
