import { ReactNode } from "react";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";

/**
 * Renders a row's value for a field, using the `getDatum` its `PageMeta`
 * declares — the number `3` becomes "3° Livello", an array of class ids becomes
 * "Mago, Stregone".
 *
 * **Why this exists rather than calling `getDatum` inline.** `PageMeta` is a
 * discriminated union on `fieldType` (TD-08), so `getDatum` has a different
 * signature per variant. Reached through a *literal* key the compiler picks
 * one, which is what the four hand-written lists did. Reached through a
 * variable key it is a union of functions, and TypeScript intersects their
 * parameters down to `never` — so no value can be passed at all.
 *
 * The assertion below is the one place that is resolved. It is sound by
 * construction: `fieldKey` names both the metadata entry and the column the
 * value was read from, so the value is always what that variant's `getDatum`
 * expects. Confining it here means a generic component needs none of its own.
 */
export default function renderFieldValue(
  fieldKey: MetaConfigKey,
  value: unknown
): ReactNode {
  const getDatum = pageMetaFields[fieldKey].getDatum as (
    datum: unknown
  ) => ReactNode;

  return getDatum(value);
}
