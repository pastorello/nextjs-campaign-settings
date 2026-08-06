import { describe, expect, it } from "vitest";

import { placeSchema } from "./placeSchema";

const commonFields = {
  title: "Somewhere",
  lat: 10,
  lng: 20,
};

describe("placeSchema", () => {
  describe("region", () => {
    it("accepts a region with a map and no category or link", () => {
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

    it("rejects a region carrying a category", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "region",
        mapImage: "generated-id.png",
        category: "religion",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.category).toBeDefined();
      }
    });
  });

  describe.each(["plane", "city", "dungeon"])("%s (T2)", (kind) => {
    it(`accepts a ${kind} with a map and no category or link`, () => {
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

  describe("deity", () => {
    it("accepts a deity linked to a record and no map", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "deity",
        linkedType: "deity",
        linkedId: 3,
      });

      expect(result.success).toBe(true);
    });

    it("rejects a deity carrying a map", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "deity",
        linkedType: "deity",
        linkedId: 3,
        mapImage: "generated-id.png",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.mapImage).toBeDefined();
      }
    });

    it("rejects a deity with no link", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "deity",
      });

      expect(result.success).toBe(false);
    });

    it("rejects a deity linked as an npc", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "deity",
        linkedType: "npc",
        linkedId: 3,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("npc", () => {
    it("accepts an npc linked to a record and no map", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "npc",
        linkedType: "npc",
        linkedId: 7,
      });

      expect(result.success).toBe(true);
    });

    it("rejects an npc carrying a category", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "npc",
        linkedType: "npc",
        linkedId: 7,
        category: "religion",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.category).toBeDefined();
      }
    });
  });

  describe("poi", () => {
    it("accepts a poi with a category and no link", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "poi",
        category: "religion",
      });

      expect(result.success).toBe(true);
    });

    it("rejects a poi with a link", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "poi",
        category: "religion",
        linkedType: "npc",
        linkedId: 7,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.linkedType).toBeDefined();
      }
    });

    it("rejects a poi without a category", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "poi",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.category).toBeDefined();
      }
    });

    it("rejects a poi with a category outside the closed list", () => {
      const result = placeSchema.safeParse({
        ...commonFields,
        kind: "poi",
        category: "not-a-category",
      });

      expect(result.success).toBe(false);
    });
  });

  it("rejects an unrecognised kind", () => {
    const result = placeSchema.safeParse({
      ...commonFields,
      kind: "castle",
      category: "religion",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an optional, coercible parentId shared by every kind", () => {
    const result = placeSchema.safeParse({
      ...commonFields,
      kind: "poi",
      category: "religion",
      parentId: "5",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parentId).toBe(5);
    }
  });
});
