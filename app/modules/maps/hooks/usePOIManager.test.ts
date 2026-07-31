import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePOIManager } from "./usePOIManager";
import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import type { POI } from "@/app/modules/maps/types/poi";

const STORAGE_KEY = "nextjs-leaflet-pois";

const validPOI: POI = {
  id: "poi-1",
  title: "Tavern",
  lat: 10,
  lng: 20,
  category: "food-drink",
  createdAt: 1,
  updatedAt: 1,
};

describe("usePOIManager — loading from localStorage (TD-02b)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads valid POIs unchanged", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([validPOI]));

    const { result } = renderHook(() => usePOIManager(), {
      wrapper: MapProvider,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pois).toEqual([validPOI]);
  });

  it("discards entries with an invalid category and keeps the rest", async () => {
    const corrupted = { ...validPOI, id: "poi-2", category: "not-a-category" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([validPOI, corrupted]));

    const { result } = renderHook(() => usePOIManager(), {
      wrapper: MapProvider,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pois).toEqual([validPOI]);
    expect(console.warn).toHaveBeenCalled();
  });

  it("does not crash on hand-edited storage that is not an array", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: "an array" }));

    const { result } = renderHook(() => usePOIManager(), {
      wrapper: MapProvider,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pois).toEqual([]);
  });
});
