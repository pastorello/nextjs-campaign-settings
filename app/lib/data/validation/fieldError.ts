import type FieldErrorKey from "../../definitions/types/FieldErrorKey";
import type FieldErrorMessage from "../../definitions/types/FieldErrorMessage";

/**
 * Builds one key-based field refusal (TD-124) — what the data layer writes
 * into an `errors` map instead of an English sentence.
 */
export default function fieldError(
  key: FieldErrorKey,
  values?: Record<string, string | number>
): FieldErrorMessage {
  return values === undefined ? { key } : { key, values };
}
