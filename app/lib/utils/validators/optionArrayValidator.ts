import { z } from "zod";

import SelectOption from "@/app/lib/definitions/types/SelectOption";

/**
 * Zod schema for an option-backed multiselect field (TD-61): every element
 * must be one of the option list's declared `value`s. See
 * `optionValueValidator` for the scalar equivalent.
 */
export default function optionArrayValidator(options: SelectOption<number>[]) {
  const allowedValues = new Set(options.map((option) => option.value));
  return z
    .array(z.number().int())
    .refine((values) => values.every((value) => allowedValues.has(value)));
}
