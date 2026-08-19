import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
let onEditArea: (() => void) | undefined;
let onAddSubMap: (() => void) | undefined;
let onAttachEntity: (() => void) | undefined;
let onContextMenuPositionPlace:
  ((id: number, lat: number, lng: number) => void) | undefined;
vi.mock("@/app/modules/maps/components/map/MapContextMenu", () => ({
  MapContextMenu: (props: {
    onAddPOI: (lat: number, lng: number) => void;
    isOpen: boolean;
    hideAddPlace?: boolean;
    onEditArea?: () => void;
    showEditArea?: boolean;
    onAddSubMap?: () => void;
    onAttachEntity?: () => void;
    unplacedPlaces?: { id: number; title: string; kind: string }[];
    unpositionedCount?: number;
    onPositionPlace?: (id: number, lat: number, lng: number) => void;
  }) => {
    onAddPOI = props.onAddPOI;
    onEditArea = props.onEditArea;
    onAddSubMap = props.onAddSubMap;
    onAttachEntity = props.onAttachEntity;
    onContextMenuPositionPlace = props.onPositionPlace;
    return (
      <div
        data-testid="map-context-menu"
        data-open={props.isOpen}
        data-hide-add-place={props.hideAddPlace ?? false}
        data-show-edit-area={props.showEditArea ?? false}
        data-unplaced-places-count={props.unplacedPlaces?.length ?? 0}
        data-unpositioned-count={props.unpositionedCount ?? 0}
      />
    );
  },
}));

let onRequestLocation: (() => void) | undefined;
let onImport: ((file: File) => void | Promise<void>) | undefined;
const exportGeoJSON = vi.fn(() => ({
  type: "FeatureCollection",
  features: [],
}));
const importGeoJSON = vi.fn(() => 2);
let onAddPlace:
  ((input: unknown) => Promise<{ ok: boolean; error?: string }>) | undefined;
let onPositionPlace: ((id: number) => void) | undefined;
vi.mock("@/app/modules/maps/components/map/MapPOIPanel", () => ({
  MapPOIPanel: (props: {
    onRequestLocation: () => void;
    onImport: (file: File) => void | Promise<void>;
    initialLat?: number;
    initialLng?: number;
    onAddPlace: (input: unknown) => Promise<{ ok: boolean; error?: string }>;
    unplacedChildren: { id: number; title: string; kind: string }[];
    onPositionPlace: (id: number) => void;
    positioningPlaceId: number | null;
    mode?: string;
    pendingFootprint?: unknown;
  }) => {
    onRequestLocation = props.onRequestLocation;
    onImport = props.onImport;
    onAddPlace = props.onAddPlace;
    onPositionPlace = props.onPositionPlace;
    return (
      <div
        data-testid="map-poi-panel"
        data-initial-lat={props.initialLat}
        data-initial-lng={props.initialLng}
        data-unplaced-count={props.unplacedChildren.length}
        data-positioning-id={props.positioningPlaceId ?? undefined}
        data-mode={props.mode}
        data-pending-footprint={
          props.pendingFootprint
            ? JSON.stringify(props.pendingFootprint)
            : undefined
        }
      />
    );
  },
}));

type DrawAreaOptions = {
  enabled: boolean;
  onComplete: (footprint: unknown) => void;
  onCancel: () => void;
};
// WorldMap calls `useDrawArea` twice per render (SPEC-009 T5): the
// draw-a-new-area instance, then the redraw-to-replace-an-existing-area
// instance, always in that order — so the mock tells them apart by call
// parity within a render rather than by identity.
let drawAreaCallCount = 0;
let drawAreaOptions: DrawAreaOptions | undefined;
let editAreaOptions: DrawAreaOptions | undefined;
vi.mock("@/app/modules/maps/hooks/useDrawArea", () => ({
  useDrawArea: (options: DrawAreaOptions) => {
    if (drawAreaCallCount % 2 === 0) {
      drawAreaOptions = options;
    } else {
      editAreaOptions = options;
    }
    drawAreaCallCount++;
  },
}));

const createPlace = vi.fn<
  (...args: unknown[]) => Promise<{
    ok: boolean;
    id?: number;
    errors?: Record<string, string[] | undefined>;
  }>
>();
vi.mock("@/app/lib/data/maps/createPlace", () => ({
  default: (...args: unknown[]) => createPlace(...args),
}));

const updateZonePosition =
  vi.fn<(input: unknown) => Promise<{ ok: boolean; errors?: unknown }>>();
vi.mock("@/app/lib/data/maps/updateZonePosition", () => ({
  default: (input: unknown) => updateZonePosition(input),
}));

