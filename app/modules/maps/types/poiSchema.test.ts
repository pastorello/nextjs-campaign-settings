import { describe, expect, it } from "vitest";

import { poiGeoJSONSchema } from "./poiSchema";

describe("poiGeoJSONSchema (TD-02b)", () => {
  it("accepts a feature collection missing id/createdAt/updatedAt", () => {
    const result = poiGeoJSONSchema.safeParse({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [20, 10] },
          properties: { title: "Tavern", category: "food-drink" },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a file that is not a FeatureCollection", () => {
    const result = poiGeoJSONSchema.safeParse({ hello: "world" });

    expect(result.success).toBe(false);
  });
});
