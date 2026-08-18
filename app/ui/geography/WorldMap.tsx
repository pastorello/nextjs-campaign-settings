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
import { useUnplacedChildren } from "@/app/modules/maps/hooks/useUnplacedChildren";
import { useDrawArea } from "@/app/modules/maps/hooks/useDrawArea";
import type { POICategory, POIGeoJSON } from "@/app/modules/maps/types/poi";
import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";
import isValidString from "@/app/lib/utils/validators/isValidString";
import createPlace from "@/app/lib/data/maps/createPlace";
import updateZonePosition from "@/app/lib/data/maps/updateZonePosition";
import AttachEntityButton from "@/app/ui/geography/AttachEntityButton";
import MapUploadControl from "@/app/ui/geography/MapUploadControl";
import DeletePlaceButton from "@/app/ui/geography/DeletePlaceButton";
import MapOptionsButton from "@/app/ui/geography/MapOptionsButton";
import {
  findContainingSibling,
  type Footprint,
} from "@/app/modules/maps/lib/utils/footprint";

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
 * `parentId` scopes the `kind: "poi"` panel (SPEC-002, via `usePOIManager`)
 * and the navigable-kind markers (SPEC-004 M7, via `useNavigableChildren`)
 * to the place currently being viewed — the fix for §1's "every POI renders
 * on every map" defect. `onDescend` is called when a navigable marker is
 * clicked; `GeographyExplorer` owns what happens next.
 *
 * `useLinkedEntityMarkers` (TD-70) is gone (SPEC-008 T8): an entity never
 * carries its own coordinates now, so it never gets an independent marker —
 * one attached to a landmark POI already renders at that POI's own marker,
 * one attached to a Zone directly renders nowhere on the map at all (§5).
 */