// Has its own suite (SPEC-008 T5) — stubbed here so this file stays about
// WorldMap's own state, not the assignment modal's entity-picker flow.
vi.mock("@/app/ui/geography/AttachEntityButton", () => ({
  default: (props: { isOpen: boolean }) => (
    <div data-testid="attach-entity-button" data-open={props.isOpen} />
  ),
}));

// Has its own suite (SPEC-007 T1) — stubbed here so this file stays about
// WorldMap's own state, not the upload/confirm flow.
vi.mock("@/app/ui/geography/MapUploadControl", () => ({
  default: (props: { hasMap: boolean }) => (
    <div data-testid="map-upload-control" data-has-map={props.hasMap} />
  ),
}));

// Has its own suite (SPEC-010 T3) — stubbed here so this file stays about
// WorldMap's own state, not the delete-confirmation flow.
vi.mock("@/app/ui/geography/DeletePlaceButton", () => ({
  default: (props: { isRoot: boolean }) => (
    <div data-testid="delete-place-button" data-is-root={props.isRoot} />
  ),
}));

// A real pass-through — tests that care whether WorldMap actually routes
// its camera moves through this wrapper (rather than calling `map.setView`/
// `fitBounds` directly, bypassing it) assert on this mock's own call log,
// not just on `setView`/`fitBounds` themselves.
const runWithoutClosing = vi.fn((fn: () => void) => fn());
const useMapContextMenu = vi.fn(() => ({
  isOpen: false,
  position: null as {
    x: number;
    y: number;
    latlng: { lat: number; lng: number };
  } | null,
  close: vi.fn(),
  runWithoutClosing,
}));
vi.mock("@/app/modules/maps/hooks/useMapContextMenu", () => ({
  useMapContextMenu: () => useMapContextMenu(),
}));
const useMapMarkers = vi.fn(() => ({
  markers: [] as { id: string; lat: number; lng: number }[],
  addMarker: vi.fn(),
  clearMarkers: vi.fn(),
}));
vi.mock("@/app/modules/maps/hooks/useMapMarkers", () => ({
  useMapMarkers: () => useMapMarkers(),
}));
const reloadPOIs = vi.fn();
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
    reloadPOIs,
  }),
}));
const useUnplacedChildren = vi
  .fn<(...args: unknown[]) => { id: number; title: string; kind: string }[]>()
  .mockReturnValue([]);
vi.mock("@/app/modules/maps/hooks/useUnplacedChildren", () => ({
  useUnplacedChildren: (...args: unknown[]) => useUnplacedChildren(...args),
}));
const useNavigableChildren = vi
  .fn<(...args: unknown[]) => unknown[]>()
  .mockReturnValue([]);
