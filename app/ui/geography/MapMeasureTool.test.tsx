import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Overrides the global vitest.setup mock: the distance label needs
// `useLocale` too — same move `MapGridOverlay.test` makes.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "it",
}));

type MapHandler = (event: { latlng: { lat: number; lng: number } }) => void;
const mapHandlers: Record<string, MapHandler> = {};
const mapOff = vi.fn();
const fakeMap = {
  on: (event: string, handler: MapHandler) => {
    mapHandlers[event] = handler;
  },
  off: mapOff,
};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const trackSetLatLngs = vi.fn();
const trackRemove = vi.fn();
const polyline = vi.fn(
  (_latlngs: [number, number][], _options?: { color?: string }) => {
    const track = {
      addTo: (_target: unknown) => track,
      setLatLngs: trackSetLatLngs,
      remove: trackRemove,
    };
    return track;
  }
);
const markerBindTooltip = vi.fn();
const markerRemove = vi.fn();
const circleMarker = vi.fn((_latlng: unknown, _options?: unknown) => {
  const marker = {
    addTo: (_target: unknown) => marker,
    bindTooltip: (content: string, options?: unknown) => {
      markerBindTooltip(content, options);
      return marker;
    },
    openTooltip: () => marker,
    remove: markerRemove,
  };
  return marker;
});
vi.mock("leaflet", () => ({
  polyline: (latlngs: [number, number][], options?: { color?: string }) =>
    polyline(latlngs, options),
  circleMarker: (latlng: unknown, options?: unknown) =>
    circleMarker(latlng, options),
}));

import MapMeasureTool from "./MapMeasureTool";

const onExit = vi.fn();
const imageSize = { width: 400, height: 200 };

function renderTool(isActive = true) {
  return render(
    <MapMeasureTool
      isActive={isActive}
      gridColumns={4}
      gridScale="kingdom"
      imageSize={imageSize}
      onExit={onExit}
    />
  );
}

async function armed() {
  const result = renderTool();
  await waitFor(() => {
    expect(mapHandlers["click"]).toBeDefined();
  });
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete mapHandlers["click"];
  delete mapHandlers["mousemove"];
});

describe("MapMeasureTool", () => {
  it("labels the drop marker with the pixel-space distance, never a haversine metre (TD-94)", async () => {
    await armed();

    act(() => {
      mapHandlers["click"]?.({ latlng: { lat: 0, lng: 0 } });
      mapHandlers["click"]?.({ latlng: { lat: 0, lng: 300 } });
    });

    // 400px wide, 4 columns at the kingdom scale (9 km/square): 300 px is
    // 3 squares — 27 km. The retired haversine path read the same pair as
    // 300 *degrees of longitude* and reported ~33,000 km; this exact label
    // is the regression TD-94 exists to prevent.
    expect(markerBindTooltip).toHaveBeenCalledWith(
      "27 km",
      expect.objectContaining({ permanent: true })
    );
  });

  it("draws the track in red from the first click and follows the mouse", async () => {
    await armed();

    act(() => {
      mapHandlers["click"]?.({ latlng: { lat: 20, lng: 30 } });
    });
    expect(polyline).toHaveBeenCalledWith(
      [
        [20, 30],
        [20, 30],
      ],
      expect.objectContaining({ color: "#dc2626" })
    );

    act(() => {
      mapHandlers["mousemove"]?.({ latlng: { lat: 50, lng: 90 } });
    });
    expect(trackSetLatLngs).toHaveBeenCalledWith([
      [20, 30],
      [50, 90],
    ]);
  });

  it("starts a fresh measurement on the next click, clearing the previous result", async () => {
    await armed();

    act(() => {
      mapHandlers["click"]?.({ latlng: { lat: 0, lng: 0 } });
      mapHandlers["click"]?.({ latlng: { lat: 0, lng: 100 } });
    });
    expect(markerRemove).not.toHaveBeenCalled();

    act(() => {
      mapHandlers["click"]?.({ latlng: { lat: 50, lng: 50 } });
    });
    // Both previous markers and the previous track are gone.
    expect(markerRemove).toHaveBeenCalledTimes(2);
    expect(trackRemove).toHaveBeenCalledTimes(1);
  });

  it("exits on Escape", async () => {
    await armed();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("shows the hint banner while active, with a close button wired to onExit", async () => {
    await armed();

    expect(screen.getByText("hint")).toBeInTheDocument();
    screen.getByTitle("exit").click();
    expect(onExit).toHaveBeenCalled();
  });

  it("renders nothing and arms no handlers while inactive", () => {
    renderTool(false);

    expect(screen.queryByText("hint")).toBeNull();
    expect(mapHandlers["click"]).toBeUndefined();
  });

  it("tears down handlers and layers on deactivation", async () => {
    const { rerender } = await armed();

    act(() => {
      mapHandlers["click"]?.({ latlng: { lat: 0, lng: 0 } });
      mapHandlers["click"]?.({ latlng: { lat: 0, lng: 100 } });
    });

    rerender(
      <MapMeasureTool
        isActive={false}
        gridColumns={4}
        gridScale="kingdom"
        imageSize={imageSize}
        onExit={onExit}
      />
    );

    expect(mapOff).toHaveBeenCalledWith("click", expect.any(Function));
    expect(mapOff).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(trackRemove).toHaveBeenCalled();
    expect(markerRemove).toHaveBeenCalledTimes(2);
  });
});
