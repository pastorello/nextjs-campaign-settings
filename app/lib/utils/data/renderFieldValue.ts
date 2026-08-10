import { ReactNode } from "react";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";
import { MetaDisplayValue } from "@/app/lib/definitions/interfaces/meta/PageMeta";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import resolveFieldValue from "./resolveFieldValue";

type Translator = (key: string) => string;

/**
 * Renders a row's value for a field, resolving through `resolveFieldValue` —
 * the number `3` becomes "3° Livello", an array of class ids becomes
 * "Mago, Stregone". `bundle` is only read for a table-backed field
 * (SPEC-006 T7); every other field ignores it, same as `resolveFieldValue`.
 */
export default function renderFieldValue(
  fieldKey: MetaConfigKey,
  value: unknown,
  t: Translator,
  bundle?: OptionBundle
): ReactNode {
  return resolveFieldValue(
    pageMetaFields[fieldKey],
    value as MetaDisplayValue,
    t,
    undefined,
    bundle
  );
}