vi.mock("@/app/modules/maps/hooks/useNavigableChildren", () => ({
  useNavigableChildren: (...args: unknown[]) => useNavigableChildren(...args),
}));
const setView = vi.fn();
const setMinZoom = vi.fn<(zoom: number) => void>();
const setMaxZoom = vi.fn();
const setMaxBounds = vi.fn();
const setZoom = vi.fn();
const fitBounds = vi.fn();
// TD-87: defaults to a fit well below every fixture's `initialZoom` (1, or
// -2 where a test overrides it to match the real per-place default) so
// existing tests — none of which assert on `setMinZoom`'s value — keep
// seeing genuine headroom without having to know about this mock. Tests
// that care about the actual computation override this per-case.
const getBoundsZoom = vi.fn(() => -4);
const fakeMap = {
  setView,
  setMinZoom,
  setMaxZoom,
  setMaxBounds,
  setZoom,
  fitBounds,
  getBoundsZoom,
};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const imageAddTo = vi.fn();
const imageRemove = vi.fn();
const imageSetBounds = vi.fn();
const imageSetOpacity = vi.fn();
// The image-overlay bootstrap effect (TD-81/TD-87) waits for the loaded
// image's own `load` event before trusting its natural size, rather than
// firing on every render — `once("load", cb)` records that callback here
// instead of invoking it, so tests can choose whether/when the image has
// "finished loading."
let imageOnLoad: (() => void) | undefined;
// Matches the default `bounds` fixture below (a 1000x1000 square) so tests
// that don't care about TD-81's aspect-ratio correction see the same
// numbers before and after the image "loads." Tests that do care override
// these before rendering.
let imageNaturalWidth: number | undefined = 1000;
let imageNaturalHeight: number | undefined = 1000;
const imageOverlay = vi.fn(
  (_url: string, _bounds: unknown, _options?: unknown) => ({
    addTo: imageAddTo,
    remove: imageRemove,
    setBounds: imageSetBounds,
    setOpacity: imageSetOpacity,
    getElement: () => ({
      naturalWidth: imageNaturalWidth,
      naturalHeight: imageNaturalHeight,
    }),
    once: (event: string, cb: () => void) => {
      if (event === "load") imageOnLoad = cb;
    },
  })
);
vi.mock("leaflet", () => ({
  imageOverlay: (url: string, bounds: unknown, options?: unknown) =>
    imageOverlay(url, bounds, options),
  // Real Leaflet's `ImageOverlay.setBounds` requires an actual
  // `L.LatLngBounds` instance, not a plain tuple — reassembling the two
  // corners into a tuple is enough here since the mocked `image.setBounds`
  // below only records what it was called with.
  latLngBounds: (southWest: unknown, northEast: unknown) => [
    southWest,
    northEast,
  ],
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import WorldMap from "./WorldMap";

const bounds: L.LatLngBoundsExpression = [
  [0, 0],
  [1000, 1000],
];

const onDescend = vi.fn();

/**
 * Renders WorldMap, waits for its image-overlay bootstrap effect to settle,
 * then simulates the image finishing its load — the state most tests care
 * about, since that's what a DM actually sees. Tests specifically about the
 * interim (pre-load) or the load-triggered reframing call `render` directly
 * instead and drive `imageOnLoad` themselves.
 */
async function renderMap(mapUrl = "/maps/test.jpg", unpositionedCount = 0) {
  render(
    <WorldMap
      parentId={1}
      placeTitle="Terra"
      parentTitle="Piani di Esistenza"
      isRoot={false}
      mapUrl={mapUrl}
      bounds={bounds}
      initialView={[500, 500]}
      initialZoom={1}
      onDescend={onDescend}
      onMapChanged={vi.fn()}
      onDeleted={vi.fn()}
      unpositionedCount={unpositionedCount}
    />
  );
  await waitFor(() => {
    expect(imageAddTo).toHaveBeenCalled();
  });
  act(() => {
    imageOnLoad?.();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  drawAreaCallCount = 0;
  drawAreaOptions = undefined;
  editAreaOptions = undefined;
  imageOnLoad = undefined;
  imageNaturalWidth = 1000;
  imageNaturalHeight = 1000;
  // `clearAllMocks` clears call history, not the return value a previous
  // test may have overridden with `mockReturnValue` (as opposed to
  // `mockReturnValueOnce`) — reset explicitly so tests can't leak a custom
  // fit zoom into whichever test happens to run after them.
  getBoundsZoom.mockReturnValue(-4);
  createPlace.mockResolvedValue({ ok: true, id: 1 });
  updateZonePosition.mockResolvedValue({ ok: true });
  useNavigableChildren.mockReturnValue([]);
  useUnplacedChildren.mockReturnValue([]);
  useMapContextMenu.mockReturnValue({
    isOpen: false,
    position: null,
    close: vi.fn(),
    runWithoutClosing,
  });
  useMapMarkers.mockReturnValue({
    markers: [],
    addMarker: vi.fn(),
    clearMarkers: vi.fn(),
  });
});

describe("WorldMap", () => {
  it("loads the image overlay onto the map on mount, hidden until it reports its own size (TD-81)", async () => {
    render(
      <WorldMap
        parentId={1}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        mapUrl="/maps/test.jpg"
        bounds={bounds}
        initialView={[500, 500]}
        initialZoom={1}
        onDescend={onDescend}
        onMapChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    // Interim framing, before the image's `load` event fires — the same
    // stored/default view this component has always opened with, but
    // painted invisible (opacity 0) so a wrong-aspect-ratio square is never
    // actually shown while the real dimensions are still unknown.
    expect(imageOverlay).toHaveBeenCalledWith("/maps/test.jpg", bounds, {
      opacity: 0,
    });
    expect(imageAddTo).toHaveBeenCalledWith(fakeMap);
    expect(setMaxBounds).toHaveBeenCalledWith(bounds);
    expect(setView).toHaveBeenCalledWith([500, 500], 1);
    expect(imageSetOpacity).not.toHaveBeenCalled();
  });

  it("reframes to the image's own aspect ratio once it reports its natural size, instead of the stored square (TD-81)", async () => {
    // A 16:9 image — distinct from the 1:1 `bounds` fixture, so a bug that
    // never corrects past the square default is caught.
    imageNaturalWidth = 1600;
    imageNaturalHeight = 900;
    render(
      <WorldMap
        parentId={1}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        mapUrl="/maps/test.jpg"
        bounds={bounds}
        initialView={[500, 500]}
        initialZoom={1}
        onDescend={onDescend}
        onMapChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    act(() => {
      imageOnLoad?.();
    });

    const fittedBounds = [
      [0, 0],
      [900, 1600],
    ];
    expect(imageSetBounds).toHaveBeenCalledWith(fittedBounds);
    expect(imageSetOpacity).toHaveBeenCalledWith(1);
    expect(setMaxBounds).toHaveBeenLastCalledWith(fittedBounds);
    // Leaflet's own `fitBounds` reframes the view against the corrected
    // (aspect-correct) bounds — not the stored/default square passed at
    // mount, before the image's real size was known.
    expect(fitBounds).toHaveBeenLastCalledWith(fittedBounds);
  });

  // Regression (CI flake traced to a real bug, not test flake): the image
  // `load` event this effect waits on fires asynchronously and, in CI,
  // sometimes lands while a DM has just opened the right-click context
  // menu. `fitBounds`/`setView` fire Leaflet's `movestart`, which
  // `useMapContextMenu` treats as "the user is navigating away" and closes
  // the menu — detaching its "Add Place" button out from under a
  // Playwright click mid-action. Both camera moves this effect makes must
  // go through `runWithoutClosing` so that hook can tell this apart from an
  // actual user drag/scroll instead of closing every open menu it lands on.
  it("routes both camera moves (the interim framing and the TD-81 corrective re-fit) through runWithoutClosing, not straight to the map (regression)", async () => {
    render(
      <WorldMap
        parentId={1}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        mapUrl="/maps/test.jpg"
        bounds={bounds}
        initialView={[500, 500]}
        initialZoom={1}
        onDescend={onDescend}
        onMapChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    // The interim `setView`, called at mount, already went through
    // `runWithoutClosing` — before the image has even reported it loaded.
    expect(runWithoutClosing).toHaveBeenCalledTimes(1);
    expect(setView).toHaveBeenCalledWith([500, 500], 1);

    act(() => {
      imageOnLoad?.();
    });

    // The corrective re-fit, once the image "loads," is the second call —
    // and `fitBounds` only having fired at all proves it happened *inside*
    // one of `runWithoutClosing`'s calls, since the mock's pass-through
    // implementation is the only thing that ever invokes the wrapped
    // callback.
    expect(runWithoutClosing).toHaveBeenCalledTimes(2);
    expect(fitBounds).toHaveBeenCalled();
  });

  it("falls back to the stored bounds if the loaded image reports no natural size", async () => {
    imageNaturalWidth = 0;
    imageNaturalHeight = 0;

    await renderMap();

    expect(imageSetBounds).toHaveBeenCalledWith(bounds);
  });

  it("renders empty ground with the upload control when mapUrl is blank (SPEC-007 T1)", async () => {
    render(
      <WorldMap
        parentId={1}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        mapUrl=""
        bounds={bounds}
        initialView={[500, 500]}
        initialZoom={1}
        onDescend={vi.fn()}
        onMapChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("map-upload-control")).toHaveAttribute(
        "data-has-map",
        "false"
      );
    });
    expect(imageOverlay).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
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

  it("creates a place under the current parent (SPEC-004 M5)", async () => {
    await renderMap();

    const result = await onAddPlace?.({
      kind: "region",
      title: "Kingdom of Kang",
      lat: 1,
      lng: 2,
      mapImage: "kang.png",
    });

    expect(result).toEqual({ ok: true });
    expect(createPlace).toHaveBeenCalledWith({
      kind: "region",
      title: "Kingdom of Kang",
      lat: 1,
      lng: 2,
      mapImage: "kang.png",
      parentId: 1,
    });
  });

  it("creates a place of a T2 navigable kind (e.g. city) under the current parent", async () => {
    await renderMap();

    const result = await onAddPlace?.({
      kind: "city",
      title: "Skreebars",
      lat: 3,
      lng: 4,
      mapImage: "skreebars.png",
    });

    expect(result).toEqual({ ok: true });
    expect(createPlace).toHaveBeenCalledWith({
      kind: "city",
      title: "Skreebars",
      lat: 3,
      lng: 4,
      mapImage: "skreebars.png",
      parentId: 1,
    });
  });

  it("bumps useNavigableChildren's refetch token after a successful create", async () => {
    await renderMap();
    const navigableTokenBefore = useNavigableChildren.mock.calls.at(-1)?.[2];

    await onAddPlace?.({
      kind: "region",
      title: "Kingdom of Kang",
      lat: 1,
      lng: 2,
      mapImage: "kang.png",
    });

    await waitFor(() => {
      const navigableTokenAfter = useNavigableChildren.mock.calls.at(-1)?.[2];
      expect(navigableTokenAfter).not.toBe(navigableTokenBefore);
    });
  });

  it("does not bump the refetch token when the create fails", async () => {
    createPlace.mockResolvedValue({ ok: false });
    await renderMap();
    const callsBefore = useNavigableChildren.mock.calls.length;

    const result = await onAddPlace?.({
      kind: "region",
      title: "Kingdom of Kang",
      lat: 1,
      lng: 2,
      mapImage: "kang.png",
    });

    expect(result).toEqual({ ok: false });
    // Give a re-render a chance to happen; asserting equal counts, not a
    // change, so no waitFor to await.
    expect(useNavigableChildren.mock.calls.length).toBe(callsBefore);
  });

  it("surfaces the server's own refusal message on failure", async () => {
    createPlace.mockResolvedValue({
      ok: false,
      errors: { footprint: ["Overlaps an existing area: Kang."] },
    });
    await renderMap();

    const result = await onAddPlace?.({
      kind: "region",
      title: "Kingdom of Kang",
      lat: 1,
      lng: 2,
      mapImage: "kang.png",
    });

    expect(result).toEqual({
      ok: false,
      error: "Overlaps an existing area: Kang.",
    });
  });
});

describe("WorldMap — attach an existing entity from the context menu (usability fix, 2026-08-17)", () => {
  it("opens AttachEntityButton when the context menu's Attach entity entry is used", async () => {
    await renderMap();

    expect(screen.getByTestId("attach-entity-button")).toHaveAttribute(
      "data-open",
      "false"
    );

    act(() => {
      onAttachEntity?.();
    });

    expect(screen.getByTestId("attach-entity-button")).toHaveAttribute(
      "data-open",
      "true"
    );
  });
});

describe("WorldMap — positioning an unplaced place (TD-71, SPEC-005 §5.A)", () => {
  beforeEach(() => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
  });

  it("enters crosshair mode and passes the positioning id to the panel", async () => {
    await renderMap();

    act(() => {
      onPositionPlace?.(5);
    });

    await waitFor(() => {
      expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
        "data-cursor",
        "crosshair"
      );
    });
    expect(screen.getByTestId("map-poi-panel")).toHaveAttribute(
      "data-positioning-id",
      "5"
    );
  });

  it("positions the place on the next map click, sending only id/lat/lng", async () => {
    await renderMap();

    act(() => {
      onPositionPlace?.(5);
    });
    act(() => {
      onClick?.(10, 20);
    });

    await waitFor(() => {
      expect(updateZonePosition).toHaveBeenCalledWith({
        id: 5,
        lat: 10,
        lng: 20,
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
        "data-cursor",
        "grab"
      );
    });
  });

  it("bumps the navigable refetch token after a successful positioning", async () => {
    await renderMap();
    const tokenBefore = useNavigableChildren.mock.calls.at(-1)?.[2];

    act(() => {
      onPositionPlace?.(5);
    });
    act(() => {
      onClick?.(10, 20);
    });

    await waitFor(() => {
      const tokenAfter = useNavigableChildren.mock.calls.at(-1)?.[2];
      expect(tokenAfter).not.toBe(tokenBefore);
    });
  });

  it("cancels positioning on a second click of the same place, without touching the map", async () => {
    await renderMap();

    act(() => {
      onPositionPlace?.(5);
    });
    act(() => {
      onPositionPlace?.(5);
    });

    expect(screen.getByTestId("map-poi-panel")).not.toHaveAttribute(
      "data-positioning-id"
    );

    act(() => {
      onClick?.(10, 20);
    });
    expect(updateZonePosition).not.toHaveBeenCalled();
  });

  it("toasts and leaves the place unplaced when the update fails", async () => {
    updateZonePosition.mockResolvedValue({ ok: false });
    await renderMap();

    act(() => {
      onPositionPlace?.(5);
    });
    act(() => {
      onClick?.(10, 20);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("placePositionFailed");
    });
  });
});

describe("WorldMap — draw-an-area (SPEC-009 T2; armed from the context menu since the 2026-08-17 usability fix)", () => {
  it("arms drawing mode and switches to a crosshair cursor", async () => {
    await renderMap();

    act(() => {
      onAddSubMap?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
        "data-cursor",
        "crosshair"
      );
    });
    expect(drawAreaOptions?.enabled).toBe(true);
  });

  it("opens the panel in add mode with the footprint once a rectangle is drawn, and disarms", async () => {
    await renderMap();

    act(() => {
      onAddSubMap?.();
    });
    const footprint = [
      [0, 0],
      [10, 20],
    ];
    act(() => {
      drawAreaOptions?.onComplete(footprint);
    });

    await waitFor(() => {
      expect(screen.getByTestId("map-poi-panel")).toHaveAttribute(
        "data-mode",
        "add"
      );
    });
    expect(screen.getByTestId("map-poi-panel")).toHaveAttribute(
      "data-pending-footprint",
      JSON.stringify(footprint)
    );
    // Disarmed after a completed draw — a further onComplete call would be
    // stale, so nothing should still be listening for this render's cursor
    // to stay crosshair.
    expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
      "data-cursor",
      "grab"
    );
  });

  it("cancels an in-progress POI location selection when armed", async () => {
    await renderMap();

    act(() => {
      onRequestLocation?.();
    });
    await waitFor(() => {
      expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
        "data-cursor",
        "crosshair"
      );
    });

    act(() => {
      onAddSubMap?.();
    });

    expect(drawAreaOptions?.enabled).toBe(true);
    // Toggling draw mode on cancels the other crosshair mode rather than
    // stacking with it — a later click should not still be interpreted as
    // a POI-location pick.
    act(() => {
      onClick?.(12, 34);
    });
    expect(screen.getByTestId("map-poi-panel")).not.toHaveAttribute(
      "data-initial-lat"
    );
  });

  it("is cancelled when positioning an unplaced place starts", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap();

    act(() => {
      onAddSubMap?.();
    });
    expect(drawAreaOptions?.enabled).toBe(true);

    act(() => {
      onPositionPlace?.(5);
    });

    expect(drawAreaOptions?.enabled).toBe(false);
  });
});

describe("WorldMap — descending into an area instead of placing a point (SPEC-009 T4)", () => {
  const area = {
    id: 9,
    title: "Kingdom of Kang",
    lat: 5,
    lng: 5,
    mapImage: "kang.png",
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
    footprint: [
      [0, 0],
      [10, 10],
    ],
  };

  beforeEach(() => {
    useNavigableChildren.mockReturnValue([area]);
  });

  it("hides Add Place in the context menu when the right-click point is inside an area", async () => {
    useMapContextMenu.mockReturnValue({
      isOpen: true,
      position: { x: 1, y: 2, latlng: { lat: 5, lng: 5 } },
      close: vi.fn(),
      runWithoutClosing,
    });
    await renderMap();

    expect(screen.getByTestId("map-context-menu")).toHaveAttribute(
      "data-hide-add-place",
      "true"
    );
  });

  it("shows Add Place in the context menu when the right-click point is outside every area", async () => {
    useMapContextMenu.mockReturnValue({
      isOpen: true,
      position: { x: 1, y: 2, latlng: { lat: 50, lng: 50 } },
      close: vi.fn(),
      runWithoutClosing,
    });
    await renderMap();

    expect(screen.getByTestId("map-context-menu")).toHaveAttribute(
      "data-hide-add-place",
      "false"
    );
  });

  it("descends into the area and cancels location-selection when the click lands inside it", async () => {
    await renderMap();

    act(() => {
      onRequestLocation?.();
    });
    act(() => {
      onClick?.(5, 5);
    });

    expect(onDescend).toHaveBeenCalledWith(area);
    expect(screen.getByTestId("map-poi-panel")).not.toHaveAttribute(
      "data-initial-lat"
    );
    await waitFor(() => {
      expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
        "data-cursor",
        "grab"
      );
    });
  });

  it("still records coordinates for a click outside every area while selecting", async () => {
    await renderMap();

    act(() => {
      onRequestLocation?.();
    });
    act(() => {
      onClick?.(50, 50);
    });

    expect(onDescend).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("map-poi-panel")).toHaveAttribute(
        "data-initial-lat",
        "50"
      );
    });
  });

  it("descends into the area and cancels positioning when the click lands inside it", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Skreebars", kind: "city" },
    ]);
    await renderMap();

    act(() => {
      onPositionPlace?.(5);
    });
    act(() => {
      onClick?.(5, 5);
    });

    expect(onDescend).toHaveBeenCalledWith(area);
    expect(updateZonePosition).not.toHaveBeenCalled();
    expect(screen.getByTestId("map-poi-panel")).not.toHaveAttribute(
      "data-positioning-id"
    );
    await waitFor(() => {
      expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
        "data-cursor",
        "grab"
      );
    });
  });
});

