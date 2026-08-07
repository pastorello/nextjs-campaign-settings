"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LeafletMap } from "@/app/modules/maps/components/map/LeafletMap";
import { MapControls } from "@/app/modules/maps/components/map/MapControls";
import { MapMeasurementPanel } from "@/app/modules/maps/components/map/MapMeasurementPanel";
import { MapContextMenu } from "@/app/modules/maps/components/map/MapContextMenu";
import {
  MapPOIPanel,
  type AddPlaceInput,
} from "@/app/modules/maps/components/map/MapPOIPanel";
import { useMapContextMenu } from "@/app/modules/maps/hooks/useMapContextMenu";
import { useMapMarkers } from "@/app/modules/maps/hooks/useMapMarkers";
import { usePOIManager } from "@/app/modules/maps/hooks/usePOIManager";
import {
  useNavigableChildren,
  type NavigableChild,
} from "@/app/modules/maps/hooks/useNavigableChildren";
import { useLinkedEntityMarkers } from "@/app/modules/maps/hooks/useLinkedEntityMarkers";
import { useUnplacedChildren } from "@/app/modules/maps/hooks/useUnplacedChildren";
import type { POICategory, POIGeoJSON } from "@/app/modules/maps/types/poi";
import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";
import isValidString from "@/app/lib/utils/validators/isValidString";
import { notifyError } from "@/app/lib/notifications/notify";
import createPlace from "@/app/lib/data/maps/createPlace";
import updatePoiAction from "@/app/lib/data/maps/updatePoi";

/**
 * WorldMap - the map view backing `/dashboard/geography`.
 *
 * A work-in-progress MVP over the vendored `app/modules/maps` module: it
 * wires up the panels and hooks the current UI actually reaches (POI CRUD,
 * measurement, the context menu, zoom/reset/fullscreen), not the module's
 * full component set. Country search/selection and its details panel are
 * not wired here yet — there is no entry point into them (TD-46) — so this
 * file omits them rather than carrying dead state for a feature nothing
 * triggers. See CLAUDE.md, "unused is not dead", for what's still scaffolding.
 *
 * `parentId` scopes the `kind: "poi"` panel (SPEC-002, via `usePOIManager`),
 * the navigable-kind markers (SPEC-004 M7, via `useNavigableChildren`) and
 * the `deity`/`npc` markers (TD-70, via `useLinkedEntityMarkers`) to the
 * place currently being viewed — the fix for §1's "every POI renders on
 * every map" defect. `onDescend` is called when a navigable marker is
 * clicked; `GeographyExplorer` owns what happens next.
 */
