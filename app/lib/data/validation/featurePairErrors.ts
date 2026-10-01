import fieldError from "@/app/lib/data/validation/fieldError";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";

/** A blank optional text, as stored: `null`. */
export const blankToNull = (value: string | null | undefined) =>
  value === undefined ? undefined : value?.trim() ? value : null;

/**
 * A piece of equipment's one feature is a name and a text, or neither
 * (SPEC-029 §6). Refused on the missing half, with `featureNeedsBoth`;
 * the tables' CHECKs hold the same rule. Both values are as they would be
 * stored, blanks already `null`.
 */
export default function featurePairErrors(
  name: string | null,
  text: string | null,
  keys: { name: string; text: string }
): FieldErrors | null {
  if (name !== null && text === null) {
    return { [keys.text]: [fieldError("featureNeedsBoth")] };
  }
  if (name === null && text !== null) {
    return { [keys.name]: [fieldError("featureNeedsBoth")] };
  }
  return null;
}
