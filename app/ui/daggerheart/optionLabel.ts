import SelectOption from "@/app/lib/definitions/types/SelectOption";

/**
 * A stored vocabulary value's label, through its option list (ADR-0007:
 * resolved at the render boundary); the raw value when no option matches,
 * so a renamed member shows rather than vanishes.
 */
export default function optionLabel<TValue extends string | number>(
  options: readonly SelectOption<TValue>[],
  value: string | number,
  t: (key: string) => string
): string {
  const option = options.find((candidate) => candidate.value === value);
  return option ? t(option.labelKey) : String(value);
}
