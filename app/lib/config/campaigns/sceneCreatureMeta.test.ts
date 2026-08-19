import { describe, expect, it } from "vitest";

import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import sceneCreatureMeta from "./sceneCreatureMeta";

describePageMetaInvariants("sceneCreatureMeta", sceneCreatureMeta);

describe("sceneCreatureMeta (SPEC-013 T6)", () => {
  it("rejects an empty name", () => {
    expect(sceneCreatureMeta.name.validator.safeParse("").success).toBe(false);
  });

  it("defaults quantity to 1", () => {
    expect(sceneCreatureMeta.quantity.defaultValue).toBe(1);
  });

  it("rejects a non-positive quantity", () => {
    expect(sceneCreatureMeta.quantity.validator.safeParse(0).success).toBe(
      false
    );
  });

  it("treats a blank level as null, not zero", () => {
    const parsed = sceneCreatureMeta.level.validator.safeParse("");
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toBeNull();
  });

  it("treats a blank xpEach as null, not zero", () => {
    const parsed = sceneCreatureMeta.xpEach.validator.safeParse("");
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toBeNull();
  });

  it("accepts a null npcId", () => {
    expect(sceneCreatureMeta.npcId.validator.safeParse(null).success).toBe(
      true
    );
  });

  it("rejects a non-positive npcId", () => {
    expect(sceneCreatureMeta.npcId.validator.safeParse(0).success).toBe(false);
  });
});
