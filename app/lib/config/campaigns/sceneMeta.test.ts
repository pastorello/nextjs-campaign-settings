import { describe, expect, it } from "vitest";

import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import sceneMeta from "./sceneMeta";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";

describePageMetaInvariants("sceneMeta", sceneMeta);

describe("sceneMeta (SPEC-013 T6)", () => {
  it("rejects an empty title", () => {
    expect(sceneMeta.title.validator.safeParse("").success).toBe(false);
  });

  it("rejects a kind outside the six closed values", () => {
    expect(sceneMeta.kind.validator.safeParse("ritual").success).toBe(false);
  });

  it("accepts every declared scene kind", () => {
    Object.values(SceneKind).forEach((kind) => {
      expect(sceneMeta.kind.validator.safeParse(kind).success).toBe(true);
    });
  });

  it("treats a blank xpAward as null, not zero", () => {
    const parsed = sceneMeta.xpAward.validator.safeParse("");
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toBeNull();
  });

  it("rejects a negative xpAward", () => {
    expect(sceneMeta.xpAward.validator.safeParse(-1).success).toBe(false);
  });

  it("accepts a null zoneId", () => {
    expect(sceneMeta.zoneId.validator.safeParse(null).success).toBe(true);
  });

  it("rejects a non-positive zoneId", () => {
    expect(sceneMeta.zoneId.validator.safeParse(0).success).toBe(false);
  });
});
