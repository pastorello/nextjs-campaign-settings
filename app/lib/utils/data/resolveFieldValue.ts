import { ReactNode } from "react";

import PageMeta, {
  MetaDisplayValue,
} from "@/app/lib/definitions/interfaces/meta/PageMeta";
import getDataLabel from "./getDataLabel";
import resolveOptions from "./resolveOptions";

// A translator, as returned by both next-intl's `useTranslations` (client)
// and `await getTranslations` (server).
type Translator = (key: string) => string;

/**
 * Renders a field's value for display: resolves through its declared
 * `options` when present, otherwise falls back to the field's own `getDatum`
 * for fields that genuinely format (rich text, booleans, identity).
 *
 * `meta` is typed as the `PageMeta` interface, not the literal registry
 * entry a caller indexed it from — that widening is what lets `getDatum` be
 * called at all: reached through a variable key, the registry's per-field
 * narrowed signatures intersect to `never` (see the note this replaced in
 * `renderFieldValue.ts`), but the interface declares one signature for every
 * variant.
 */
const resolveFieldValue = (
  meta: PageMeta,
  value: MetaDisplayValue,
  t: Translator,
  useShort?: boolean
): ReactNode => {
  if (meta.options !== undefined) {
    return getDataLabel(
      resolveOptions(meta.options, t),
      value as string | number | number[],
      useShort
    );
  }
  return meta.getDatum ? meta.getDatum(value, useShort) : String(value);
};

export default resolveFieldValue;
