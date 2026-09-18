/**
 * Whether `value` could be a row id: a positive whole number. For the ids
 * a Server Action takes as a bare argument, which no schema has checked.
 */
export default function isPositiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
