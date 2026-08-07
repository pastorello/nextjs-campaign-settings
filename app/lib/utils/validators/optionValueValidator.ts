import { z } from "zod";

import SelectOption from "@/app/lib/definitions/types/SelectOption";

/**
 * Zod schema for an option-backed `Int` field (TD-61): an integer that must
 * also be one of the option list's declared `value`s. Membership is checked
 * against the list at call time, so a field can never be declared with a
 * validator that accepts a number the option list doesn't offer.
 */
export default function optionValueValidator(options: SelectOption<number>[]) {
  const allowedValues = new Set(options.map((option) => option.value));
  return z
    .number()
    .int()
    .refine((value) => allowedValues.has(value));
}
