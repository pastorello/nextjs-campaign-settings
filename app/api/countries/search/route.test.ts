import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const readFileSync = vi.fn();
vi.mock("fs", () => ({ default: { readFileSync } }));

describe("GET /api/countries/search (TD-02b)", () => {
  beforeEach(() => {
    vi.resetModules();
    readFileSync.mockReset();
  });

  it("returns an empty result set when world.geojson fails validation", async () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ not: "a feature collection" })
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { GET } = await import("./route");
    const response = GET(
      new NextRequest("http://localhost/api/countries/search?q=Italy")
    );
    const body: unknown = await response.json();

    expect(body).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns matching countries from a well-formed file", async () => {
    readFileSync.mockReturnValue(
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { NAME: "Italy", NAME_LONG: "Italian Republic" },
            geometry: { type: "Polygon", coordinates: [] },
          },
        ],
      })
    );

    const { GET } = await import("./route");
    const response = GET(
      new NextRequest("http://localhost/api/countries/search?q=Italy")
    );
    const body: unknown = await response.json();

    expect(body).toEqual([
      { id: "Italy", name: "Italy", nameLong: "Italian Republic" },
    ]);
  });
});
