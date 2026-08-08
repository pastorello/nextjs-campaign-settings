import { describe, expect, it } from "vitest";

import { placeSchema } from "./placeSchema";

const commonFields = {
  title: "Somewhere",
  lat: 10,
  lng: 20,
};

describe("placeSchema", () => {
  describe("region", () => {
    it("accepts a region with a map", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "region",
        mapImage: "generated-id.png",
      });

      expect(result.success).toBe(true);
    });

    it("rejects a region without a map", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "region",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.mapImage).toBeDefined();
      }
    });
  });

  describe.each(["plane", "city", "dungeon"])("%s (T2)", (kind) => {
    it(`accepts a ${kind} with a map`, () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind,
        mapImage: "generated-id.png",
      });

      expect(result.success).toBe(true);
    });

    it(`rejects a ${kind} without a map`, () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.mapImage).toBeDefined();
      }
    });
  });

  it("rejects kind: poi — a landmark never reaches this schema (routed through createPoi instead)", () => {
    const result = placeSchema.safeParse({
      ...commonFields,
      kind: "poi",
      category: "religion",
      mapImage: "generated-id.png",
    });

    expect(result.success).toBe(false);
  });

  it("rejects kind: deity/npc — removed by SPEC-008 T5, the map no longer creates entity pins", () => {
    const result = placeSchema.safeParse({
      ...commonFields,
      kind: "deity",
      mapImage: "generated-id.png",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unrecognised kind", () => {
    const result = placeSchema.safeParse({
      ...commonFields,
      kind: "castle",
      mapImage: "generated-id.png",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an optional, coercible parentId", () => {
    const result = placeSchema.safeParse({
      ...commonFields,
      kind: "region",
      mapImage: "generated-id.png",
      parentId: "5",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parentId).toBe(5);
    }
  });
});
