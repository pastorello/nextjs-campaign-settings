import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_TILE_PROVIDER_ID } from "@/app/modules/maps/constants/tile-providers";

let currentTheme: "light" | "dark" = "light";
vi.mock("./useTheme", () => ({
  useTheme: () => ({ theme: currentTheme }),
}));

import { useMapTileProvider } from "./useMapTileProvider";

describe("useMapTileProvider", () => {
  it("defaults to the OSM provider in light theme", () => {
    currentTheme = "light";
    const { result } = renderHook(() => useMapTileProvider());

    expect(result.current.currentProviderId).toBe(DEFAULT_TILE_PROVIDER_ID);
    expect(result.current.tileProvider.id).toBe(DEFAULT_TILE_PROVIDER_ID);
  });

  it("auto-switches to the dark provider in dark theme", () => {
    currentTheme = "dark";
    const { result } = renderHook(() => useMapTileProvider());

    expect(result.current.currentProviderId).toBe("dark");
    expect(result.current.tileProvider.id).toBe("dark");
  });

  it("a manual selection overrides the theme-based default", () => {
    currentTheme = "light";
    const { result } = renderHook(() => useMapTileProvider());

    act(() => {
      result.current.setProviderId("satellite");
    });

    expect(result.current.currentProviderId).toBe("satellite");
    expect(result.current.tileProvider.id).toBe("satellite");
  });

  it("falls back to the default provider for an unknown manual id", () => {
    currentTheme = "light";
    const { result } = renderHook(() => useMapTileProvider());

    act(() => {
      result.current.setProviderId("does-not-exist");
    });

    expect(result.current.tileProvider.id).toBe(DEFAULT_TILE_PROVIDER_ID);
  });
});
