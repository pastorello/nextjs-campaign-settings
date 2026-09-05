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
  zoneId: 5,
};

describe("buildPoiCreateSchema", () => {
  it("accepts a valid poi", () => {
    const result = buildPoiCreateSchema().safeParse(validPoi);
    expect(result.success).toBe(true);
  });

  it("rejects a poi with no zoneId", () => {
    const withoutZone = {
      title: validPoi.title,
      lat: validPoi.lat,
      lng: validPoi.lng,
      category: validPoi.category,
    };
    const result = buildPoiCreateSchema().safeParse(withoutZone);
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive zoneId", () => {
    const result = buildPoiCreateSchema().safeParse({
      ...validPoi,
      zoneId: -1,
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

  it("refuses a zoneId out loud, rather than stripping it (SPEC-017 T6)", () => {
    // A landmark's zone is its tree edge, and ADR-0012 gives the edge one
    // writer: `placeLandmark`, which carries the attached entities'
    // `zoneId` with it. Zod strips unknown keys by default, which would
    // have made this silent — `.strict()` is what makes it a refusal.
    const result = buildPoiUpdateSchema().safeParse({ id: 1, zoneId: 7 });

    expect(result.success).toBe(false);
  });

  it("still accepts an update that carries no zoneId at all", () => {
    const result = buildPoiUpdateSchema().safeParse({
      id: 1,
      title: "Renamed shrine",
    });

    expect(result.success).toBe(true);
  });
});
