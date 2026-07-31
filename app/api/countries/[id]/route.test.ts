import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const readFileSync = vi.fn();
vi.mock("fs", () => ({ default: { readFileSync } }));

describe("GET /api/countries/[id] (TD-02b)", () => {
  beforeEach(() => {
    vi.resetModules();
    readFileSync.mockReset();
  });

  it("returns 500 when world.geojson fails validation, instead of crashing", async () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ not: "a feature collection" })
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost/api/countries/Italy"),
      { params: Promise.resolve({ id: "Italy" }) }
    );

    expect(response.status).toBe(500);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns the matching feature from a well-formed file", async () => {
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
    const response = await GET(
      new NextRequest("http://localhost/api/countries/Italy"),
      { params: Promise.resolve({ id: "Italy" }) }
    );
    const body = (await response.json()) as { properties: { NAME: string } };

    expect(response.status).toBe(200);
    expect(body.properties.NAME).toBe("Italy");
  });

  it("returns 404 for an id that is not in the file", async () => {
    readFileSync.mockReturnValue(
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { NAME: "Italy" },
            geometry: { type: "Polygon", coordinates: [] },
          },
        ],
      })
    );

    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost/api/countries/Nowhere"),
      { params: Promise.resolve({ id: "Nowhere" }) }
    );

    expect(response.status).toBe(404);
  });
});
