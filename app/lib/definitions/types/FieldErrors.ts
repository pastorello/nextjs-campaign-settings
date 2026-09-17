import type FieldErrorMessage from "./FieldErrorMessage";

/**
 * A mutation's field-keyed refusals — the shape of Zod's
 * `flatten().fieldErrors`, but carrying message keys rather than English
 * prose (TD-124). Produced by `toFieldErrors` or written by hand with
 * `fieldError`; rendered through `resolveFieldErrors`.
 */
type FieldErrors = Record<string, FieldErrorMessage[] | undefined>;

export default FieldErrors;
