import { describe, expect, it } from "vitest";

import { buildAssignLocationSchema } from "./assignLocationSchema";

describe("buildAssignLocationSchema", () => {
  it("accepts clearing both to null", () => {
    const result = buildAssignLocationSchema().safeParse({
      id: 1,
      zoneId: null,
      poiId: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a zone with no poi", () => {
    const result = buildAssignLocationSchema().safeParse({
      id: 1,
      zoneId: 5,
      poiId: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a zone with a poi", () => {
    const result = buildAssignLocationSchema().safeParse({
      id: 1,
      zoneId: 5,
      poiId: 9,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a poi without a zone", () => {
    const result = buildAssignLocationSchema().safeParse({
      id: 1,
      zoneId: null,
      poiId: 9,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive id", () => {
    const result = buildAssignLocationSchema().safeParse({
      id: 0,
      zoneId: null,
      poiId: null,
    });
    expect(result.success).toBe(false);
  });
});
