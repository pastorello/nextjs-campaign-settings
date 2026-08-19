import { describe, expect, it } from "vitest";

import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import lootMeta from "./lootMeta";

describePageMetaInvariants("lootMeta", lootMeta);

describe("lootMeta (SPEC-013 T6)", () => {
  it("rejects an empty description", () => {
    expect(lootMeta.description.validator.safeParse("").success).toBe(false);
  });

  it("defaults quantity to 1", () => {
    expect(lootMeta.quantity.defaultValue).toBe(1);
  });

  it("rejects a non-positive quantity", () => {
    expect(lootMeta.quantity.validator.safeParse(0).success).toBe(false);
  });

  it("treats a blank value as null, not zero", () => {
    const parsed = lootMeta.value.validator.safeParse("");
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toBeNull();
  });

  it("accepts a null magicItemId and a null treasureId individually", () => {
    expect(lootMeta.magicItemId.validator.safeParse(null).success).toBe(true);
    expect(lootMeta.treasureId.validator.safeParse(null).success).toBe(true);
  });

  it("rejects a non-positive magicItemId or treasureId", () => {
    expect(lootMeta.magicItemId.validator.safeParse(0).success).toBe(false);
    expect(lootMeta.treasureId.validator.safeParse(0).success).toBe(false);
  });
});
