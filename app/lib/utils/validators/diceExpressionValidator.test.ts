import { describe, expect, it } from "vitest";

import diceExpressionValidator from "./diceExpressionValidator";

describe("diceExpressionValidator (SPEC-028 §5)", () => {
  const validator = diceExpressionValidator();

  it.each([
    ["2d8+3", "2d8+3"],
    ["d12", "d12"],
    ["6", "6"],
    ["1d20-1", "1d20-1"],
    ["2D8 + 3", "2d8+3"],
    ["3d4", "3d4"],
  ])("accepts %s, stored as %s", (raw, stored) => {
    expect(validator.parse(raw)).toBe(stored);
  });

  it.each(["", "d", "2d", "d7", "2d100", "0d6", "2d8+", "2d8*2", "x", "-3"])(
    "refuses %j with the key that lists the forms",
    (raw) => {
      const result = validator.safeParse(raw);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("diceExpression");
    }
  );
});
