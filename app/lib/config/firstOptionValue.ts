/**
 * The value of a select's first option — every field's declared default.
 *
 * **Why a helper for `list[0].value`.** Under `noUncheckedIndexedAccess`
 * (TD-20b) an index read is `T | undefined`, correctly: `T[]` does not promise
 * a first element. The option lists always have one, so nineteen `defaultValue`
 * declarations became "possibly undefined" for a reason that is true of the
 * type and false of the data.
 *
 * The alternative was annotating all nineteen lists as non-empty tuples. That
 * was tried and rejected: a blanket annotation silently *widened* several of
 * them — a list of numeric options declared as `SelectOption` rather than
 * `SelectOption<number>` turns `defaultValue` into `string | number` and breaks
 * the `PageMeta` discriminated union that TD-08 built. Preserving each element
 * type by hand across nineteen files is a lot of surface for no extra safety.
 *
 * So: one assertion, in one place, with the reason attached. The lists are
 * literals defined in this directory with entries visible on the page; an empty
 * one would break the select long before it broke this.
 */
export default function firstOptionValue<T extends { value: unknown }>(
  options: readonly T[]
): T["value"] {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- see above
  return options[0]!.value;
}
