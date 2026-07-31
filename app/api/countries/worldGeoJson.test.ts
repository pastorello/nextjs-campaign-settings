import { describe, expect, it } from "vitest";

import { worldGeoJSONSchema } from "./worldGeoJson";

describe("worldGeoJSONSchema (TD-02b)", () => {
  it("accepts a well-formed FeatureCollection", () => {
    const result = worldGeoJSONSchema.safeParse({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { NAME: "Italy", NAME_LONG: "Italian Republic" },
          geometry: { type: "Polygon", coordinates: [] },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a file that is not a FeatureCollection", () => {
    const result = worldGeoJSONSchema.safeParse({ hello: "world" });

    expect(result.success).toBe(false);
  });

  it("rejects a feature missing its geometry", () => {
    const result = worldGeoJSONSchema.safeParse({
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { NAME: "Italy" } }],
    });

    expect(result.success).toBe(false);
  });
});
