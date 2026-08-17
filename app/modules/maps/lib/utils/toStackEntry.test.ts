import { describe, expect, it } from "vitest";

import toStackEntry from "./toStackEntry";

describe("toStackEntry", () => {
  it("derives a mapUrl from a stored mapImage", () => {
    const entry = toStackEntry({
      id: 1,
      title: "Kingdom of Kang",
      mapImage: "kang.png",
      mapBounds: null,
      mapInitialView: null,
      mapInitialZoom: null,
    });

    expect(entry.mapUrl).toBe("/api/maps/kang.png/image");
  });

  it("leaves mapUrl empty for a place with no map of its own yet", () => {
    const entry = toStackEntry({
      id: 4,
      title: "Cieli",
      mapImage: null,
      mapBounds: null,
      mapInitialView: null,
      mapInitialZoom: null,
    });

    expect(entry.mapUrl).toBe("");
  });

  it("carries the place's own id and title through unchanged", () => {
    const entry = toStackEntry({
      id: 9,
      title: "Skreebars",
      mapImage: "skreebars.png",
      mapBounds: null,
      mapInitialView: null,
      mapInitialZoom: null,
    });

    expect(entry.id).toBe(9);
    expect(entry.title).toBe("Skreebars");
  });
});