describe("WorldMap — resizing and moving an existing area (SPEC-009 T5)", () => {
  const area = {
    id: 9,
    title: "Kingdom of Kang",
    lat: 5,
    lng: 5,
    mapImage: "kang.png",
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
    footprint: [
      [0, 0],
      [10, 10],
    ],
  };

  beforeEach(() => {
    useNavigableChildren.mockReturnValue([area]);
    useMapContextMenu.mockReturnValue({
      isOpen: true,
      position: { x: 1, y: 2, latlng: { lat: 5, lng: 5 } },
      close: vi.fn(),
      runWithoutClosing,
    });
  });

  it("offers Edit Area only when the context menu is over an area", async () => {
    await renderMap();
    expect(screen.getByTestId("map-context-menu")).toHaveAttribute(
      "data-show-edit-area",
      "true"
    );
  });

  it("arms the redraw gesture, switches to a crosshair cursor, and cancels other crosshair modes", async () => {
    await renderMap();

    act(() => {
      onRequestLocation?.();
    });
    await waitFor(() => {
      expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
        "data-cursor",
        "crosshair"
      );
    });

    act(() => {
      onEditArea?.();
    });

    expect(editAreaOptions?.enabled).toBe(true);
    // Arming edit mode cancelled the other crosshair mode — a later click
    // must not still be interpreted as a POI-location pick.
    act(() => {
      onClick?.(50, 50);
    });
    expect(screen.getByTestId("map-poi-panel")).not.toHaveAttribute(
      "data-initial-lat"
    );
  });

  it("calls updateZonePosition with the new footprint and refetches on success", async () => {
    await renderMap();

    act(() => {
      onEditArea?.();
    });
    const footprint = [
      [1, 1],
      [20, 20],
    ];
    act(() => {
      editAreaOptions?.onComplete(footprint);
    });

    await waitFor(() => {
      expect(updateZonePosition).toHaveBeenCalledWith({ id: 9, footprint });
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows the server's own refusal message on failure, without writing", async () => {
    updateZonePosition.mockResolvedValue({
      ok: false,
      errors: { footprint: ["Overlaps an existing area: Orc Kingdom."] },
    });
    await renderMap();

    act(() => {
      onEditArea?.();
    });
    act(() => {
      editAreaOptions?.onComplete([
        [1, 1],
        [20, 20],
      ]);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Overlaps an existing area: Orc Kingdom."
      );
    });
  });

  it("falls back to the generic failure toast when the server returns no message", async () => {
    updateZonePosition.mockResolvedValue({ ok: false, errors: {} });
    await renderMap();

    act(() => {
      onEditArea?.();
    });
    act(() => {
      editAreaOptions?.onComplete([
        [1, 1],
        [20, 20],
      ]);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("placePositionFailed");
    });
  });

  it("disarms without writing when the gesture is cancelled", async () => {
    await renderMap();

    act(() => {
      onEditArea?.();
    });
    act(() => {
      editAreaOptions?.onCancel();
    });

    expect(updateZonePosition).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
        "data-cursor",
        "grab"
      );
    });
  });
});

