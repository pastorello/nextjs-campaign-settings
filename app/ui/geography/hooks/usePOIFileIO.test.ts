import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { usePOIFileIO } from "./usePOIFileIO";
import type { POIGeoJSON } from "@/app/modules/maps/types/poi";

const collection: POIGeoJSON = { type: "FeatureCollection", features: [] };

function fileOf(text: string): File {
  return { text: () => Promise.resolve(text) } as unknown as File;
}

describe("usePOIFileIO (TD-127)", () => {
  const exportGeoJSON = vi.fn(() => collection);
  const importGeoJSON = vi.fn((_geojson: POIGeoJSON) => 3);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  function render() {
    return renderHook(() => usePOIFileIO({ exportGeoJSON, importGeoJSON }))
      .result;
  }

  it("downloads the exported collection as a .geojson file", () => {
    const result = render();
    const click = vi.fn();
    const anchor = { href: "", download: "", click };
    vi.spyOn(document, "createElement").mockReturnValueOnce(
      anchor as unknown as HTMLAnchorElement
    );
    const createObjectURL = vi.fn(() => "blob:x");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    result.current.handleExport();

    expect(exportGeoJSON).toHaveBeenCalled();
    expect(anchor.href).toBe("blob:x");
    expect(anchor.download).toMatch(/^my-places-\d+\.geojson$/);
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:x");
    vi.unstubAllGlobals();
  });

  it("imports a file and reports the count", async () => {
    const result = render();

    await act(() =>
      result.current.handleImport(fileOf(JSON.stringify(collection)))
    );

    expect(importGeoJSON).toHaveBeenCalledWith(collection);
    expect(toast.success).toHaveBeenCalledWith("importSuccess");
  });

  it("reports a file that is not JSON instead of throwing", async () => {
    const result = render();

    await act(() => result.current.handleImport(fileOf("not json")));

    expect(importGeoJSON).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("importFailed");
  });

  // TD-128 — valid JSON in the wrong shape used to reach `importGeoJSON`
  // unchecked and fail deep inside it, or once per feature on the server.
  it("rejects a malformed GeoJSON file before importing anything", async () => {
    const result = render();
    const malformed = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: ["x", 1] },
          properties: { title: "Kang", category: "not-a-category" },
        },
      ],
    };

    await act(() =>
      result.current.handleImport(fileOf(JSON.stringify(malformed)))
    );

    expect(importGeoJSON).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("importFailed");
  });
});
