import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toast } from "sonner";

// WorldMap composes five already-independently-tested map subcomponents and
// four already-independently-tested hooks (see app/modules/maps/hooks/*.test.ts)
// around its own state machine. Per the "unused is not dead" note in
// CLAUDE.md this file is a work-in-progress MVP over the vendored maps
// module — country search/selection isn't wired here yet (TD-46), so
// WorldMap.tsx doesn't import MapDetailsPanel or useMapTileProvider at all.
// These tests cover the state this component itself owns: the image-overlay
// bootstrap effect, the POI-location-selection flow, and export/import.

let onClick: ((lat: number, lng: number) => void) | undefined;
vi.mock("@/app/modules/maps/components/map/LeafletMap", () => ({
  LeafletMap: (props: {
    onClick?: (lat: number, lng: number) => void;
    cursorStyle: string;
  }) => {
    onClick = props.onClick;
    return <div data-testid="leaflet-map" data-cursor={props.cursorStyle} />;
  },
}));
vi.mock("@/app/modules/maps/components/map/MapControls", () => ({
  MapControls: () => <div data-testid="map-controls" />,
}));
vi.mock("@/app/modules/maps/components/map/MapMeasurementPanel", () => ({
  MapMeasurementPanel: () => <div data-testid="map-measurement-panel" />,
}));

let onAddPOI: ((lat: number, lng: number) => void) | undefined;
vi.mock("@/app/modules/maps/components/map/MapContextMenu", () => ({
  MapContextMenu: (props: { onAddPOI: (lat: number, lng: number) => void }) => {
    onAddPOI = props.onAddPOI;
    return <div data-testid="map-context-menu" />;
  },
}));

let onRequestLocation: (() => void) | undefined;
let onImport: ((file: File) => void | Promise<void>) | undefined;
const exportGeoJSON = vi.fn(() => ({
  type: "FeatureCollection",
  features: [],
}));
const importGeoJSON = vi.fn(() => 2);
vi.mock("@/app/modules/maps/components/map/MapPOIPanel", () => ({
  MapPOIPanel: (props: {
    onRequestLocation: () => void;
    onImport: (file: File) => void | Promise<void>;
    initialLat?: number;
    initialLng?: number;
  }) => {
    onRequestLocation = props.onRequestLocation;
    onImport = props.onImport;
    return (
      <div
        data-testid="map-poi-panel"
        data-initial-lat={props.initialLat}
        data-initial-lng={props.initialLng}
      />
    );
  },
}));

vi.mock("@/app/modules/maps/hooks/useMapContextMenu", () => ({
  useMapContextMenu: () => ({
    isOpen: false,
    position: null,
    close: vi.fn(),
  }),
}));
vi.mock("@/app/modules/maps/hooks/useMapMarkers", () => ({
  useMapMarkers: () => ({ addMarker: vi.fn() }),
}));
vi.mock("@/app/modules/maps/hooks/usePOIManager", () => ({
  usePOIManager: () => ({
    pois: [],
    addPOI: vi.fn(),
    updatePOI: vi.fn(),
    deletePOI: vi.fn(),
    clearAllPOIs: vi.fn(),
    exportGeoJSON,
    importGeoJSON,
    flyToPOI: vi.fn(),
  }),
}));
vi.mock("@/app/modules/maps/hooks/useNavigableChildren", () => ({
  useNavigableChildren: () => [],
}));

const setView = vi.fn();
const setMinZoom = vi.fn();
const setMaxZoom = vi.fn();
const setMaxBounds = vi.fn();
const setZoom = vi.fn();
const fitBounds = vi.fn();
const fakeMap = {
  setView,
  setMinZoom,
  setMaxZoom,
  setMaxBounds,
  setZoom,
  fitBounds,
};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const imageAddTo = vi.fn();
const imageOverlay = vi.fn((_url: string, _bounds: unknown) => ({
  addTo: imageAddTo,
  remove: vi.fn(),
}));
vi.mock("leaflet", () => ({
  imageOverlay: (url: string, bounds: unknown) => imageOverlay(url, bounds),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import WorldMap from "./WorldMap";

const bounds: L.LatLngBoundsExpression = [
  [0, 0],
  [1000, 1000],
];

/** Renders WorldMap and waits for its image-overlay bootstrap effect to settle. */
async function renderMap(mapUrl = "/maps/test.jpg") {
  render(
    <WorldMap
      parentId={1}
      mapUrl={mapUrl}
      bounds={bounds}
      initialView={[500, 500]}
      initialZoom={1}
      onDescend={vi.fn()}
    />
  );
  await waitFor(() => {
    expect(imageAddTo).toHaveBeenCalled();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WorldMap", () => {
  it("loads the image overlay onto the map on mount", async () => {
    await renderMap();

    expect(imageOverlay).toHaveBeenCalledWith("/maps/test.jpg", bounds);
    expect(imageAddTo).toHaveBeenCalledWith(fakeMap);
    expect(setMaxBounds).toHaveBeenCalledWith(bounds);
    expect(setView).toHaveBeenCalledWith([500, 500], 1);
  });

  it("notifies instead of loading an overlay when mapUrl is blank", async () => {
    render(
      <WorldMap
        parentId={1}
        mapUrl=""
        bounds={bounds}
        initialView={[500, 500]}
        initialZoom={1}
        onDescend={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("mapNotConfigured");
    });
    expect(imageOverlay).not.toHaveBeenCalled();
  });

  it("starts with a grab cursor and switches to crosshair once location selection is requested", async () => {
    await renderMap();

    expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
      "data-cursor",
      "grab"
    );

    act(() => {
      onRequestLocation?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
        "data-cursor",
        "crosshair"
      );
    });
  });

  it("records the clicked coordinates as the new POI's location, only while selecting", async () => {
    await renderMap();

    act(() => {
      onClick?.(12, 34);
    });
    expect(screen.getByTestId("map-poi-panel")).not.toHaveAttribute(
      "data-initial-lat"
    );

    act(() => {
      onRequestLocation?.();
    });
    act(() => {
      onClick?.(12, 34);
    });

    await waitFor(() => {
      expect(screen.getByTestId("map-poi-panel")).toHaveAttribute(
        "data-initial-lat",
        "12"
      );
    });
    expect(screen.getByTestId("map-poi-panel")).toHaveAttribute(
      "data-initial-lng",
      "34"
    );
  });

  it("opens the POI panel in add mode from the context menu's add-marker action", async () => {
    await renderMap();

    act(() => {
      onAddPOI?.(1, 2);
    });

    await waitFor(() => {
      expect(screen.getByTestId("map-poi-panel")).toHaveAttribute(
        "data-initial-lat",
        "1"
      );
    });
    expect(screen.getByTestId("map-poi-panel")).toHaveAttribute(
      "data-initial-lng",
      "2"
    );
  });

  it("imports a GeoJSON file and reports how many POIs were added", async () => {
    await renderMap();

    const file = {
      text: () => Promise.resolve('{"type":"FeatureCollection","features":[]}'),
    } as unknown as File;

    await onImport?.(file);

    expect(importGeoJSON).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("importSuccess");
  });

  it("reports a failed import instead of throwing", async () => {
    await renderMap();

    const badFile = {
      text: () => Promise.resolve("not json"),
    } as unknown as File;

    await onImport?.(badFile);

    expect(toast.error).toHaveBeenCalledWith("importFailed");
  });
});