function WorldMap({
  parentId,
  mapUrl,
  bounds,
  initialView,
  initialZoom,
  onDescend,
}: {
  parentId: number;
  mapUrl: string;
  bounds: L.LatLngBoundsExpression;
  initialView: L.LatLngExpression;
  initialZoom: number;
  onDescend: (child: NavigableChild) => void;
}) {
  const t = useTranslations("geography.errors");
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [isPOIPanelOpen, setIsPOIPanelOpen] = useState(false);
  const [poiFilterCategory, setPOIFilterCategory] =
    useState<POICategory | null>(null);
  const [poiInitialCoords, setPOIInitialCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [poiPanelMode, setPOIPanelMode] = useState<"list" | "add">("list");
  const [isSelectingPOILocation, setIsSelectingPOILocation] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // The unplaced child currently being positioned (TD-71, SPEC-005 §5.A) —
  // title is captured at selection time so a failure toast can name it
  // without re-reading `unplacedChildren`, which may have moved on by then.
  const [positioningPlace, setPositioningPlace] = useState<{
    id: number;
    title: string;
  } | null>(null);

  // Context menu hook
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    close: closeContextMenu,
  } = useMapContextMenu();

  // User markers hook
  const { addMarker } = useMapMarkers();

  // POI Manager hook, scoped to the place currently being viewed
  const {
    pois,
    addPOI,
    updatePOI,
    deletePOI,
    clearAllPOIs,
    exportGeoJSON,
    importGeoJSON,
    flyToPOI,
    reloadPOIs,
  } = usePOIManager(parentId);

  // Bumped after a successful region/deity/npc create so
  // `useNavigableChildren` reloads — its own effect only reruns on
  // `parentId`/`refetchToken` changing, and creating a place changes neither.
  const [placesRefetchToken, setPlacesRefetchToken] = useState(0);

  // Navigable `region` children, same scope — clicking one calls `onDescend`
  useNavigableChildren(parentId, onDescend, placesRefetchToken);

  // `deity`/`npc` children with coordinates, same scope and refetch trigger
  // (TD-70) — leaves, not navigable, so no `onDescend` wiring.
  useLinkedEntityMarkers(parentId, placesRefetchToken);

  // This place's children with no position yet, any kind (TD-71, SPEC-005
  // §5.A) — feeds MapPOIPanel's "Unplaced places" section.
  const unplacedChildren = useUnplacedChildren(parentId, placesRefetchToken);

  // Creates a navigable/deity/npc place under the current parent (SPEC-004
  // M5, T2). `kind: "poi"` never reaches this — the panel keeps that on the
  // original `addPOI` path (see createPlace.ts for why).
  const handleAddPlace = useCallback(
    async (input: AddPlaceInput): Promise<boolean> => {
      const result = await createPlace({ ...input, parentId });
      if (result.ok) {
        setPlacesRefetchToken((token) => token + 1);
      }
      return result.ok;
    },
    [parentId]
  );

  const map = useLeafletMap();
  const [currentImage, setCurrentImage] = useState<L.ImageOverlay | null>(null);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleMeasurementClose = useCallback(() => {
    setIsMeasurementOpen(false);
  }, []);

  // Context menu handlers
  const handleAddMarker = useCallback(
    (lat: number, lng: number) => {
      void addMarker(lat, lng);
    },
    [addMarker]
  );

  const handleContextMenuMeasurement = useCallback(() => {
    setIsMeasurementOpen(true);
  }, []);

  const handleContextMenuAddPOI = useCallback((lat: number, lng: number) => {
    // Always set fresh coordinates - this ensures updates even if panel is already open
    setPOIInitialCoords({ lat, lng });
    setPOIFilterCategory(null);
    setPOIPanelMode("add");
    setIsPOIPanelOpen(true);
  }, []);

  // POI Panel handlers
  const handleClosePOIPanel = useCallback(() => {
    setIsPOIPanelOpen(false);
    setIsSelectingPOILocation(false);
    setPositioningPlace(null);
    setPOIPanelMode("list");
    // Reset coordinates and category after a brief delay to allow panel to close smoothly
    setTimeout(() => {
      setPOIFilterCategory(null);
      setPOIInitialCoords(null);
    }, 100);
  }, []);

  // Toggles positioning mode for an unplaced child (TD-71, SPEC-005 §5.A):
  // choosing the one already being positioned cancels it, choosing a
  // different one switches the target.
  const handlePositionPlace = useCallback(
    (id: number) => {
      setPositioningPlace((prev) => {
        if (prev?.id === id) return null;
        const child = unplacedChildren.find((candidate) => candidate.id === id);
        return child ? { id: child.id, title: child.title } : null;
      });
    },
    [unplacedChildren]
  );

  // Handle POI location selection request
  const handleRequestPOILocation = useCallback(() => {
    setIsSelectingPOILocation((prev) => !prev);
  }, []);

  // Handle clear POI coordinates
  const handleClearPOICoordinates = useCallback(() => {
    setPOIInitialCoords(null);
    setCursorCoords(null);
    setIsSelectingPOILocation(false);
  }, []);

  // Handle POI panel mode change
  const handlePOIModeChange = useCallback((mode: "list" | "add" | "edit") => {
    setPOIPanelMode(mode as "list" | "add");
  }, []);

  // Handle map click for POI location selection, and for positioning an
  // existing unplaced place (TD-71, SPEC-005 §5.A) — the two flows share
  // the crosshair mode, but positioning writes to an existing row via
  // `updatePoi` instead of seeding the "add" form.
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (positioningPlace) {
        const { id, title } = positioningPlace;
        setPositioningPlace(null);
        setCursorCoords(null);
        void (async () => {
          try {
            const result = await updatePoiAction({ id, lat, lng });
            if (result.ok) {
              setPlacesRefetchToken((token) => token + 1);
              void reloadPOIs();
            } else {
              toast.error(t("placePositionFailed", { title }));
            }
          } catch (error) {
            console.error("Failed to position place:", error);
            toast.error(t("placePositionFailed", { title }));
          }
        })();
        return;
      }

      if (isSelectingPOILocation) {
        setPOIInitialCoords({ lat, lng });
        setIsSelectingPOILocation(false);
        setCursorCoords(null);
      }
    },
    [positioningPlace, isSelectingPOILocation, reloadPOIs, t]
  );

  // Handle map mouse move for cursor tracking
  const handleMapMouseMove = useCallback(
    (lat: number, lng: number) => {
      if (isSelectingPOILocation || positioningPlace) {
        setCursorCoords({ lat, lng });
      }
    },
    [isSelectingPOILocation, positioningPlace]
  );

  // Cancel any in-progress positioning when the DM navigates to a different
  // map (TD-71, SPEC-005 §5.A edge case) — `WorldMap` isn't remounted on
  // `parentId` change, so this state would otherwise survive the navigation
  // and point at a place that no longer belongs to the map being viewed.
  // The "adjusting state during render" pattern (React docs, "You Might Not
  // Need an Effect"), not a `useEffect` — `MapSearchBar` already uses this
  // exact shape for the same reason: a `setState` inside an effect body
  // trips `react-hooks/set-state-in-effect`.
  const [prevParentId, setPrevParentId] = useState(parentId);
  if (parentId !== prevParentId) {
    setPrevParentId(parentId);
    setPositioningPlace(null);
    setCursorCoords(null);
  }

  const handlePOIExport = useCallback(() => {
    const geojson = exportGeoJSON();
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-places-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportGeoJSON]);

  const handlePOIImport = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const geojson = JSON.parse(text) as POIGeoJSON;
        const count = importGeoJSON(geojson);
        toast.success(t("importSuccess", { count }));
      } catch (error) {
        console.error("Failed to import POIs:", error);
        toast.error(t("importFailed"));
      }
    },
    [importGeoJSON, t]
  );

  useEffect(() => {
    if (!isValidString(mapUrl)) {
      notifyError(t("mapNotConfigured"));
      return;
    }

    let cancelled = false;

    // The dynamic `import()` is the only genuinely async step; everything
    // that follows (building the overlay, committing state) runs in this
    // `.then()` callback rather than after an `await` inside an async
    // function passed straight to the effect — the shape the React Compiler
    // lint rule can actually see through (TD-64).
    import("leaflet")
      .then((L) => {
        if (cancelled) return;

        // Remove existing image overlay if present
        if (currentImage && map) {
          currentImage.remove();
          setCurrentImage(null);
        }

        const image = L.imageOverlay(mapUrl, bounds);

        if (map) {
          image.addTo(map);
          map.setMinZoom(0);
          map.setZoom(0);
          map.setMaxZoom(10);
          map.setMaxBounds(bounds);
          map.fitBounds(bounds);
          map.setView(initialView, initialZoom);
          setCurrentImage(image);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to initialize map image:", error);
      });

    return () => {
      cancelled = true;
    };
    // `currentImage` is read (to remove the previous overlay) and set by this
    // effect; adding it to the dependency list would re-run the effect every
    // time it sets that state, reloading the same map image in an infinite
    // loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapUrl]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map */}
      <LeafletMap
        className="w-full h-full"
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        cursorStyle={
          isSelectingPOILocation || positioningPlace ? "crosshair" : "grab"
        }
      ></LeafletMap>

      {/* Map Controls */}
      <MapControls />

      {/* Measurement Panel */}
      <MapMeasurementPanel
        isOpen={isMeasurementOpen}
        onClose={handleMeasurementClose}
      />

      {/* Context Menu */}
      <MapContextMenu
        isOpen={isContextMenuOpen}
        position={contextMenuPosition}
        onClose={closeContextMenu}
        onAddMarker={handleAddMarker}
        onStartMeasurement={handleContextMenuMeasurement}
        onAddPOI={handleContextMenuAddPOI}
      />

      {/* POI Panel */}
      <MapPOIPanel
        isOpen={isPOIPanelOpen}
        onClose={handleClosePOIPanel}
        pois={pois}
        filterCategory={poiFilterCategory}
        onAddPOI={addPOI}
        onUpdatePOI={updatePOI}
        onDeletePOI={deletePOI}
        onClearAll={clearAllPOIs}
        onExport={handlePOIExport}
        onImport={(file) => void handlePOIImport(file)}
        onFlyTo={flyToPOI}
        onRequestLocation={handleRequestPOILocation}
        onClearCoordinates={handleClearPOICoordinates}
        onModeChange={handlePOIModeChange}
        isSelectingLocation={isSelectingPOILocation}
        initialLat={poiInitialCoords?.lat}
        initialLng={poiInitialCoords?.lng}
        cursorLat={cursorCoords?.lat}
        cursorLng={cursorCoords?.lng}
        mode={poiPanelMode}
        onAddPlace={handleAddPlace}
        unplacedChildren={unplacedChildren}
        onPositionPlace={handlePositionPlace}
        positioningPlaceId={positioningPlace?.id ?? null}
      />
    </div>
  );
}

export default WorldMap;
