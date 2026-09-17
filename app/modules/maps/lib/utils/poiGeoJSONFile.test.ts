import { describe, expect, it } from "vitest";

import { readPOIGeoJSONFile } from "./poiGeoJSONFile";

function fileOf(text: string): File {
  return { text: () => Promise.resolve(text) } as unknown as File;
}

const feature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [10, 20] },
  properties: { title: "Kang", category: "shopping" },
};

describe("readPOIGeoJSONFile (TD-128)", () => {
  it("returns a valid collection as read", async () => {
    const collection = { type: "FeatureCollection", features: [feature] };

    await expect(
      readPOIGeoJSONFile(fileOf(JSON.stringify(collection)))
    ).resolves.toEqual(collection);
  });

  it("throws on text that is not JSON", async () => {
    await expect(readPOIGeoJSONFile(fileOf("not json"))).rejects.toThrow();
  });

  it("throws on JSON that is not a POI collection", async () => {
    const malformed = {
      type: "FeatureCollection",
      features: [{ ...feature, properties: { title: "Kang" } }],
    };

    await expect(
      readPOIGeoJSONFile(fileOf(JSON.stringify(malformed)))
    ).rejects.toThrow(/Invalid GeoJSON/);
  });
});