describe("WorldMap — dismissing temporary markers (TD-86)", () => {
  it("shows no clear control when there are no temporary markers", async () => {
    await renderMap();
    expect(screen.queryByText("clear")).not.toBeInTheDocument();
  });

  it("shows a clear control once a temporary marker exists, for every viewer (not DM-gated)", async () => {
    useMapMarkers.mockReturnValue({
      markers: [{ id: "marker-1", lat: 1, lng: 2 }],
      addMarker: vi.fn(),
      clearMarkers: vi.fn(),
    });
    await renderMap();

    expect(screen.getByText("clear")).toBeInTheDocument();
  });

  it("calls clearMarkers when the clear control is clicked", async () => {
    const clearMarkers = vi.fn();
    useMapMarkers.mockReturnValue({
      markers: [{ id: "marker-1", lat: 1, lng: 2 }],
      addMarker: vi.fn(),
      clearMarkers,
    });
    await renderMap();

    fireEvent.click(screen.getByText("clear"));

    expect(clearMarkers).toHaveBeenCalled();
  });
});

describe("WorldMap — positioning a place from the context menu (TD-85)", () => {
  it("passes this place's unplaced children and the tree-wide count through to the context menu", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap("/maps/test.jpg", 7);

    expect(screen.getByTestId("map-context-menu")).toHaveAttribute(
      "data-unplaced-places-count",
      "1"
    );
    expect(screen.getByTestId("map-context-menu")).toHaveAttribute(
      "data-unpositioned-count",
      "7"
    );
  });

  it("positions the chosen place at the point the context menu was opened over, sending only id/lat/lng", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap();

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    await waitFor(() => {
      expect(updateZonePosition).toHaveBeenCalledWith({
        id: 5,
        lat: 10,
        lng: 20,
      });
    });
  });

  it("bumps the navigable refetch token after a successful context-menu positioning", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap();
    const tokenBefore = useNavigableChildren.mock.calls.at(-1)?.[2];

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    await waitFor(() => {
      const tokenAfter = useNavigableChildren.mock.calls.at(-1)?.[2];
      expect(tokenAfter).not.toBe(tokenBefore);
    });
  });

  it("toasts and does not refetch when the update fails", async () => {
    updateZonePosition.mockResolvedValue({ ok: false });
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap();

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("placePositionFailed");
    });
  });
});

