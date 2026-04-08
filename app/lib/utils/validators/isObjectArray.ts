export default function isObjectArray(arr: unknown): arr is object[] {
  return (
    Array.isArray(arr) &&
    arr.every((item) => typeof item === "object" && item !== null)
  );
}
