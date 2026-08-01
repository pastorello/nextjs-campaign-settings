import { describe, expect, it } from "vitest";

import { buildPoiCreateSchema, buildPoiUpdateSchema } from "./poiSchema";

// Coordinates from the app's own image-overlay space, not Earth's. The
// geography page declares bounds up to `[[0, 0], [1000, 1333]]`, so a
// fixture inside ±90/±180 would pass a schema that rejects every POI the
// app can really place — which is exactly what happened.
const validPoi = {
  title: "Shrine of Aerivel",
  lat: 300,
  lng: 400,
  category: "religion",
};

describe("buildPoiCreateSchema", () => {
  it("accepts a POI with no link", () => {
    const result = buildPoiCreateSchema().safeParse(validPoi);
    expect(result.success).toBe(true);
  });

  it("accepts a POI linked to exactly one entity", () => {
    const result = buildPoiCreateSchema().safeParse({
      ...validPoi,
      linkedType: "deity",
      linkedId: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects linkedType without linkedId", () => {
    const result = buildPoiCreateSchema().safeParse({
      ...validPoi,
      linkedType: "npc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects linkedId without linkedType", () => {
    const result = buildPoiCreateSchema().safeParse({
      ...validPoi,
      linkedId: 7,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a linkedType outside LINKABLE_ENTITY_TYPES", () => {
    const result = buildPoiCreateSchema().safeParse({
      ...validPoi,
      linkedType: "dungeon",
      linkedId: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown category", () => {
    const result = buildPoiCreateSchema().safeParse({
      ...validPoi,
      category: "not-a-category",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = buildPoiCreateSchema().safeParse({
      ...validPoi,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  // Regression: geographic bounds here rejected every coordinate the app's
  // image-overlay maps produce. Coordinates run to the far corner of the
  // largest declared bounds and beyond, and must pass.
  it.each([
    ["origin", 0, 0],
    ["far corner of the largest map", 1000, 1333],
    ["outside Earth's latitude range", 950, 1200],
  ])("accepts image-space coordinates: %s", (_label, lat, lng) => {
    const result = buildPoiCreateSchema().safeParse({ ...validPoi, lat, lng });
    expect(result.success).toBe(true);
  });

  it.each([
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
  ])("rejects a coordinate that is not a finite number: %s", (_label, lat) => {
    const result = buildPoiCreateSchema().safeParse({ ...validPoi, lat });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric coordinate", () => {
    const result = buildPoiCreateSchema().safeParse({
      ...validPoi,
      lat: "over there",
    });
    expect(result.success).toBe(false);
  });
});

describe("buildPoiUpdateSchema", () => {
  it("accepts a partial payload carrying only id and one field", () => {
    const result = buildPoiUpdateSchema().safeParse({
      id: 1,
      title: "Renamed shrine",
    });
    expect(result.success).toBe(true);
  });

  it("requires a positive id", () => {
    const result = buildPoiUpdateSchema().safeParse({
      id: -1,
      title: "Renamed shrine",
    });
    expect(result.success).toBe(false);
  });

  it("accepts leaving the link untouched by omitting both fields", () => {
    const result = buildPoiUpdateSchema().safeParse({
      id: 1,
      title: "Renamed shrine",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.linkedType).toBeUndefined();
      expect(result.data.linkedId).toBeUndefined();
    }
  });

  it("accepts explicitly clearing the link with null/null", () => {
    const result = buildPoiUpdateSchema().safeParse({
      id: 1,
      linkedType: null,
      linkedId: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.linkedType).toBeNull();
      expect(result.data.linkedId).toBeNull();
    }
  });

  it("still rejects a half-link on update", () => {
    const result = buildPoiUpdateSchema().safeParse({
      id: 1,
      linkedType: "npc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects null/value and value/null mixes on update", () => {
    expect(
      buildPoiUpdateSchema().safeParse({ id: 1, linkedType: null, linkedId: 5 })
        .success
    ).toBe(false);
    expect(
      buildPoiUpdateSchema().safeParse({
        id: 1,
        linkedType: "npc",
        linkedId: null,
      }).success
    ).toBe(false);
  });

  it("accepts an update linked to exactly one entity", () => {
    const result = buildPoiUpdateSchema().safeParse({
      id: 1,
      linkedType: "npc",
      linkedId: 5,
    });
    expect(result.success).toBe(true);
  });
});
