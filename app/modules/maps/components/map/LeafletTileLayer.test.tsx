import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const remove = vi.fn();
const addTo = vi.fn();
const on = vi.fn();
let mapInstance: object | null = {};

vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => mapInstance,
}));

const tileLayerInstance = { remove, addTo, on };
const tileLayer = vi.fn(
  (_url: unknown, _options: unknown) => tileLayerInstance
);

vi.mock("leaflet", () => ({
  tileLayer: (url: unknown, options: unknown) => tileLayer(url, options),
}));

import { LeafletTileLayer } from "./LeafletTileLayer";

const url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

beforeEach(() => {
  vi.clearAllMocks();
  mapInstance = {};
});

describe("LeafletTileLayer", () => {
  it("renders nothing", () => {
    const { container } = render(<LeafletTileLayer url={url} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does nothing when there is no map yet", async () => {
    mapInstance = null;
    render(<LeafletTileLayer url={url} />);

    await new Promise((r) => setTimeout(r, 0));
    expect(tileLayer).not.toHaveBeenCalled();
  });

  it("logs and does nothing for an invalid url", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    // @ts-expect-error - deliberately passing an invalid url to test the guard
    render(<LeafletTileLayer url={undefined} />);

    await new Promise((r) => setTimeout(r, 0));
    expect(tileLayer).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "Invalid tile layer URL:",
      undefined
    );
    consoleError.mockRestore();
  });

  it("adds a tile layer with defaulted attribution, maxZoom and subdomains", async () => {
    render(<LeafletTileLayer url={url} />);

    await waitFor(() => expect(tileLayer).toHaveBeenCalled());

    expect(tileLayer).toHaveBeenCalledWith(url, {
      attribution: "",
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    });
    expect(addTo).toHaveBeenCalledWith(mapInstance);
  });

  it("passes through custom attribution, maxZoom and subdomains", async () => {
    render(
      <LeafletTileLayer
        url={url}
        attribution="© Test"
        maxZoom={10}
        subdomains={["x", "y"]}
      />
    );

    await waitFor(() => expect(tileLayer).toHaveBeenCalled());

    expect(tileLayer).toHaveBeenCalledWith(url, {
      attribution: "© Test",
      maxZoom: 10,
      subdomains: ["x", "y"],
    });
  });

  it("replaces the previous tile layer when the url changes", async () => {
    const { rerender } = render(<LeafletTileLayer url={url} />);
    await waitFor(() => expect(addTo).toHaveBeenCalledTimes(1));

    rerender(<LeafletTileLayer url="https://example.com/{z}/{x}/{y}.png" />);

    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(tileLayer).toHaveBeenCalledTimes(2);
  });

  it("removes the tile layer on unmount", async () => {
    const { unmount } = render(<LeafletTileLayer url={url} />);
    await waitFor(() => expect(addTo).toHaveBeenCalled());

    unmount();

    expect(remove).toHaveBeenCalled();
  });
});
