import { describe, expect, it } from "vitest";

import optionValueValidator from "@/app/lib/utils/validators/optionValueValidator";
import treasureCategories from "./treasure-categories";

/**
 * `treasure.category` is an option-backed `Int` field, "like magicitems.type"
 * (SPEC-013 §6) — so membership is checked the same way `MagicItemType`'s
 * options are, via the existing `optionValueValidator` (TD-61), not a
 * bespoke check.
 */
describe("treasureCategories membership validator", () => {
  const validator = optionValueValidator(treasureCategories);

  it.each(treasureCategories.map((option) => option.value))(
    "accepts the valid option value %i",
    (value) => {
      expect(validator.safeParse(value).success).toBe(true);
    }
  );

  it("rejects a value absent from the option list", () => {
    expect(validator.safeParse(999).success).toBe(false);
  });

  it("rejects a non-integer", () => {
    expect(validator.safeParse(1.5).success).toBe(false);
  });
});
