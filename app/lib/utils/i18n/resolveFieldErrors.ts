import type FieldErrors from "../../definitions/types/FieldErrors";

/**
 * A translator rooted at the catalogue's top level, as returned by
 * `useTranslations()` / `await getTranslations()` with no namespace — the
 * shape this bridge is written against, per ADR-0007.
 */
export type ValuesTranslator = (
  key: string,
  values?: Record<string, string | number>
) => string;

const NAMESPACE = "common.fieldErrors";

/**
 * Turns a mutation's key-based field errors into display text (TD-124) —
 * the one place a `FieldErrorMessage` becomes a string. Pure, so it runs
 * under either translator. Fields with no messages are left out.
 */
export default function resolveFieldErrors(
  errors: FieldErrors,
  t: ValuesTranslator
): Record<string, string[]> {
  const resolved: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(errors)) {
    if (!messages || messages.length === 0) continue;
    resolved[field] = messages.map(({ key, values }) =>
      t(`${NAMESPACE}.${key}`, values)
    );
  }
  return resolved;
}

/**
 * The first refusal in `errors`, translated — for a caller that shows one
 * line (a toast, a panel's status) rather than a per-field summary.
 */
export function resolveFirstFieldError(
  errors: FieldErrors,
  t: ValuesTranslator
): string | undefined {
  return Object.values(resolveFieldErrors(errors, t)).flat()[0];
}
