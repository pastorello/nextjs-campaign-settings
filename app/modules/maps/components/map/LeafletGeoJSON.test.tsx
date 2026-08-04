import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const remove = vi.fn();
const addTo = vi.fn();
const getBounds = vi.fn((): { isValid: () => boolean } => ({
  isValid: () => true,
}));
const flyToBounds = vi.fn();
let mapInstance: { flyToBounds: typeof flyToBounds } | null = {
  flyToBounds,
};

vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => mapInstance,
}));

interface GeoJSONCallOptions {
  style: Record<string, unknown>;
}

const geoJSONLayer = { remove, addTo, getBounds };
const geoJSON = vi.fn(
  (_data: unknown, _options: GeoJSONCallOptions) => geoJSONLayer
);

vi.mock("leaflet", () => ({
  geoJSON: (data: unknown, options: GeoJSONCallOptions) =>
    geoJSON(data, options),
}));

import { LeafletGeoJSON } from "./LeafletGeoJSON";

const feature = {
  type: "Feature",
  properties: {},
  geometry: { type: "Point", coordinates: [0, 0] },
} as GeoJSON.Feature;

beforeEach(() => {
  vi.clearAllMocks();
  mapInstance = { flyToBounds };
  getBounds.mockReturnValue({ isValid: () => true });
});

describe("LeafletGeoJSON", () => {
  it("renders nothing", () => {
    const { container } = render(<LeafletGeoJSON data={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does nothing when there is no map yet", async () => {
    mapInstance = null;
    render(<LeafletGeoJSON data={feature} />);

    await new Promise((r) => setTimeout(r, 0));
    expect(geoJSON).not.toHaveBeenCalled();
  });

  it("adds a GeoJSON layer with the default style and flies to its bounds", async () => {
    render(<LeafletGeoJSON data={feature} />);

    await waitFor(() => expect(geoJSON).toHaveBeenCalled());

    expect(geoJSON).toHaveBeenCalledWith(
      feature,
      expect.objectContaining({
        style: {
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
          color: "#2563eb",
          weight: 2,
        },
      })
    );
    expect(addTo).toHaveBeenCalledWith(mapInstance);
    expect(flyToBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ padding: [50, 50] })
    );
  });

  it("uses the caller's style overrides instead of the defaults", async () => {
    render(<LeafletGeoJSON data={feature} style={{ fillColor: "#fff" }} />);

    await waitFor(() => expect(geoJSON).toHaveBeenCalled());

    const [, options] = geoJSON.mock.calls[0]!;
    expect(options.style).toEqual(
      expect.objectContaining({ fillColor: "#fff" })
    );
  });

  it("does not fly to bounds when the computed bounds are invalid", async () => {
    getBounds.mockReturnValue({ isValid: () => false });
    render(<LeafletGeoJSON data={feature} />);

    await waitFor(() => expect(geoJSON).toHaveBeenCalled());
    expect(flyToBounds).not.toHaveBeenCalled();
  });

  it("removes the existing layer and adds no new one when data becomes null", async () => {
    const { rerender } = render(<LeafletGeoJSON data={feature} />);
    await waitFor(() => expect(addTo).toHaveBeenCalled());

    rerender(<LeafletGeoJSON data={null} />);

    await waitFor(() => expect(remove).toHaveBeenCalled());
    expect(geoJSON).toHaveBeenCalledTimes(1);
  });

  it("removes the layer on unmount", async () => {
    const { unmount } = render(<LeafletGeoJSON data={feature} />);
    await waitFor(() => expect(addTo).toHaveBeenCalled());

    unmount();

    expect(remove).toHaveBeenCalled();
  });
});
