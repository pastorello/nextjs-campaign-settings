import { ReactNode } from "react";

import PageMeta, {
  MetaDisplayValue,
} from "@/app/lib/definitions/interfaces/meta/PageMeta";
import FieldType from "@/app/lib/definitions/types/FieldType";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import getDataLabel from "./getDataLabel";
import resolveOptions from "./resolveOptions";

// A translator, as returned by both next-intl's `useTranslations` (client)
// and `await getTranslations` (server).
type Translator = (key: string) => string;

/**
 * Renders a field's value for display: resolves through the request's
 * `bundle` when `optionTable` is declared, then through its static
 * `options` when present, then a plain boolean's generic "Yes"/"No" when
 * none of those apply, otherwise falls back to the field's own `getDatum`
 * for fields that genuinely format (rich text, identity, or a boolean whose
 * display isn't a plain yes/no).
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
  useShort?: boolean,
  bundle?: OptionBundle
): ReactNode => {
  if (meta.optionTable !== undefined) {
    // No selection is a legitimate value (SPEC-006 decision 8) — an em dash
    // says "none", distinguishable from "" (a rendering gap, below).
    if (value === null) {
      return "—";
    }
    // No bundle, or the table it names wasn't resolved for this request:
    // degrade to a blank label, the same fallback an unmatched static option
    // already gets from `getDataLabel` — never throw for a rendering gap.
    const options = bundle?.[meta.optionTable];
    if (options === undefined) {
      return "";
    }
    return getDataLabel(options, value as string | number | number[], useShort);
  }
  if (meta.options !== undefined) {
    return getDataLabel(
      resolveOptions(meta.options, t),
      value as string | number | number[],
      useShort
    );
  }
  if (meta.getDatum) {
    return meta.getDatum(value, useShort);
  }
  if (meta.fieldType === FieldType.boolean) {
    return t(value === true ? "common.boolean.yes" : "common.boolean.no");
  }
  return String(value);
};

export default resolveFieldValue;
