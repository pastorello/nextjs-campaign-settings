import { z } from "zod";

/**
 * Zod schema for an "unset is not zero" nullable amount field (TD-130): a
 * blank input (`""`, `undefined`) is preprocessed to `null` rather than
 * coerced to `0`, so the field can render "—" for "nothing recorded"
 * instead of reading as a real zero. Every `TextInput` emits a string, so
 * a blank box reaches this as `""`.
 *
 * Previously four separate local copies (`sceneMeta.xpAward`,
 * `sceneCreatureMeta.level`/`xpEach`, `lootMeta.value`,
 * `adventureMeta`'s four budget targets) plus `treasureMeta.value`'s same
 * logic written out inline — see TD-130.
 */
export default function nullableAmountValidator() {
  return z.preprocess(
    (raw) => (raw === "" || raw === undefined ? null : raw),
    z.coerce.number().int().gte(0).nullable()
  );
}