describe("WorldMap — sized to its container, not the viewport (TD-84)", () => {
  it("fills the height its parent gives it instead of declaring its own full-viewport height", async () => {
    const { container } = render(
      <WorldMap
        parentId={1}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        mapUrl="/maps/test.jpg"
        bounds={bounds}
        initialView={[500, 500]}
        initialZoom={1}
        onDescend={onDescend}
        onMapChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    // The old bug: this root element was `h-screen` (100% of the whole
    // viewport) while mounted inside `GeographyExplorer`'s
    // `flex-1 min-h-0` slot, itself offset by page chrome above it — so it
    // was always taller than the space actually available, clipping every
    // `absolute bottom-*` control anchored to it below the fold.
    const root = container.firstElementChild;
    expect(root).toHaveClass("h-full");
    expect(root).not.toHaveClass("h-screen");
  });
});

describe("WorldMap — the zoom floor leaves room to zoom out (TD-87)", () => {
  it("opens strictly above its computed minimum zoom, not pinned exactly on it", async () => {
    // Mirrors the real bug: every place opens at `DEFAULT_MAP_INITIAL_ZOOM`
    // (-2, since nothing writes `mapInitialZoom`), and the image's own fit
    // for these bounds is a floor of -4 — well below that opening zoom.
    // Pre-fix, `setMinZoom` was hardcoded to 0 regardless of `getBoundsZoom`,
    // so the opening view (clamped to 0, since -2 < 0) landed exactly on
    // the floor and "zoom out" had nowhere to go.
    getBoundsZoom.mockReturnValue(-4);
    render(
      <WorldMap
        parentId={1}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        mapUrl="/maps/test.jpg"
        bounds={bounds}
        initialView={[500, 500]}
        initialZoom={-2}
        onDescend={onDescend}
        onMapChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    expect(setView).toHaveBeenCalledWith([500, 500], -2);
    const openZoom = -2;
    // Not merely "not equal" — genuinely below, i.e. there is at least one
    // full step of zoom-out headroom below wherever the map opens.
    const minZoomArg = setMinZoom.mock.calls.at(-1)?.[0];
    expect(minZoomArg).toBeLessThan(openZoom);
  });

  it("re-measures the floor against the corrected bounds once the image loads, rather than leaving it stale", async () => {
    // A different fit for the corrected (post-load) bounds than for the
    // interim stored/default ones, so a fix that only recomputes the floor
    // once (at mount) rather than again on load would be caught: the last
    // `setMinZoom` call would still reflect the interim fit instead of this
    // one.
    getBoundsZoom.mockReturnValueOnce(-4).mockReturnValueOnce(-6);
    imageNaturalWidth = 1600;
    imageNaturalHeight = 900;

    await renderMap();

    const fittedBounds = [
      [0, 0],
      [900, 1600],
    ];
    expect(fitBounds).toHaveBeenLastCalledWith(fittedBounds);
    const lastMinZoom = setMinZoom.mock.calls.at(-1)?.[0];
    // `computeMinZoom(-6, -6)` — the second, post-load `getBoundsZoom` call
    // doubling as both the fit and the opening zoom, since `fitBounds`
    // targets exactly that fit.
    expect(lastMinZoom).toBe(-7);
  });

  it("does not let a fit at or above the opening zoom leave the floor pinned on it (the original bug's exact shape)", async () => {
    // The image's own fit (0) is not looser than the opening zoom (0) —
    // naively using the fit alone as the floor reproduces TD-87 exactly:
    // floor equals opening zoom, so zoom out has nothing to do.
    getBoundsZoom.mockReturnValue(0);

    render(
      <WorldMap
        parentId={1}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        mapUrl="/maps/test.jpg"
        bounds={bounds}
        initialView={[500, 500]}
        initialZoom={0}
        onDescend={onDescend}
        onMapChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    const minZoomArg = setMinZoom.mock.calls.at(-1)?.[0];
    expect(minZoomArg).toBeLessThan(0);
  });
});
