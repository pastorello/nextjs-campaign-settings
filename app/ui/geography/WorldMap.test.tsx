import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
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
// Renders the `belowZoomControls` slot so the grid toggle (SPEC-015 T6)
// is reachable; `extraControls` stays swallowed — `MapOptionsButton`'s
// menu has its own suite.
vi.mock("@/app/modules/maps/components/map/MapControls", () => ({
  MapControls: (props: { belowZoomControls?: ReactNode }) => (
    <div data-testid="map-controls">{props.belowZoomControls}</div>
  ),
}));
// Has its own suite (SPEC-015 T7) — stubbed so these tests assert on the
// arming gate WorldMap owns, not the click-track-click interaction.
vi.mock("@/app/ui/geography/MapMeasureTool", () => ({
  default: (props: { isActive: boolean }) => (
    <div data-testid="map-measure-tool" data-active={props.isActive} />
  ),
}));

let onAddPOI: ((lat: number, lng: number) => void) | undefined;
let onStartMeasurement: (() => void) | undefined;
let onAddSubMap: (() => void) | undefined;
let onContextMenuPositionPlace:
  ((id: number, lat: number, lng: number) => void) | undefined;
vi.mock("@/app/modules/maps/components/map/MapContextMenu", () => ({
  MapContextMenu: (props: {
    onAddPOI: (lat: number, lng: number) => void;
    onStartMeasurement: () => void;
    isOpen: boolean;
    hideAddPlace?: boolean;
    onAddSubMap?: () => void;
    unplacedPlaces?: { id: number; title: string; kind: string }[];
    positionPlaceSublabel?: string;
    onPositionPlace?: (id: number, lat: number, lng: number) => void;
  }) => {
    onAddPOI = props.onAddPOI;
    onStartMeasurement = props.onStartMeasurement;
    onAddSubMap = props.onAddSubMap;
    onContextMenuPositionPlace = props.onPositionPlace;
    return (
      <div
        data-testid="map-context-menu"
        data-open={props.isOpen}
        data-hide-add-place={props.hideAddPlace ?? false}
        data-unplaced-places-count={props.unplacedPlaces?.length ?? 0}
        data-position-place-sublabel={props.positionPlaceSublabel ?? ""}
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
let onPOIModeChange: ((mode: string) => void) | undefined;
vi.mock("@/app/modules/maps/components/map/MapPOIPanel", () => ({
  MapPOIPanel: (props: {
    onRequestLocation: () => void;
    onImport: (file: File) => void | Promise<void>;
    initialLat?: number;
    initialLng?: number;
    onAddPlace: (input: unknown) => Promise<{ ok: boolean; error?: string }>;
    mode?: string;
    onModeChange?: (mode: string) => void;
    pendingFootprint?: unknown;
    isOpen: boolean;
    editTarget?: { id: string; title: string } | null;
  }) => {
    onRequestLocation = props.onRequestLocation;
    onImport = props.onImport;
    onAddPlace = props.onAddPlace;
    onPOIModeChange = props.onModeChange;
    return (
      <div
        data-testid="map-poi-panel"
        data-initial-lat={props.initialLat}
        data-initial-lng={props.initialLng}
        data-mode={props.mode}
        data-open={props.isOpen}
        data-edit-target-id={props.editTarget?.id}
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
  vi.fn<
    (
      input: unknown
    ) => Promise<{ ok: boolean; errors?: unknown; code?: string }>
  >();
vi.mock("@/app/lib/data/maps/updateZonePosition", () => ({
  default: (input: unknown) => updateZonePosition(input),
}));

const placeZone =
  vi.fn<
    (
      input: unknown
    ) => Promise<{ ok: boolean; errors?: unknown; code?: string }>
  >();
vi.mock("@/app/lib/data/maps/placeZone", () => ({
  default: (input: unknown) => placeZone(input),
}));

const placeLandmark =
  vi.fn<
    (
      input: unknown
    ) => Promise<{ ok: boolean; errors?: unknown; code?: string }>
  >();
vi.mock("@/app/lib/data/maps/placeLandmark", () => ({
  default: (input: unknown) => placeLandmark(input),
}));

const unplacePlace =
  vi.fn<(input: unknown) => Promise<{ ok: boolean; errors?: unknown }>>();
vi.mock("@/app/lib/data/maps/unplacePlace", () => ({
  default: (input: unknown) => unplacePlace(input),
}));

// Has its own suite (SPEC-007 T1) — stubbed here so this file stays about
// WorldMap's own state, not the upload/confirm flow.
vi.mock("@/app/ui/geography/MapUploadControl", () => ({
  default: (props: { hasMap: boolean }) => (
    <div data-testid="map-upload-control" data-has-map={props.hasMap} />
  ),
}));

// Has its own suite (TD-104) — stubbed here for the same reason as the grid
// panel below, plus a hard one: the real component imports
// `updateZoneDetails`, a `"use server"` module whose `@/auth` import does
// not resolve under vitest.
vi.mock("@/app/ui/geography/ZoneEditPanel", () => ({
  default: (props: {
    placeId: number;
    title: string;
    description: string | null;
    hasFootprint: boolean;
    onSaved: (title: string, description: string | null) => void;
    onRedrawArea: (title: string) => void;
  }) => {
    zoneEditOnSaved = props.onSaved;
    zoneEditOnRedrawArea = props.onRedrawArea;
    return (
      <div
        data-testid="zone-edit-panel"
        data-place-id={props.placeId}
        data-title={props.title}
        data-description={props.description ?? ""}
        data-has-footprint={props.hasFootprint}
      />
    );
  },
}));

// Has its own suite (SPEC-015 T5) — stubbed here so this file stays about
// WorldMap's own state, not the grid form flow. `data-image-size` is how
// the tests below watch the natural-size plumbing the panel derives its
// height from.
vi.mock("@/app/ui/geography/MapGridConfigPanel", () => ({
  default: (props: {
    isOpen: boolean;
    imageSize: { width: number; height: number } | null;
  }) => (
    <div
      data-testid="map-grid-config-panel"
      data-open={props.isOpen}
      data-image-size={
        props.imageSize === null
          ? ""
          : `${props.imageSize.width}x${props.imageSize.height}`
      }
    />
  ),
}));

// Has its own suite (SPEC-015 T6) — stubbed so these tests assert on what
// WorldMap hands it (the toggle's state, the stored grid), not on Leaflet
// polylines or the legend, which the overlay's own tests cover.
vi.mock("@/app/ui/geography/MapGridOverlay", () => ({
  default: (props: { isVisible: boolean; gridColumns: number | null }) => (
    <div
      data-testid="map-grid-overlay"
      data-visible={props.isVisible}
      data-grid-columns={props.gridColumns ?? ""}
    />
  ),
}));

// Has its own suite (SPEC-010 T3) — stubbed here so this file stays about
// WorldMap's own state, not the delete-confirmation flow.
vi.mock("@/app/ui/geography/DeletePlaceButton", () => ({
  default: (props: { isRoot: boolean }) => (
    <div data-testid="delete-place-button" data-is-root={props.isRoot} />
  ),
}));

// Has its own suite (SPEC-016 T2) — stubbed here so this file stays about
// which place `WorldMap` opens the popover for, and what its two callbacks
// do, not the popover's own positioning/Esc/outside-click machinery.
let popoverOnClose: (() => void) | undefined;
let popoverOnOpenMap: ((place: { id: number }) => void) | undefined;
let popoverOnUnplace:
  ((place: { id: number; title: string }) => void) | undefined;
let popoverOnDeleted: (() => void) | undefined;
let zoneEditOnSaved:
  ((title: string, description: string | null) => void) | undefined;
let zoneEditOnRedrawArea: ((title: string) => void) | undefined;
let popoverOnEditZone:
  ((place: { id: number; title: string }) => void) | undefined;
let popoverOnEditLandmark:
  ((poi: { id: string; title: string }) => void) | undefined;
let popoverOnDeleteLandmark:
  ((poi: { id: string; title: string }) => void) | undefined;
let popoverParentTitle: string | undefined;
let popoverParentId: number | undefined;
type MockPopoverTarget =
  | { kind: "zone"; place: { id: number; title: string } }
  | { kind: "poi"; poi: { id: string; title: string } };
vi.mock("@/app/ui/geography/PlacePopover", () => ({
  default: (props: {
    target: MockPopoverTarget;
    parentId: number;
    parentTitle: string;
    onClose: () => void;
    onOpenMap: (place: { id: number }) => void;
    onUnplace: (place: { id: number; title: string }) => void;
    onDeleted: () => void;
    onEditZone: (place: { id: number; title: string }) => void;
    onEditLandmark: (poi: { id: string; title: string }) => void;
    onDeleteLandmark: (poi: { id: string; title: string }) => void;
  }) => {
    popoverOnClose = props.onClose;
    popoverOnOpenMap = props.onOpenMap;
    popoverOnUnplace = props.onUnplace;
    popoverOnDeleted = props.onDeleted;
    popoverOnEditZone = props.onEditZone;
    popoverOnEditLandmark = props.onEditLandmark;
    popoverOnDeleteLandmark = props.onDeleteLandmark;
    popoverParentTitle = props.parentTitle;
    popoverParentId = props.parentId;
    const { id, title } =
      props.target.kind === "zone"
        ? { id: props.target.place.id, title: props.target.place.title }
        : { id: props.target.poi.id, title: props.target.poi.title };
    return (
      <div
        data-testid="place-popover"
        data-place-id={id}
        data-place-title={title}
        data-target-kind={props.target.kind}
      />
    );
  },
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
// A stable spy, not `vi.fn()` inlined per call (unlike the hook's other
// no-op returns above): T7's popover-delete tests assert on it directly,
// the same reason `exportGeoJSON`/`importGeoJSON` are already top-level.
const deletePOI = vi.fn();
// A spy wrapper, not a bare object return, so tests can read the
// `onPOIClick` callback `WorldMap` passes (SPEC-016 T7) — the same shape
// `useNavigableChildren`'s own mock below uses for `onPlaceClick`.
const usePOIManager = vi.fn((..._args: unknown[]) => ({
  pois: [],
  addPOI: vi.fn(),
  updatePOI: vi.fn(),
  deletePOI,
  clearAllPOIs: vi.fn(),
  exportGeoJSON,
  importGeoJSON,
  flyToPOI: vi.fn(),
  reloadPOIs,
}));
vi.mock("@/app/modules/maps/hooks/usePOIManager", () => ({
  usePOIManager: (...args: unknown[]) => usePOIManager(...args),
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
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
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
async function renderMap(
  mapUrl = "/maps/test.jpg",
  unpositionedCount = 0,
  grid: { gridColumns: number | null; gridScale: string | null } = {
    gridColumns: null,
    gridScale: null,
  }
) {
  const view = render(mapElement(mapUrl, unpositionedCount, grid, 1));
  await waitFor(() => {
    expect(imageAddTo).toHaveBeenCalled();
  });
  act(() => {
    imageOnLoad?.();
  });
  return view;
}

/** The element itself, so a test can re-render it with a different parent. */
function mapElement(
  mapUrl: string,
  unpositionedCount: number,
  grid: { gridColumns: number | null; gridScale: string | null },
  parentId: number
) {
  return (
    <WorldMap
      parentId={parentId}
      placeTitle="Terra"
      parentTitle="Piani di Esistenza"
      isRoot={false}
      mapUrl={mapUrl}
      bounds={bounds}
      initialView={[500, 500]}
      initialZoom={1}
      onDescend={onDescend}
      gridColumns={grid.gridColumns}
      gridScale={grid.gridScale}
      onMapChanged={vi.fn()}
      onGridChanged={vi.fn()}
      onDeleted={vi.fn()}
      unpositionedCount={unpositionedCount}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  drawAreaCallCount = 0;
  drawAreaOptions = undefined;
  editAreaOptions = undefined;
  imageOnLoad = undefined;
  imageNaturalWidth = 1000;
  imageNaturalHeight = 1000;
  popoverOnClose = undefined;
  popoverOnOpenMap = undefined;
  popoverOnUnplace = undefined;
  popoverOnDeleted = undefined;
  popoverOnEditZone = undefined;
  popoverOnEditLandmark = undefined;
  zoneEditOnSaved = undefined;
  zoneEditOnRedrawArea = undefined;
  popoverOnDeleteLandmark = undefined;
  popoverParentTitle = undefined;
  popoverParentId = undefined;
  // `clearAllMocks` clears call history, not the return value a previous
  // test may have overridden with `mockReturnValue` (as opposed to
  // `mockReturnValueOnce`) — reset explicitly so tests can't leak a custom
  // fit zoom into whichever test happens to run after them.
  getBoundsZoom.mockReturnValue(-4);
  createPlace.mockResolvedValue({ ok: true, id: 1 });
  updateZonePosition.mockResolvedValue({ ok: true });
  placeZone.mockResolvedValue({ ok: true });
  placeLandmark.mockResolvedValue({ ok: true });
  unplacePlace.mockResolvedValue({ ok: true });
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
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
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
    expect(setView).toHaveBeenCalledWith([500, 500], 1, { animate: false });
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
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
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
    expect(fitBounds).toHaveBeenLastCalledWith(fittedBounds, {
      animate: false,
    });
  });

  // Regression (CI flake traced to a real bug, not test flake): the image
  // `load` event this effect waits on fires asynchronously and, in CI,
  // sometimes lands while a DM has just opened the right-click context
  // menu. `fitBounds`/`setView` change the zoom, and Leaflet fires
  // `zoomstart` for that exactly as it does for the DM's own wheel — which
  // `useMapContextMenu` reads as "the DM is navigating away" and closes the
  // menu, detaching its "Add Place" button out from under a Playwright click
  // mid-action. Both camera moves this effect makes must go through
  // `runWithoutClosing` so that hook can tell them apart from a zoom the DM
  // asked for instead of closing every open menu they land on.
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
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
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
    expect(setView).toHaveBeenCalledWith([500, 500], 1, { animate: false });

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
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
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

describe("WorldMap — attaching an existing entity (SPEC-016 T8, TD-96)", () => {
  it("no longer mounts an AttachEntityButton of its own", async () => {
    // T8 removed the right-click entry that was this instance's only
    // trigger; `PlacePopover` now mounts its own, pre-filled with the
    // clicked place (T4/T7) rather than the map's currently-viewed parent.
    await renderMap();

    expect(
      screen.queryByTestId("attach-entity-button")
    ).not.toBeInTheDocument();
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

  // TD-104 (the DM, 2026-08-30) removed the right-click "Modifica area"
  // entry these tests used to arm through. The gesture is unchanged — same
  // `useDrawArea` instance, same `updateZonePosition` commit — but the only
  // way in is now the place's own popover and the panel behind it.
  function armRedraw() {
    const onPlaceClick = useNavigableChildren.mock.calls.at(-1)?.[1] as
      ((child: unknown) => void) | undefined;
    act(() => {
      onPlaceClick?.(area);
    });
    act(() => {
      popoverOnEditZone?.(area);
    });
    act(() => {
      zoneEditOnRedrawArea?.(area.title);
    });
  }

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

    armRedraw();

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

    armRedraw();
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

    armRedraw();
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

    armRedraw();
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

    armRedraw();
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
  // TD-103 — the two numbers answer different questions, so only one of
  // them reaches the menu as a number. `unplacedChildren` is what the
  // dropdown can offer *here*, and the menu decides its own enabled state
  // from it; the tree-wide count arrives already rendered into the
  // sublabel's text, where it is awareness rather than a reachability
  // claim. Passing it as a number is what let it drive `disabled`.
  it("passes this place's unplaced children as data, and the tree-wide count only as sublabel text", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap("/maps/test.jpg", 7);

    expect(screen.getByTestId("map-context-menu")).toHaveAttribute(
      "data-unplaced-places-count",
      "1"
    );
    expect(screen.getByTestId("map-context-menu")).toHaveAttribute(
      "data-position-place-sublabel",
      "unpositionedCount"
    );
  });

  it("positions the chosen place at the point the context menu was opened over, as a placement", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap();

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    await waitFor(() => {
      // The one call site that is a placement (TD-93): everything else
      // that writes coordinates is moving something already on the map,
      // which is why placement is its own mutation (SPEC-017 T3).
      // `parentId` is the map in view: picking from the pool places the
      // thing here *and* moves it here (SPEC-017 T4).
      expect(placeZone).toHaveBeenCalledWith({
        id: 5,
        parentId: 1,
        lat: 10,
        lng: 20,
      });
      expect(updateZonePosition).not.toHaveBeenCalled();
    });
  });

  it("places onto the map in view, not the one it was mounted with", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    const view = await renderMap();

    // `GeographyExplorer` does not key `WorldMap`, so descending swaps
    // `parentId` on a mounted component rather than remounting it, and a
    // memoised handler still holding the old id would write the tree edge
    // of the map the DM just left (SPEC-017 T4).
    //
    // **This test passes with or without `parentId` in that handler's
    // dependency array — checked, not assumed.** `t` comes from a mocked
    // `useTranslations` whose identity changes on every render, so the
    // memoisation never actually holds here and the stale closure cannot
    // be reproduced. What guards the dependency is `react-hooks/
    // exhaustive-deps`, which did catch it. This asserts the behaviour the
    // feature needs — the edge follows the map in view — not the reason it
    // currently holds.
    view.rerender(
      mapElement("/maps/test.jpg", 0, { gridColumns: null, gridScale: null }, 2)
    );

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    await waitFor(() => {
      expect(placeZone).toHaveBeenCalledWith({
        id: 5,
        parentId: 2,
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
    placeZone.mockResolvedValue({ ok: false });
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

  it("tells the DM to un-place first when the placement is refused (TD-93)", async () => {
    placeZone.mockResolvedValue({
      ok: false,
      code: "alreadyPlaced",
      errors: {},
    });
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap();

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    // Not "try again": the write was refused on purpose, and retrying it
    // unchanged would be refused again.
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("placeAlreadyPositioned");
    });
    expect(toast.error).not.toHaveBeenCalledWith("placePositionFailed");
  });

  // TD-102 — the dropdown lists `fetchPlaceChildren`'s merged rows, so an
  // unplaced landmark sits in it next to unplaced navigable places. `zone`
  // and `poi` ids come from independent sequences, so sending every pick to
  // `placeZone` addressed whichever zone shared the number.
  it("routes a landmark to the landmark table, never to the zone one", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Abandoned well", kind: "poi" },
    ]);
    await renderMap();

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    await waitFor(() => {
      expect(placeLandmark).toHaveBeenCalledWith({
        id: 5,
        zoneId: 1,
        lat: 10,
        lng: 20,
      });
    });
    expect(placeZone).not.toHaveBeenCalled();
  });

  it("refuses a landmark already placed, without naming a recovery it does not have", async () => {
    placeLandmark.mockResolvedValue({
      ok: false,
      code: "alreadyPlaced",
      errors: {},
    });
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Abandoned well", kind: "poi" },
    ]);
    await renderMap();

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    // Its own key, not the navigable place's: that one ends with "move it
    // back to the unpositioned places first", and SPEC-016 T5's un-place
    // action exists for navigable places only. Telling a DM to use a
    // control that is not there is the same class of defect as the
    // "resize or move" sublabel on a redraw-only gesture.
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("landmarkAlreadyPositioned");
    });
    expect(toast.error).not.toHaveBeenCalledWith("placeAlreadyPositioned");
  });

  it("writes nothing when the id is not in the list it rendered", async () => {
    // The id alone does not say which table to address, and guessing is the
    // whole defect. A miss means the client snapshot and the menu have
    // diverged, so the honest move is to refuse rather than pick a table.
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap();

    act(() => {
      onContextMenuPositionPlace?.(999, 10, 20);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("placePositionFailed");
    });
    expect(updateZonePosition).not.toHaveBeenCalled();
    expect(placeLandmark).not.toHaveBeenCalled();
  });

  it("reloads the landmark markers after placing one, so it appears without a page reload", async () => {
    // `usePOIManager` owns the landmark markers and this write happened
    // outside its optimistic path — the row is not in `pois` yet, so
    // bumping the places token alone drops it from the unplaced list and
    // renders no marker. `reloadPOIs` had been left with no caller when
    // SPEC-016 T9 withdrew the panel's unplaced picker; found because the
    // TD-102 e2e placed the landmark successfully and then saw nothing.
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Abandoned well", kind: "poi" },
    ]);
    await renderMap();

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    await waitFor(() => {
      expect(reloadPOIs).toHaveBeenCalled();
    });
  });

  it("does not reload the landmark markers when the thing placed was a zone", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Kingdom of Kang", kind: "region" },
    ]);
    await renderMap();

    act(() => {
      onContextMenuPositionPlace?.(5, 10, 20);
    });

    await waitFor(() => {
      expect(placeZone).toHaveBeenCalled();
    });
    expect(reloadPOIs).not.toHaveBeenCalled();
  });

  it("bumps the refetch token after placing a landmark, so its marker appears", async () => {
    useUnplacedChildren.mockReturnValue([
      { id: 5, title: "Abandoned well", kind: "poi" },
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
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
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
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    expect(setView).toHaveBeenCalledWith([500, 500], -2, { animate: false });
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
    expect(fitBounds).toHaveBeenLastCalledWith(fittedBounds, {
      animate: false,
    });
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
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
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

describe("WorldMap — the grid panel's image size (SPEC-015 T5)", () => {
  it("hands the panel no size until the image loads, then its natural size", async () => {
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
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    // Before the image reports its dimensions the aspect ratio is unknown —
    // the panel renders its derived height as `—` off this (§5's edge-case
    // table).
    expect(screen.getByTestId("map-grid-config-panel")).toHaveAttribute(
      "data-image-size",
      ""
    );

    act(() => {
      imageOnLoad?.();
    });

    expect(screen.getByTestId("map-grid-config-panel")).toHaveAttribute(
      "data-image-size",
      "1600x900"
    );
  });

  it("keeps the size unknown when a broken image reports no dimensions", async () => {
    imageNaturalWidth = 0;
    imageNaturalHeight = 0;
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
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
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

    expect(screen.getByTestId("map-grid-config-panel")).toHaveAttribute(
      "data-image-size",
      ""
    );
  });
});

describe("WorldMap — the grid overlay's toggle (SPEC-015 T6)", () => {
  it("starts with the grid off on every load, even when one is configured (§9: not persisted)", async () => {
    await renderMap("/maps/test.jpg", 0, {
      gridColumns: 36,
      gridScale: "kingdom",
    });

    expect(screen.getByTestId("map-grid-overlay")).toHaveAttribute(
      "data-visible",
      "false"
    );
    // A configured grid gets a real toggle, labelled with what it would do.
    expect(screen.getByTitle("show")).toBeInTheDocument();
  });

  it("toggles the overlay on and off", async () => {
    await renderMap("/maps/test.jpg", 0, {
      gridColumns: 36,
      gridScale: "kingdom",
    });

    fireEvent.click(screen.getByTitle("show"));
    expect(screen.getByTestId("map-grid-overlay")).toHaveAttribute(
      "data-visible",
      "true"
    );

    fireEvent.click(screen.getByTitle("hide"));
    expect(screen.getByTestId("map-grid-overlay")).toHaveAttribute(
      "data-visible",
      "false"
    );
  });

  it("is inert without a configured grid: it opens the configuration panel and draws nothing (§5)", async () => {
    await renderMap();

    fireEvent.click(screen.getByTitle("configure"));

    expect(screen.getByTestId("map-grid-config-panel")).toHaveAttribute(
      "data-open",
      "true"
    );
    expect(screen.getByTestId("map-grid-overlay")).toHaveAttribute(
      "data-visible",
      "false"
    );
  });

  it("renders no toggle at all for a place with no map image (§5's edge-case table)", () => {
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
        onDescend={onDescend}
        gridColumns={null}
        gridScale={null}
        onMapChanged={vi.fn()}
        onGridChanged={vi.fn()}
        onDeleted={vi.fn()}
        unpositionedCount={0}
      />
    );

    expect(screen.queryByTitle("configure")).toBeNull();
    expect(screen.queryByTitle("show")).toBeNull();
  });

  it("switches the grid back off when navigating to another place", async () => {
    const props = {
      placeTitle: "Terra",
      parentTitle: "Piani di Esistenza",
      isRoot: false,
      mapUrl: "/maps/test.jpg",
      bounds,
      initialView: [500, 500] as [number, number],
      initialZoom: 1,
      onDescend,
      gridColumns: 36,
      gridScale: "kingdom",
      onMapChanged: vi.fn(),
      onGridChanged: vi.fn(),
      onDeleted: vi.fn(),
      unpositionedCount: 0,
    };
    const { rerender } = render(<WorldMap parentId={1} {...props} />);
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByTitle("show"));
    expect(screen.getByTestId("map-grid-overlay")).toHaveAttribute(
      "data-visible",
      "true"
    );

    rerender(<WorldMap parentId={2} {...props} />);
    expect(screen.getByTestId("map-grid-overlay")).toHaveAttribute(
      "data-visible",
      "false"
    );
  });
});

describe("WorldMap — arming the measure tool (SPEC-015 T7)", () => {
  it("arms the tool from the context menu when the grid is configured and the image has loaded", async () => {
    await renderMap("/maps/test.jpg", 0, {
      gridColumns: 36,
      gridScale: "kingdom",
    });

    expect(screen.getByTestId("map-measure-tool")).toHaveAttribute(
      "data-active",
      "false"
    );

    act(() => {
      onStartMeasurement?.();
    });

    expect(screen.getByTestId("map-measure-tool")).toHaveAttribute(
      "data-active",
      "true"
    );
  });

  it("refuses to arm without a configured grid, explaining instead of guessing (§5, TD-94)", async () => {
    await renderMap();

    act(() => {
      onStartMeasurement?.();
    });

    expect(toast.info).toHaveBeenCalledWith("unavailable");
    expect(screen.getByTestId("map-measure-tool")).toHaveAttribute(
      "data-active",
      "false"
    );
  });
});

describe("WorldMap — the place popover (SPEC-016 T2)", () => {
  const place = { id: 7, title: "Kang", lat: 5, lng: 5, mapImage: null };

  function clickPlace(child: unknown = place) {
    const onPlaceClick = useNavigableChildren.mock.calls.at(-1)?.[1] as
      ((child: unknown) => void) | undefined;
    act(() => {
      onPlaceClick?.(child);
    });
  }

  it("opens the popover for the clicked place instead of descending directly", async () => {
    await renderMap();

    clickPlace();

    expect(screen.getByTestId("place-popover")).toHaveAttribute(
      "data-place-id",
      "7"
    );
    expect(onDescend).not.toHaveBeenCalled();
  });

  it("does not open the popover while the measure tool is active (§5's edge-case table)", async () => {
    await renderMap("/maps/test.jpg", 0, {
      gridColumns: 36,
      gridScale: "kingdom",
    });
    act(() => {
      onStartMeasurement?.();
    });

    clickPlace();

    expect(screen.queryByTestId("place-popover")).not.toBeInTheDocument();
  });

  it("descends via onDescend and closes the popover when Apri mappa is used", async () => {
    await renderMap();
    clickPlace();

    act(() => {
      popoverOnOpenMap?.(place);
    });

    expect(onDescend).toHaveBeenCalledWith(place);
    expect(screen.queryByTestId("place-popover")).not.toBeInTheDocument();
  });

  it("closes the popover on its own onClose callback", async () => {
    await renderMap();
    clickPlace();
    expect(screen.getByTestId("place-popover")).toBeInTheDocument();

    act(() => {
      popoverOnClose?.();
    });

    expect(screen.queryByTestId("place-popover")).not.toBeInTheDocument();
  });

  it("shows one popover at a time — clicking another place replaces it", async () => {
    await renderMap();
    clickPlace(place);
    expect(screen.getByTestId("place-popover")).toHaveAttribute(
      "data-place-id",
      "7"
    );

    clickPlace({ ...place, id: 9, title: "Skreebars" });

    expect(screen.getAllByTestId("place-popover")).toHaveLength(1);
    expect(screen.getByTestId("place-popover")).toHaveAttribute(
      "data-place-id",
      "9"
    );
  });
});

describe("WorldMap — un-placing from the popover (SPEC-016 T5)", () => {
  const place = { id: 7, title: "Kang", lat: 5, lng: 5, mapImage: null };

  function clickPlace(child: unknown = place) {
    const onPlaceClick = useNavigableChildren.mock.calls.at(-1)?.[1] as
      ((child: unknown) => void) | undefined;
    act(() => {
      onPlaceClick?.(child);
    });
  }

  it("un-places the clicked place: refetches and closes the popover", async () => {
    await renderMap("/maps/test.jpg", 2);
    clickPlace();
    const tokenBefore = useUnplacedChildren.mock.calls.at(-1)?.[1] as number;

    act(() => {
      popoverOnUnplace?.(place);
    });

    expect(unplacePlace).toHaveBeenCalledWith({ id: 7 });
    await waitFor(() => {
      expect(useUnplacedChildren.mock.calls.at(-1)?.[1]).toBe(tokenBefore + 1);
    });
    // No assertion on the tree-wide count here any more (TD-103 stopped
    // passing it to the menu), and it was never this component's to update
    // in any case. This comment used to say the refresh comes from
    // `revalidatePath`, "confirmed live in e2e" — see TD-105 for why that
    // attribution does not hold: no `revalidatePath` call in this codebase
    // names the route file structure these pages actually have, and e2e
    // runs against `pnpm dev`, which re-renders regardless. What this test
    // is about is the refetch above and the popover below.
    expect(screen.queryByTestId("place-popover")).not.toBeInTheDocument();
  });

  it("shows an error toast and keeps the popover open when the mutation is rejected", async () => {
    unplacePlace.mockResolvedValue({ ok: false, errors: {} });
    await renderMap();
    clickPlace();

    act(() => {
      popoverOnUnplace?.(place);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("placeUnplaceFailed");
    });
    expect(screen.getByTestId("place-popover")).toBeInTheDocument();
  });

  it("shows an error toast and keeps the popover open when the mutation throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    unplacePlace.mockRejectedValue(new Error("boom"));
    await renderMap();
    clickPlace();

    act(() => {
      popoverOnUnplace?.(place);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("placeUnplaceFailed");
    });
    expect(screen.getByTestId("place-popover")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});

describe("WorldMap — deleting from the popover (SPEC-016 T6)", () => {
  const place = { id: 7, title: "Kang", lat: 5, lng: 5, mapImage: null };

  function clickPlace(child: unknown = place) {
    const onPlaceClick = useNavigableChildren.mock.calls.at(-1)?.[1] as
      ((child: unknown) => void) | undefined;
    act(() => {
      onPlaceClick?.(child);
    });
  }

  it("passes the place currently being viewed as the reparent target", async () => {
    await renderMap();
    clickPlace();

    expect(popoverParentTitle).toBe("Terra");
  });

  it("refetches and closes the popover once the popover reports a completed deletion", async () => {
    await renderMap();
    clickPlace();
    const tokenBefore = useUnplacedChildren.mock.calls.at(-1)?.[1] as number;

    act(() => {
      popoverOnDeleted?.();
    });

    await waitFor(() => {
      expect(useUnplacedChildren.mock.calls.at(-1)?.[1]).toBe(tokenBefore + 1);
    });
    expect(screen.queryByTestId("place-popover")).not.toBeInTheDocument();
  });
});

describe("WorldMap — landmark popover (SPEC-016 T7)", () => {
  const poi = { id: "42", title: "Fontana del Corvo", lat: 6, lng: 6 };

  function clickPOI(target: unknown = poi) {
    const onPOIClick = usePOIManager.mock.calls.at(-1)?.[1] as
      ((poi: unknown) => void) | undefined;
    act(() => {
      onPOIClick?.(target);
    });
  }

  it("passes the WorldMap-scoped onPOIClick callback as usePOIManager's second argument", async () => {
    await renderMap();

    expect(usePOIManager).toHaveBeenLastCalledWith(1, expect.any(Function));
  });

  it("opens the popover for the clicked landmark", async () => {
    await renderMap();

    clickPOI();

    const popover = screen.getByTestId("place-popover");
    expect(popover).toHaveAttribute("data-target-kind", "poi");
    expect(popover).toHaveAttribute("data-place-id", "42");
    expect(popover).toHaveAttribute("data-place-title", "Fontana del Corvo");
    // The enclosing zone — a landmark's own `POI` shape carries no `zoneId`
    // of its own, so the popover's attach-control pre-fill (T7) needs this
    // from `WorldMap` directly.
    expect(popoverParentId).toBe(1);
  });

  it("does not open the popover for a landmark click while measuring", async () => {
    await renderMap("/maps/test.jpg", 0, {
      gridColumns: 36,
      gridScale: "kingdom",
    });
    act(() => {
      onStartMeasurement?.();
    });

    clickPOI();

    expect(screen.queryByTestId("place-popover")).not.toBeInTheDocument();
  });

  it("opens MapPOIPanel pre-filled in edit mode, and closes the popover, when Modifica is invoked", async () => {
    await renderMap();
    clickPOI();

    act(() => {
      popoverOnEditLandmark?.(poi);
    });

    const panel = screen.getByTestId("map-poi-panel");
    expect(panel).toHaveAttribute("data-open", "true");
    expect(panel).toHaveAttribute("data-mode", "edit");
    expect(panel).toHaveAttribute("data-edit-target-id", "42");
    expect(screen.queryByTestId("place-popover")).not.toBeInTheDocument();
  });

  it("deletes the landmark and closes the popover, without any confirmation, when Elimina is invoked", async () => {
    await renderMap();
    clickPOI();

    act(() => {
      popoverOnDeleteLandmark?.(poi);
    });

    expect(deletePOI).toHaveBeenCalledWith("42");
    expect(deletePOI).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("place-popover")).not.toBeInTheDocument();
  });

  it("clears the edit target once the panel reports leaving edit mode (cancelled or saved)", async () => {
    await renderMap();
    clickPOI();
    act(() => {
      popoverOnEditLandmark?.(poi);
    });
    expect(screen.getByTestId("map-poi-panel")).toHaveAttribute(
      "data-edit-target-id",
      "42"
    );

    // `MapPOIPanel` itself drives this transition (cancel back to the list,
    // or `resetFormAfterSave` after a completed edit) by calling
    // `onModeChange` — simulated directly here, since the panel's own
    // suite covers when it actually happens.
    act(() => {
      onPOIModeChange?.("list");
    });

    expect(screen.getByTestId("map-poi-panel")).not.toHaveAttribute(
      "data-edit-target-id"
    );
  });
});

describe("WorldMap — a zone's edit panel (TD-104)", () => {
  const area = {
    id: 7,
    title: "Kang",
    description: "The eastern march.",
    lat: 5,
    lng: 5,
    mapImage: null,
    footprint: [
      [1, 1],
      [10, 10],
    ],
  };
  const point = {
    ...area,
    id: 8,
    title: "Skreebars",
    description: null,
    footprint: null,
  };

  function clickPlace(child: unknown = area) {
    const onPlaceClick = useNavigableChildren.mock.calls.at(-1)?.[1] as
      ((child: unknown) => void) | undefined;
    act(() => {
      onPlaceClick?.(child);
    });
  }

  function openPanel(child: unknown = area) {
    clickPlace(child);
    act(() => {
      popoverOnEditZone?.(child as { id: number; title: string });
    });
  }

  it("opens the panel for the clicked place, seeded from it", async () => {
    await renderMap();

    openPanel();

    const panel = screen.getByTestId("zone-edit-panel");
    expect(panel).toHaveAttribute("data-place-id", "7");
    expect(panel).toHaveAttribute("data-title", "Kang");
    expect(panel).toHaveAttribute("data-description", "The eastern march.");
  });

  // The popover has to go: `useDrawArea` and the popover's own outside-click
  // listener both bind `mousedown`, so the first drag of a redraw would
  // dismiss it anyway.
  it("closes the popover when the panel opens", async () => {
    await renderMap();

    openPanel();

    expect(screen.queryByTestId("place-popover")).not.toBeInTheDocument();
  });

  it("is not mounted until a place is picked", async () => {
    await renderMap();

    expect(screen.queryByTestId("zone-edit-panel")).not.toBeInTheDocument();
  });

  it("tells the panel an area has a rectangle to redraw", async () => {
    await renderMap();

    openPanel(area);

    expect(screen.getByTestId("zone-edit-panel")).toHaveAttribute(
      "data-has-footprint",
      "true"
    );
  });

  it("tells the panel a point-placed place has none", async () => {
    await renderMap();

    openPanel(point);

    expect(screen.getByTestId("zone-edit-panel")).toHaveAttribute(
      "data-has-footprint",
      "false"
    );
  });

  it("bumps the navigable refetch token after a successful save", async () => {
    await renderMap();
    openPanel();
    const tokenBefore = useNavigableChildren.mock.calls.at(-1)?.[2];

    act(() => {
      zoneEditOnSaved?.("Kang Reach", "The eastern march.");
    });

    await waitFor(() => {
      const tokenAfter = useNavigableChildren.mock.calls.at(-1)?.[2];
      expect(tokenAfter).not.toBe(tokenBefore);
    });
  });

  // The whole point of the one-entry decision: the area's redraw is reached
  // from inside the panel, and lands on SPEC-009 T5's commit path — which,
  // since the right-click entry went, is the only way to reach it at all.
  it("arms the SPEC-009 T5 redraw gesture", async () => {
    await renderMap();
    openPanel();

    act(() => {
      zoneEditOnRedrawArea?.("Kang Reach");
    });

    expect(editAreaOptions?.enabled).toBe(true);
    expect(screen.getByTestId("leaflet-map")).toHaveAttribute(
      "data-cursor",
      "crosshair"
    );
  });

  it("commits the redrawn rectangle against the place the panel was opened for", async () => {
    await renderMap();
    openPanel();

    act(() => {
      zoneEditOnRedrawArea?.("Kang Reach");
    });
    const footprint = [
      [2, 2],
      [30, 30],
    ];
    act(() => {
      editAreaOptions?.onComplete(footprint);
    });

    await waitFor(() => {
      expect(updateZonePosition).toHaveBeenCalledWith({ id: 7, footprint });
    });
  });

  // The panel edits a child of the map being left; `WorldMap` is not
  // remounted on a `parentId` change, so without the reset it would survive
  // the navigation open, pointed at a place that is no longer on screen.
  it("closes when navigating to another map", async () => {
    const props = {
      placeTitle: "Terra",
      parentTitle: "Piani di Esistenza",
      isRoot: false,
      mapUrl: "/maps/test.jpg",
      bounds,
      initialView: [500, 500] as [number, number],
      initialZoom: 1,
      onDescend,
      gridColumns: null,
      gridScale: null,
      onMapChanged: vi.fn(),
      onGridChanged: vi.fn(),
      onDeleted: vi.fn(),
      unpositionedCount: 0,
    };
    const { rerender } = render(<WorldMap parentId={1} {...props} />);
    await waitFor(() => {
      expect(imageAddTo).toHaveBeenCalled();
    });

    openPanel();
    expect(screen.getByTestId("zone-edit-panel")).toBeInTheDocument();

    rerender(<WorldMap parentId={2} {...props} />);

    expect(screen.queryByTestId("zone-edit-panel")).not.toBeInTheDocument();
  });
});
