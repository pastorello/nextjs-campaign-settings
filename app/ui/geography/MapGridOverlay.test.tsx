import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Overrides the global vitest.setup mock: this component also needs
// `useLocale` (the legend formats distances in the viewer's locale), which
// the global mock does not provide — same move `LocaleSwitcher.test` makes.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "it",
}));

const fakeMap = {};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const polylineAddTo = vi.fn();
const polylineRemove = vi.fn();
const polyline = vi.fn(
  (_latlngs: [number, number][][], _options?: { interactive: boolean }) => ({
    addTo: polylineAddTo,
    remove: polylineRemove,
  })
);
vi.mock("leaflet", () => ({
  polyline: (
    latlngs: [number, number][][],
    options?: { interactive: boolean }
  ) => polyline(latlngs, options),
}));

import MapGridOverlay from "./MapGridOverlay";

const imageSize = { width: 400, height: 200 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MapGridOverlay", () => {
  it("renders nothing while the toggle is off (SPEC-015 §5: off by default)", () => {
    const { container } = render(
      <MapGridOverlay
        isVisible={false}
        gridColumns={4}
        gridScale="kingdom"
        imageSize={imageSize}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(polyline).not.toHaveBeenCalled();
  });

  it("draws nothing without a configured grid, even when visible — never a guess", () => {
    const { container } = render(
      <MapGridOverlay
        isVisible
        gridColumns={null}
        gridScale={null}
        imageSize={imageSize}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(polyline).not.toHaveBeenCalled();
  });

  it("draws nothing from an unparseable stored scale", () => {
    const { container } = render(
      <MapGridOverlay
        isVisible
        gridColumns={4}
        gridScale="parsec"
        imageSize={imageSize}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(polyline).not.toHaveBeenCalled();
  });

  it("draws nothing while the image's size is still unknown", () => {
    const { container } = render(
      <MapGridOverlay
        isVisible
        gridColumns={4}
        gridScale="kingdom"
        imageSize={null}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(polyline).not.toHaveBeenCalled();
  });

  it("draws one multi-polyline spanning the image and shows the legend", async () => {
    render(
      <MapGridOverlay
        isVisible
        gridColumns={4}
        gridScale="kingdom"
        imageSize={imageSize}
      />
    );

    // Legend (§5 step 6) — the global-mock-style `t` returns raw keys.
    expect(screen.getByText("squareEquals")).toBeInTheDocument();
    expect(screen.getByText("totalSize")).toBeInTheDocument();

    await waitFor(() => {
      expect(polylineAddTo).toHaveBeenCalledWith(fakeMap);
    });

    // 400px wide, 4 columns → 100px squares: 5 verticals (x = 0…400) and
    // 3 horizontals (y = 0, 100, 200) — 8 segments in one polyline.
    const call = polyline.mock.calls[0];
    if (!call) throw new Error("polyline was never called");
    const [latlngs, options] = call;
    expect(latlngs).toHaveLength(8);
    expect(latlngs[0]).toEqual([
      [0, 0],
      [200, 0],
    ]);
    expect(latlngs[4]).toEqual([
      [0, 400],
      [200, 400],
    ]);
    expect(latlngs[7]).toEqual([
      [200, 0],
      [200, 400],
    ]);
    // Clicks must pass through to the map beneath.
    expect(options?.interactive).toBe(false);
  });

  it("removes the layer when toggled back off", async () => {
    const { rerender } = render(
      <MapGridOverlay
        isVisible
        gridColumns={4}
        gridScale="kingdom"
        imageSize={imageSize}
      />
    );

    await waitFor(() => {
      expect(polylineAddTo).toHaveBeenCalled();
    });

    rerender(
      <MapGridOverlay
        isVisible={false}
        gridColumns={4}
        gridScale="kingdom"
        imageSize={imageSize}
      />
    );

    expect(polylineRemove).toHaveBeenCalled();
  });
});
