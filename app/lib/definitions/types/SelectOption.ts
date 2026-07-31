/**
 * One choice in a select or multiselect, authored form.
 *
 * Generic over the value type so a numeric options list can declare
 * `SelectOption<number>[]` and have `options[0].value` narrow to `number` —
 * which is what lets an integer field derive its `defaultValue` from its own
 * options without a cast. The default keeps every existing `SelectOption[]`
 * annotation working unchanged.
 */
interface SelectOption<TValue extends string | number = string | number> {
  labelKey: string;
  shortLabelKey?: string;
  value: TValue;
}

/**
 * One choice in a select or multiselect, after message resolution.
 * Created by resolveOptions(). This is what sortSelectOptions and getDataLabel accept.
 */
interface ResolvedOption<TValue extends string | number = string | number> {
  label: string;
  shortLabel?: string;
  value: TValue;
}

export default SelectOption;
export type { ResolvedOption };
