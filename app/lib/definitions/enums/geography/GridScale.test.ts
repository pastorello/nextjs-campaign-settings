import { z } from "zod";
import { describe, expect, it } from "vitest";

import GridScale from "./GridScale";

/**
 * `GridScale` is stored directly as `zone.gridScale`'s raw `String` value
 * (SPEC-015 §6) — same reasoning as `AdventureStatus.test.ts`:
 * `z.nativeEnum` is the membership check, not an options-array validator.
 */
describe("GridScale membership validator", () => {
  const validator = z.nativeEnum(GridScale);

  it.each(Object.values(GridScale))("accepts the valid member %s", (scale) => {
    expect(validator.safeParse(scale).success).toBe(true);
  });

  it("has exactly the four scales of SPEC-015 §6", () => {
    expect(Object.values(GridScale).sort()).toEqual([
      "continent",
      "dungeon",
      "kingdom",
      "province",
    ]);
  });

  it("rejects a string outside the four scales", () => {
    expect(validator.safeParse("galaxy").success).toBe(false);
  });

  it("rejects a non-string value", () => {
    expect(validator.safeParse(9).success).toBe(false);
  });
});
