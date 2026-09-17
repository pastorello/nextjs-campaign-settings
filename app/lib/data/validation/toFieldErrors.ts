import type { z } from "zod";

import FieldErrorKey, {
  FIELD_ERROR_KEYS,
} from "../../definitions/types/FieldErrorKey";
import type FieldErrorMessage from "../../definitions/types/FieldErrorMessage";
import type FieldErrors from "../../definitions/types/FieldErrors";

type ZodIssue = z.core.$ZodIssue;

const knownKeys: ReadonlySet<string> = new Set(FIELD_ERROR_KEYS);

const isFieldErrorKey = (value: string): value is FieldErrorKey =>
  knownKeys.has(value);

/**
 * Maps one Zod issue to a catalogue key. A schema that wants a specific
 * message passes the key itself as its custom `message`; anything else —
 * including every Zod default message, which is English prose — is replaced
 * by a key derived from the issue's code and parameters.
 */
function toFieldErrorMessage(issue: ZodIssue): FieldErrorMessage {
  if (isFieldErrorKey(issue.message)) return { key: issue.message };

  switch (issue.code) {
    case "invalid_type":
      return { key: "invalidType" };
    case "invalid_format":
      return { key: "invalidFormat" };
    case "invalid_value":
      return { key: "invalidOption" };
    case "not_multiple_of":
      return {
        key: "notMultipleOf",
        values: { divisor: Number(issue.divisor) },
      };
    case "unrecognized_keys":
      return { key: "unrecognizedKeys" };
    case "too_small": {
      const minimum = Number(issue.minimum);
      if (issue.origin === "string") {
        return { key: "tooShort", values: { minimum } };
      }
      if (issue.origin === "array" || issue.origin === "set") {
        return { key: "tooFewItems", values: { minimum } };
      }
      return {
        key: issue.inclusive === false ? "tooSmallExclusive" : "tooSmall",
        values: { minimum },
      };
    }
    case "too_big": {
      const maximum = Number(issue.maximum);
      if (issue.origin === "string") {
        return { key: "tooLong", values: { maximum } };
      }
      if (issue.origin === "array" || issue.origin === "set") {
        return { key: "tooManyItems", values: { maximum } };
      }
      return {
        key: issue.inclusive === false ? "tooBigExclusive" : "tooBig",
        values: { maximum },
      };
    }
    default:
      return { key: "invalid" };
  }
}

/**
 * A failed `safeParse`'s field errors as message keys (TD-124) — the
 * replacement for `error.flatten().fieldErrors`, grouped the same way: by
 * the issue path's first segment, in issue order. Path-less (form-level)
 * issues are dropped, exactly as `fieldErrors` dropped them, so a
 * cross-field `.refine()` must name a `path` to be seen.
 */
export default function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: Record<string, FieldErrorMessage[]> = {};
  for (const issue of error.issues) {
    if (issue.path.length === 0) continue;
    const field = String(issue.path[0]);
    (errors[field] ??= []).push(toFieldErrorMessage(issue));
  }
  return errors;
}