function WorldMap({
  parentId,
  placeTitle,
  parentTitle,
  isRoot,
  mapUrl,
  bounds,
  initialView,
  initialZoom,
  onDescend,
  onMapChanged,
  onDeleted,
}: {
  parentId: number;
  /** The place currently being viewed — named in the delete confirmation. */
  placeTitle: string;
  // Where this place's children/landmarks reparent to on delete (SPEC-010
  // T3) — the previous entry in `GeographyExplorer`'s navigation stack.
  // Meaningless (and unused) when `isRoot` is true, since the control isn't
  // rendered then.
  parentTitle: string;
  // The one zone with `parentId: null` (SPEC-010 rule 1) — withholds
  // `DeletePlaceButton` entirely rather than rendering it disabled.
  isRoot: boolean;
  mapUrl: string;
  bounds: L.LatLngBoundsExpression;
  initialView: L.LatLngExpression;
  initialZoom: number;
  onDescend: (child: NavigableChild) => void;
  // The place currently being viewed just got a map, or had its map
  // replaced (SPEC-007 T1) — `GeographyExplorer` owns the stack of places
  // being viewed, so it patches the current entry rather than this
  // component re-fetching anything.
  onMapChanged: (mapImage: string) => void;
  // The place currently being viewed was just deleted (SPEC-010 T3) —
  // `GeographyExplorer` pops it off the navigation stack.
  onDeleted: () => void;
}) {
  const t = useTranslations("geography.errors");
  const tEditArea = useTranslations("geography.editArea");
  const tContextMenu = useTranslations("geography.contextMenu");
  const tDrawArea = useTranslations("geography.drawArea");
  const tAttachEntity = useTranslations("geography.attachEntity");
  const tTemporaryMarkers = useTranslations("geography.temporaryMarkers");
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  // Consolidated map controls (usability fix, 2026-08-17): these three used
  // to be always-visible floating buttons of their own; now each is a
  // controlled dialog/picker, opened either from `MapOptionsButton`'s menu
  // (replace/delete this map) or `MapContextMenu`'s right-click menu
  // (attach an entity).
  const [isAttachEntityOpen, setIsAttachEntityOpen] = useState(false);
  const [isMapUploadOpen, setIsMapUploadOpen] = useState(false);
  const [isDeleteMapOpen, setIsDeleteMapOpen] = useState(false);
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
  // Draw-an-area mode (SPEC-009 T2) — armed by `MapContextMenu`'s "Add
  // sub-map" entry (ex-`DrawAreaButton`, consolidated 2026-08-17), consumed
  // by `useDrawArea`. `pendingFootprint` is the completed rectangle waiting for
  // the create form; mutually exclusive with `isSelectingPOILocation`/
  // `positioningPlace` (see their handlers below), the same way those two
  // already exclude each other implicitly by being distinct crosshair modes.
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [pendingFootprint, setPendingFootprint] = useState<Footprint | null>(
    null
  );
  // The area currently armed for a redraw-to-replace resize/move (SPEC-009
  // T5) — title is captured at arm time, the same reason `positioningPlace`
  // captures it, so a failure toast can name the area without re-reading
  // `areaChildren`. A fourth crosshair mode, mutually exclusive with the
  // other three the same way they already exclude each other.
  const [editingArea, setEditingArea] = useState<{
    id: number;
    title: string;
  } | null>(null);

  // Context menu hook
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    close: closeContextMenu,
  } = useMapContextMenu();

  // User markers hook — ephemeral, table-talk scratch pins (TD-86): no
  // persistence anywhere by design, so `clearMarkers` is this component's
  // only way to let the DM (or a player — this control isn't DM-gated) get
  // rid of them before a reload does it automatically. `removeMarker`
  // (per-marker) stays unused here; a bulk "clear temporary markers" control
  // was the simpler of the two dismiss shapes TD-86 proposed.
  const { markers, addMarker, clearMarkers } = useMapMarkers();

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
  } = usePOIManager(parentId);

  // Bumped after a successful region create so `useNavigableChildren`
  // reloads — its own effect only reruns on `parentId`/`refetchToken`
  // changing, and creating a place changes neither.
  const [placesRefetchToken, setPlacesRefetchToken] = useState(0);

  // Navigable `region` children, same scope — clicking one calls `onDescend`
  const navigableChildren = useNavigableChildren(
    parentId,
    onDescend,
    placesRefetchToken,
    editingArea?.id ?? null
  );

  // The subset drawn as areas rather than points (SPEC-009 T2) — the only
  // ones a coordinate can fall "inside" of. Used by T4 to withhold the
  // point-placing flows over ground that already belongs to a child area.
  const areaChildren = navigableChildren.filter(
    (child): child is NavigableChild & { footprint: Footprint } =>
      child.footprint !== null
  );

  // The right-clicked point falls inside an existing area (SPEC-009 T4) — the
  // context menu keeps "Copy Coordinates"/"Measure" there but withholds "Add
  // Place", since that ground belongs to the area's own map, one level down.
  const contextMenuOverArea = contextMenuPosition
    ? findContainingSibling(
        [contextMenuPosition.latlng.lat, contextMenuPosition.latlng.lng],
        areaChildren
      )
    : undefined;

  // This place's children with no position yet — always a Zone now (SPEC-008
  // T8: a landmark POI's `lat`/`lng` are required at creation) — feeds
  // MapPOIPanel's "Unplaced places" section (TD-71, SPEC-005 §5.A).
  const unplacedChildren = useUnplacedChildren(parentId, placesRefetchToken);

  // Creates a navigable place under the current parent (SPEC-004 M5, T2).
  // `kind: "poi"` never reaches this — the panel keeps that on the original
  // `addPOI` path (see createPlace.ts for why). `input.footprint`, when
  // present (SPEC-009 T2), rides straight through to `createPlace` — it
  // already validates and derives the centre (T1).
  //
  // Returns the server's own refusal message on failure rather than a bare
  // boolean: `createPlace` already names exactly what went wrong ("Overlaps
  // an existing area: Kang.", "This area is too small to draw.") — without
  // threading it through, `MapPOIPanel` could only show a generic "could
  // not save," which makes a drawn-and-refused area look unexplained.
  const handleAddPlace = useCallback(
    async (input: AddPlaceInput): Promise<{ ok: boolean; error?: string }> => {
      const result = await createPlace({ ...input, parentId });
      if (result.ok) {
        setPlacesRefetchToken((token) => token + 1);
        return { ok: true };
      }
      const firstError = Object.values(result.errors ?? {})
        .flat()
        .find((message): message is string => typeof message === "string");
      return {
        ok: false,
        ...(firstError !== undefined && { error: firstError }),
      };
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
    setPendingFootprint(null);
    // Reset coordinates and category after a brief delay to allow panel to close smoothly
    setTimeout(() => {
      setPOIFilterCategory(null);
      setPOIInitialCoords(null);
    }, 100);
  }, []);

  // A drawn rectangle is "spent" once the create form no longer needs it —
  // a successful save, backing out to the list, or starting a fresh
  // (non-area) add (SPEC-009 T2). Without this, a stale footprint could
  // otherwise attach itself to an unrelated point-based place.
  const handleFootprintConsumed = useCallback(() => {
    setPendingFootprint(null);
  }, []);

  // Toggles positioning mode for an unplaced child (TD-71, SPEC-005 §5.A):
  // choosing the one already being positioned cancels it, choosing a
  // different one switches the target. Also cancels draw-area mode
  // (SPEC-009 T2) — the crosshair-mode toggles are mutually exclusive.
  const handlePositionPlace = useCallback(
    (id: number) => {
      setIsDrawingArea(false);
      setEditingArea(null);
      setPositioningPlace((prev) => {
        if (prev?.id === id) return null;
        const child = unplacedChildren.find((candidate) => candidate.id === id);
        return child ? { id: child.id, title: child.title } : null;
      });
    },
    [unplacedChildren]
  );

  // Handle POI location selection request. Also cancels draw-area mode
  // (SPEC-009 T2) — see `handlePositionPlace`.
  const handleRequestPOILocation = useCallback(() => {
    setIsDrawingArea(false);
    setEditingArea(null);
    setIsSelectingPOILocation((prev) => !prev);
  }, []);

  // Arms/disarms draw-area mode (SPEC-009 T2), cancelling the other
  // crosshair modes the same way they cancel this one.
  const handleToggleDrawArea = useCallback(() => {
    setIsSelectingPOILocation(false);
    setPositioningPlace(null);
    setEditingArea(null);
    setCursorCoords(null);
    setIsDrawingArea((prev) => !prev);
  }, []);

  // Arms the redraw-to-replace gesture on the area the context menu was
  // opened over (SPEC-009 T5) — the mirror of `handleToggleDrawArea`,
  // cancelling the other crosshair modes for the same reason.
  const handleEditArea = useCallback(() => {
    if (!contextMenuOverArea) return;
    setIsDrawingArea(false);
    setIsSelectingPOILocation(false);
    setPositioningPlace(null);
    setCursorCoords(null);
    setEditingArea({
      id: contextMenuOverArea.id,
      title: contextMenuOverArea.title,
    });
  }, [contextMenuOverArea]);

  // The hook aborted the redraw gesture itself (Escape, a too-small drag)
  // and wants editing disarmed — the edit-mode counterpart of
  // `handleDrawAreaCancelled`.
  const handleAreaEditCancelled = useCallback(() => {
    setEditingArea(null);
  }, []);

  // A replacement rectangle finished drawing over the area being edited
  // (SPEC-009 T5) — re-runs both §7 checks server-side via
  // `updateZonePosition`, excluding the area's own row from its sibling
  // comparison. No optimistic update: the old rectangle stays hidden
  // (`editingArea`'s id passed to `useNavigableChildren`) until the server
  // confirms, then a refetch renders the new one.
  const handleAreaEditDrawn = useCallback(
    async (footprint: Footprint) => {
      if (!editingArea) return;
      const { id, title } = editingArea;
      setEditingArea(null);
      try {
        const result = await updateZonePosition({ id, footprint });
        if (result.ok) {
          setPlacesRefetchToken((token) => token + 1);
        } else {
          const firstError = Object.values(result.errors ?? {})
            .flat()
            .find((message): message is string => typeof message === "string");
          toast.error(firstError ?? t("placePositionFailed", { title }));
        }
      } catch (error) {
        console.error("Failed to resize/move area:", error);
        toast.error(t("placePositionFailed", { title }));
      }
    },
    [editingArea, t]
  );

  // A rectangle finished drawing (SPEC-009 T2) — opens the create form with
  // the footprint attached, the same shape `handleContextMenuAddPOI` uses
  // for a point.
  const handleAreaDrawn = useCallback((footprint: Footprint) => {
    setPendingFootprint(footprint);
    setIsDrawingArea(false);
    setPOIFilterCategory(null);
    setPOIPanelMode("add");
    setIsPOIPanelOpen(true);
  }, []);

  // The hook aborted the gesture itself (Escape, a too-small drag) and
  // wants the button disarmed (SPEC-009 T2).
  const handleDrawAreaCancelled = useCallback(() => {
    setIsDrawingArea(false);
  }, []);

  // Drag-to-draw an area on the current map (SPEC-009 T2) — armed by
  // `isDrawingArea`, disarmed by `handleAreaDrawn` on a completed rectangle
  // or by `handleDrawAreaCancelled`.
  useDrawArea({
    enabled: isDrawingArea,
    bounds,
    onComplete: handleAreaDrawn,
    onCancel: handleDrawAreaCancelled,
  });

  // Redraw-to-replace an existing area's rectangle (SPEC-009 T5) — armed by
  // `editingArea` (via the context menu's "Edit Area"), disarmed by
  // `handleAreaEditDrawn` on a completed rectangle or by
  // `handleAreaEditCancelled`. A second, independent `useDrawArea` instance
  // rather than a mode flag on the one above: the two are mutually
  // exclusive by construction (every handler that sets one clears the
  // other), so only one is ever actually enabled.
  useDrawArea({
    enabled: editingArea !== null,
    bounds,
    onComplete: (footprint) => void handleAreaEditDrawn(footprint),
    onCancel: handleAreaEditCancelled,
  });

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
  // the crosshair mode. Positioning always targets a Zone (SPEC-008 T8: a
  // landmark POI's `lat`/`lng` are required at creation, so nothing else
  // can ever be "unplaced").
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (positioningPlace) {
        // Clicking inside an existing area descends into it instead of
        // repositioning the place there (SPEC-009 T4/§3 rule 3) — the pin
        // belongs on the area's own map, one level down, not at this one.
        const containingArea = findContainingSibling([lat, lng], areaChildren);
        if (containingArea) {
          setPositioningPlace(null);
          setCursorCoords(null);
          onDescend(containingArea);
          return;
        }

        const { id, title } = positioningPlace;
        setPositioningPlace(null);
        setCursorCoords(null);
        void (async () => {
          try {
            const result = await updateZonePosition({ id, lat, lng });
            if (result.ok) {
              setPlacesRefetchToken((token) => token + 1);
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
        // Same rule as above — the "Add Place" panel stays open (this
        // component doesn't remount on descend), so whatever the DM already
        // typed survives and the same click can be made one level down.
        const containingArea = findContainingSibling([lat, lng], areaChildren);
        if (containingArea) {
          setIsSelectingPOILocation(false);
          setCursorCoords(null);
          onDescend(containingArea);
          return;
        }

        setPOIInitialCoords({ lat, lng });
        setIsSelectingPOILocation(false);
        setCursorCoords(null);
      }
    },
    [positioningPlace, isSelectingPOILocation, areaChildren, onDescend, t]
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
    setEditingArea(null);
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
    // A blank `mapUrl` is a legitimate state now (SPEC-007 T1) — a
    // positioned place that has never been given a map of its own renders
    // as empty ground with `MapUploadControl` on it, not an error.
    if (!isValidString(mapUrl)) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- currentImage intentionally omitted to prevent infinite loop
  }, [map, mapUrl]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map */}
      <LeafletMap
        className="w-full h-full"
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        cursorStyle={
          isSelectingPOILocation ||
          positioningPlace ||
          isDrawingArea ||
          editingArea
            ? "crosshair"
            : "grab"
        }
      ></LeafletMap>

      {/* Map Controls, plus the "administer this map" entry point
          (usability fix, 2026-08-17): replace/delete this map, stacked
          above zoom/reset/fullscreen via MapControls' extraControls slot. */}
      <MapControls
        extraControls={
          <MapOptionsButton
            hasMap={isValidString(mapUrl)}
            isRoot={isRoot}
            onReplaceMap={() => setIsMapUploadOpen(true)}
            onDeleteMap={() => setIsDeleteMapOpen(true)}
          />
        }
      />

      {/* Dismiss the temporary markers (TD-86) — a scratch pin for table
          talk, not a record of anything, so its only UI besides "add" is
          "clear them all." Visible to every viewer, not just the DM
          (TD-86: "this one is for players too"). */}
      {markers.length > 0 && (
        <button
          type="button"
          onClick={clearMarkers}
          className="absolute top-4 right-4 z-[1000] flex items-center gap-2 rounded-lg bg-white dark:bg-slate-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
        >
          {tTemporaryMarkers("clear", { count: markers.length })}
        </button>
      )}

      {/* Attach an existing NPC/deity to the place currently being viewed
          (SPEC-008 §5/T5) — the map's own entry point into the assignment
          modal, alongside the admin list's per-row button. Externally
          controlled, opened from `MapContextMenu`'s right-click menu
          (usability fix, 2026-08-17). */}
      <AttachEntityButton
        zoneId={parentId}
        isOpen={isAttachEntityOpen}
        onClose={() => setIsAttachEntityOpen(false)}
        onAttached={() => setPlacesRefetchToken((token) => token + 1)}
      />

      {/* Give the place currently being viewed a map, or replace it
          (SPEC-007 T1). Externally controlled, opened from
          `MapOptionsButton`'s menu (usability fix, 2026-08-17). */}
      <MapUploadControl
        placeId={parentId}
        hasMap={isValidString(mapUrl)}
        isOpen={isMapUploadOpen}
        onClose={() => setIsMapUploadOpen(false)}
        onMapChanged={onMapChanged}
      />

      {/* Delete the place currently being viewed (SPEC-010 T3) — absent for
          the root (rule 1). Externally controlled, opened from
          `MapOptionsButton`'s menu (usability fix, 2026-08-17). */}
      <DeletePlaceButton
        placeId={parentId}
        placeTitle={placeTitle}
        parentTitle={parentTitle}
        isRoot={isRoot}
        isOpen={isDeleteMapOpen}
        onClose={() => setIsDeleteMapOpen(false)}
        onDeleted={onDeleted}
      />

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
        hideAddPlace={!!contextMenuOverArea}
        onEditArea={handleEditArea}
        showEditArea={!!contextMenuOverArea}
        editAreaLabel={tEditArea("trigger")}
        editAreaSublabel={tEditArea("sublabel")}
        ariaLabel={tContextMenu("ariaLabel")}
        copyCoordinatesLabel={tContextMenu("copyCoordinates")}
        copiedLabel={tContextMenu("copiedLabel")}
        addMarkerLabel={tContextMenu("addMarker.trigger")}
        addMarkerSublabel={tContextMenu("addMarker.sublabel")}
        measureLabel={tContextMenu("measure.trigger")}
        measureSublabel={tContextMenu("measure.sublabel")}
        addPlaceLabel={tContextMenu("addPlace.trigger")}
        addPlaceSublabel={tContextMenu("addPlace.sublabel")}
        onAddSubMap={handleToggleDrawArea}
        addSubMapLabel={tDrawArea("trigger")}
        onAttachEntity={() => setIsAttachEntityOpen(true)}
        attachEntityLabel={tAttachEntity("trigger")}
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
        pendingFootprint={pendingFootprint}
        onFootprintConsumed={handleFootprintConsumed}
      />
    </div>
  );
}

export default WorldMap;
