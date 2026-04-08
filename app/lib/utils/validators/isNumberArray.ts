export default function isNumberArray(arr: unknown): arr is number[] {
  return Array.isArray(arr) && arr.every((item) => typeof item === "number");
}
