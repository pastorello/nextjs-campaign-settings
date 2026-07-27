import FormField from "./FormField";

/**
 * What every form control receives (TD-08 step 4).
 *
 * `InputComponent` picks a control out of `controlComponents` by `ControlType`
 * and spreads a `FormField` into it, plus the field's name as both `name` and
 * `id`. The registry used to be typed `ComponentType<any>` because the four
 * controls disagreed about `value` — one wanted a `string`, one a `boolean`,
 * one a `SelectValueType` — and no honest type covers all three at once.
 *
 * They all take `MetaValue` now and narrow it themselves, which they were
 * doing at runtime anyway: `CheckboxInput` already compared `value === true`
 * defensively, and `Select` already handled being handed an array.
 */
export default interface ControlProps extends FormField {
  name: string;
  id: string;
}
