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

  // `SceneCreature`'s domain interface types `note` `string | null`, not
  // optional — same gap and same fix as `sceneMeta.description`'s own test.
  it("accepts a null note, the same as an unset optional string column", () => {
    expect(sceneCreatureMeta.note.validator.safeParse(null).success).toBe(true);
  });

  it("refuses a statistics link that is not http/https (SPEC-031)", () => {
    const { validator } = sceneCreatureMeta.statsUrl;
    expect(validator.safeParse("javascript:alert(1)").success).toBe(false);
    expect(validator.safeParse("https://example.com/x").success).toBe(true);
  });

  it("offers the 34 challenge ratings, and refuses any other (SPEC-031)", () => {
    const { options, validator } = sceneCreatureMeta.challengeRating;
    expect(options.map((option) => option.value)).toEqual([
      "0",
      "1/8",
      "1/4",
      "1/2",
      ...Array.from({ length: 30 }, (_, index) => String(index + 1)),
    ]);
    expect(validator.safeParse("1/8").success).toBe(true);
    expect(validator.safeParse("").success).toBe(true);
    expect(validator.safeParse("31").success).toBe(false);
    expect(validator.safeParse("1/3").success).toBe(false);
  });
});
