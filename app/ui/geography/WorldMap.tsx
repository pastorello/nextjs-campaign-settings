"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { LeafletMap } from "@/app/modules/maps/components/map/LeafletMap";
import { MapControls } from "@/app/modules/maps/components/map/MapControls";
import MapMeasureTool from "@/app/ui/geography/MapMeasureTool";
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
import type { POI } from "@/app/modules/maps/types/poi";
import isValidString from "@/app/lib/utils/validators/isValidString";
import createPlace from "@/app/lib/data/maps/createPlace";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import PlacePopover from "@/app/ui/geography/PlacePopover";
import MapUploadControl from "@/app/ui/geography/MapUploadControl";
import DeletePlaceButton from "@/app/ui/geography/DeletePlaceButton";
import MapOptionsButton from "@/app/ui/geography/MapOptionsButton";
import MapGridConfigPanel from "@/app/ui/geography/MapGridConfigPanel";
import ZoneEditPanel from "@/app/ui/geography/ZoneEditPanel";
import MapGridToggle from "@/app/ui/geography/MapGridToggle";
import MapGridOverlay from "@/app/ui/geography/MapGridOverlay";
import {
  findContainingSibling,
  type Footprint,
} from "@/app/modules/maps/lib/utils/footprint";
import { useMapImageOverlay } from "@/app/ui/geography/hooks/useMapImageOverlay";
import { usePOIFileIO } from "@/app/ui/geography/hooks/usePOIFileIO";
import { usePOIPanel } from "@/app/ui/geography/hooks/usePOIPanel";
import { useAreaDrawing } from "@/app/ui/geography/hooks/useAreaDrawing";
import { usePlacePopover } from "@/app/ui/geography/hooks/usePlacePopover";
import { useMeasureTool } from "@/app/ui/geography/hooks/useMeasureTool";
import { usePlacePositioning } from "@/app/ui/geography/hooks/usePlacePositioning";

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
 *
 * Each concern this component used to hold inline lives in its own hook
 * under `./hooks/` (TD-127): the image overlay, the measure tool, the
 * popover, the POI panel, area drawing, positioning unplaced places, and
 * GeoJSON file IO. What stays here is the wiring between them — the places
 * refetch token, the crosshair modes' mutual exclusion, the map-click
 * containment check — plus the landmark popover actions, which need
 * `usePOIManager`, which in turn needs `usePlacePopover`'s click handler.
 */

function WorldMap({
  parentId,
  ancestorIds,
  placeTitle,
  parentTitle,
  isRoot,
  mapUrl,
  bounds,
  initialView,
  initialZoom,
  gridColumns,
  gridScale,
  onDescend,
  onMapChanged,
  onGridChanged,
  onDeleted,
  unpositionedCount,
  blockedUnpositionedCount = 0,
}: {
  parentId: number;
  // This map's own ancestor chain, itself included — `GeographyExplorer`'s
  // navigation stack, which is exactly that (SPEC-017 T8). Used to leave
  // out of the pool the places that contain this map: T5 refuses them at
  // the mutation, and offering a row only to reject it is worse than not
  // offering it.
  ancestorIds: number[];
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
  // The stored grid configuration for the place currently being viewed
  // (SPEC-015 §6), both null until the DM sets one — carried on the stack
  // entry like `mapUrl` is.
  gridColumns: number | null;
  gridScale: string | null;
  onDescend: (child: NavigableChild) => void;
  // The place currently being viewed just got a map, or had its map
  // replaced (SPEC-007 T1) — `GeographyExplorer` owns the stack of places
  // being viewed, so it patches the current entry rather than this
  // component re-fetching anything.
  onMapChanged: (mapImage: string) => void;
  // The place currently being viewed just got its grid configured
  // (SPEC-015 T5) — same patch-the-stack shape as `onMapChanged`.
  onGridChanged: (gridColumns: number, gridScale: string) => void;
  // The place currently being viewed was just deleted (SPEC-010 T3) —
  // `GeographyExplorer` pops it off the navigation stack.
  onDeleted: () => void;
  // Tree-wide, not scoped to the place in view — how many places anywhere
  // in the campaign still have no position (SPEC-007 T2's
  // `countUnpositionedPlaces`). Used to be its own header label in
  // `GeographyExplorer`; TD-85 moved it here, beside the context menu's
  // "Posiziona luogo" entry, since a number with no action attached to it
  // was noise (DM, 2026-08-18). Reused as-is, not recomputed per place —
  // see the context menu's own prop comment for why that's still correct.
  unpositionedCount: number;
  // Of `unpositionedCount`, how many are unpositioned because their own
  // parent has no map yet rather than simply not being drawn on one that
  // exists (TD-79, `countBlockedUnpositionedPlaces`). Optional, defaulting
  // to 0: every test call site but the real page can omit it, and the
  // sublabel text is unchanged from before TD-79 when it's 0.
  blockedUnpositionedCount?: number;
}) {
  const tRoot = useTranslations();
  const tGeography = useTranslations("geography");
  const tContextMenu = useTranslations("geography.contextMenu");
  const tDrawArea = useTranslations("geography.drawArea");
  const tTemporaryMarkers = useTranslations("geography.temporaryMarkers");
  // Consolidated map controls (usability fix, 2026-08-17): these used to be
  // always-visible floating buttons of their own; now each is a controlled
  // dialog/picker opened from `MapOptionsButton`'s "administer this map"
  // menu. Attaching an entity used to be here too, opened from
  // `MapContextMenu`'s right-click menu — SPEC-016 T8 removed that entry
  // (TD-96); `PlacePopover` mounts its own `AttachEntityButton`, pre-filled
  // with the clicked place, so there is nothing left for `WorldMap` to own.
  const [isMapUploadOpen, setIsMapUploadOpen] = useState(false);
  const [isDeleteMapOpen, setIsDeleteMapOpen] = useState(false);
  const [isGridConfigOpen, setIsGridConfigOpen] = useState(false);
  // The grid overlay's toggle (SPEC-015 §5 step 5) — off on every load and
  // never persisted (§9, decided 2026-08-20; do not add storage for it).
  const [isGridVisible, setIsGridVisible] = useState(false);
  // The place whose "Modifica" panel is open (TD-104). Holds the whole
  // `NavigableChild` because the panel seeds three things from it — name,
  // description, and whether there is a footprint to redraw — and because
  // mounting on this value rather than gating a permanently-mounted panel
  // with `isOpen` is what makes the seeding correct for free: editing place
  // A and then place B mounts a fresh form, so there is no stale-target
  // clearing dance of the kind `usePOIPanel`'s `editTarget` needs.
  const [editingZone, setEditingZone] = useState<NavigableChild | null>(null);

  // Context menu hook
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    close: closeContextMenu,
    runWithoutClosing,
  } = useMapContextMenu();

  const { effectiveBounds, imageSize } = useMapImageOverlay({
    mapUrl,
    bounds,
    initialView,
    initialZoom,
    runWithoutClosing,
  });

  const {
    isMeasuring,
    start: handleContextMenuMeasurement,
    exit: handleMeasureExit,
  } = useMeasureTool({ parentId, gridColumns, gridScale, imageSize });

  // User markers hook — ephemeral, table-talk scratch pins (TD-86): no
  // persistence anywhere by design, so `clearMarkers` is this component's
  // only way to let the DM (or a player — this control isn't DM-gated) get
  // rid of them before a reload does it automatically. `removeMarker`
  // (per-marker) stays unused here; a bulk "clear temporary markers" control
  // was the simpler of the two dismiss shapes TD-86 proposed.
  const { markers, addMarker, clearMarkers } = useMapMarkers();

  // Bumped after a successful region create so `useNavigableChildren`
  // reloads — its own effect only reruns on `parentId`/`refetchToken`
  // changing, and creating a place changes neither.
  const [placesRefetchToken, setPlacesRefetchToken] = useState(0);
  const bumpPlacesRefetchToken = useCallback(() => {
    setPlacesRefetchToken((token) => token + 1);
  }, []);

  const {
    target: popoverTarget,
    returnFocusTo: popoverReturnFocusTo,
    close: handleClosePopover,
    handlePOIClick,
    handlePlaceClick,
    handleOpenMap,
    handleUnplace,
    handlePlaceDeleted: handlePopoverPlaceDeleted,
  } = usePlacePopover({
    parentId,
    isMeasuring,
    onDescend,
    onPlacesChanged: bumpPlacesRefetchToken,
  });

  // POI Manager hook, scoped to the place currently being viewed
  const {
    pois,
    addPOI,
    updatePOI,
    deletePOI,
    unplacePOI,
    clearAllPOIs,
    exportGeoJSON,
    importGeoJSON,
    flyToPOI,
    reloadPOIs,
  } = usePOIManager(parentId, handlePOIClick);

  const poiPanel = usePOIPanel({ parentId });
  // Destructured where a callback below depends on it; the JSX reads the
  // rest straight off `poiPanel`.
  const {
    isSelectingLocation: isSelectingPOILocation,
    cancelLocationSelection,
    toggleLocationSelection,
    pickLocation,
    openAddForFootprint,
    openEdit: openPOIPanelForEdit,
  } = poiPanel;

  // "Modifica" (SPEC-016 T7) — opens the shared `MapPOIPanel` drawer already
  // in edit mode, pre-filled with the clicked landmark (`editTarget`,
  // consumed by the panel's own seeding effect). The popover closes: the
  // DM's focus has moved to the edit form, the same way "Apri mappa"
  // already closes it for a zone.
  const handleEditLandmark = useCallback(
    (poi: POI) => {
      openPOIPanelForEdit(poi);
      handleClosePopover();
    },
    [openPOIPanelForEdit, handleClosePopover]
  );

  // "Modifica" (TD-104) — opens `ZoneEditPanel` for the clicked place. The
  // popover closes for the same reason it does for a landmark: the DM's
  // focus has moved to the form. It has to, besides — `useDrawArea` and the
  // popover's own outside-click listener both bind `mousedown`, so a
  // popover left open would be dismissed by the first drag of a redraw
  // anyway.
  const handleEditZone = useCallback(
    (place: NavigableChild) => {
      setEditingZone(place);
      handleClosePopover();
    },
    [handleClosePopover]
  );

  // The panel committed a name/description. Nothing here holds those two
  // directly — `useNavigableChildren` owns the list the map draws from — so
  // a refetch is the whole update, the same bookkeeping every other place
  // mutation on this component does.
  const handleZoneEdited = bumpPlacesRefetchToken;

  /**
   * "Sposta nei luoghi non posizionati" for a landmark (SPEC-017 T10) —
   * `handleUnplace`'s counterpart on the other table, and shaped like
   * `handleDeleteLandmark` rather than like its zone twin: the mutation,
   * the marker's removal and the rollback if the write fails all belong to
   * `usePOIManager`, which is also the only thing that knows the row's real
   * id (`POI.id` is a client id `addPOI` never swaps).
   *
   * The token bump is this component's, though: the pool the landmark has
   * just rejoined is a different list from the markers — and it waits for
   * the write, rather than firing alongside it. `unplacePOI` queues its
   * mutation, so bumping the token the moment the queue accepts the task
   * re-reads the database before it has changed and the pool comes back
   * without the landmark. An e2e caught exactly that.
   */
  const handleUnplaceLandmark = useCallback(
    async (poi: POI) => {
      handleClosePopover();
      await unplacePOI(poi.id);
      bumpPlacesRefetchToken();
    },
    [unplacePOI, handleClosePopover, bumpPlacesRefetchToken]
  );

  // "Elimina" (SPEC-016 T7) — `usePOIManager.deletePOI` is synchronous
  // (optimistic, no server round trip to await) and already unconfirmed, so
  // this closes the popover immediately rather than waiting on anything.
  const handleDeleteLandmark = useCallback(
    (poi: POI) => {
      deletePOI(poi.id);
      handleClosePopover();
    },
    [deletePOI, handleClosePopover]
  );

  const {
    isDrawingArea,
    editingArea,
    toggleDrawArea: handleToggleDrawArea,
    armAreaRedraw,
    disarm: disarmAreaDrawing,
  } = useAreaDrawing({
    parentId,
    bounds: effectiveBounds,
    onArm: cancelLocationSelection,
    onAreaDrawn: openAddForFootprint,
    onPlacesChanged: bumpPlacesRefetchToken,
  });

  // Navigable `region` children, same scope — clicking one opens the
  // popover (SPEC-016 T2; used to call `onDescend` directly).
  const navigableChildren = useNavigableChildren(
    parentId,
    handlePlaceClick,
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
  // context menu keeps "Measure" there but withholds "Add Place", since that
  // ground belongs to the area's own map, one level down.
  const contextMenuOverArea = contextMenuPosition
    ? findContainingSibling(
        [contextMenuPosition.latlng.lat, contextMenuPosition.latlng.lng],
        areaChildren
      )
    : undefined;

  const { picker, positionPlace: handleContextMenuPositionPlace } =
    usePlacePositioning({
      parentId,
      ancestorIds,
      refetchToken: placesRefetchToken,
      onPlacesChanged: bumpPlacesRefetchToken,
      reloadPOIs,
    });

  // Creates a navigable place under the current parent (SPEC-004 M5, T2).
  // `kind: "poi"` never reaches this — the panel keeps that on the original
  // `addPOI` path (see createPlace.ts for why). `input.footprint`, when
  // present (SPEC-009 T2), rides straight through to `createPlace` — it
  // already validates and derives the centre (T1).
  //
  // Returns the server's own refusal on failure rather than a bare boolean,
  // translated here from its catalogue key (TD-124): `createPlace` already
  // names exactly what went wrong (`areaOverlaps`, `areaTooSmall`) — without
  // threading it through, `MapPOIPanel` could only show a generic "could
  // not save," which makes a drawn-and-refused area look unexplained.
  const handleAddPlace = useCallback(
    async (input: AddPlaceInput): Promise<{ ok: boolean; error?: string }> => {
      const result = await createPlace({ ...input, parentId });
      if (result.ok) {
        setPlacesRefetchToken((token) => token + 1);
        return { ok: true };
      }
      const firstError = resolveFirstFieldError(result.errors ?? {}, tRoot);
      return {
        ok: false,
        ...(firstError !== undefined && { error: firstError }),
      };
    },
    [parentId, tRoot]
  );

  // Context menu handlers
  const handleAddMarker = useCallback(
    (lat: number, lng: number) => {
      void addMarker(lat, lng);
    },
    [addMarker]
  );

  // Handle POI location selection request. Also cancels draw-area mode
  // (SPEC-009 T2) — see `useAreaDrawing`'s `toggleDrawArea`.
  const handleRequestPOILocation = useCallback(() => {
    disarmAreaDrawing();
    toggleLocationSelection();
  }, [disarmAreaDrawing, toggleLocationSelection]);

  // Handle map click for POI location selection.
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isSelectingPOILocation) {
        // Clicking inside an existing area descends into it instead of
        // dropping the pin there (SPEC-009 T4/§3 rule 3) — the pin belongs
        // on the area's own map, one level down, not at this one. The "Add
        // Place" panel stays open (this
        // component doesn't remount on descend), so whatever the DM already
        // typed survives and the same click can be made one level down.
        const containingArea = findContainingSibling([lat, lng], areaChildren);
        if (containingArea) {
          cancelLocationSelection();
          onDescend(containingArea);
          return;
        }

        pickLocation(lat, lng);
      }
    },
    [
      isSelectingPOILocation,
      areaChildren,
      onDescend,
      cancelLocationSelection,
      pickLocation,
    ]
  );

  // Cancel any in-progress crosshair gesture when the DM navigates to a
  // different map — `WorldMap` isn't remounted on `parentId` change, so this
  // state would otherwise survive the navigation and point at something that
  // no longer belongs to the map being viewed.
  // The "adjusting state during render" pattern (React docs, "You Might Not
  // Need an Effect"), not a `useEffect` — `MapSearchBar` already uses this
  // exact shape for the same reason: a `setState` inside an effect body
  // trips `react-hooks/set-state-in-effect`.
  const [prevParentId, setPrevParentId] = useState(parentId);
  if (parentId !== prevParentId) {
    setPrevParentId(parentId);
    // The crosshair's cursor readout and a redraw in progress are cleared
    // for the same reason, inside `usePOIPanel` and `useAreaDrawing`.
    // Same reasoning as the popover: the panel edits a place that belongs
    // to the map being left (TD-104).
    setEditingZone(null);
    // The popover closes for the same reason, inside `usePlacePopover`
    // (SPEC-016 T2).
    // "Off on every load" (SPEC-015 §9) includes navigating to another
    // place — `WorldMap` isn't remounted on `parentId` change, so without
    // this the previous map's toggle state would carry over. The measure
    // tool disarms for the same reason, inside `useMeasureTool`: its grid
    // is the previous map's.
    setIsGridVisible(false);
  }

  const { handleExport: handlePOIExport, handleImport: handlePOIImport } =
    usePOIFileIO({ exportGeoJSON, importGeoJSON });

  return (
    // `h-full`, not `h-screen` (TD-84) — this fills whatever height
    // `GeographyExplorer`'s `flex-1 min-h-0` slot actually has, rather than
    // declaring its own full-viewport height inside an already-offset,
    // padded column. A viewport-sized box there pushed every
    // `absolute bottom-*`/`top-*` control anchored to it (the zoom/reset/
    // fullscreen stack, the tile switcher, the "up" button, the POI
    // panel's lower half) below the fold. `toggleFullscreen`
    // (`useMapControls.ts`) calls `document.documentElement.requestFullscreen()`,
    // not this element, so it does not depend on this box being
    // viewport-sized either.
    <div className="relative h-full w-full overflow-hidden">
      {/* Map */}
      <LeafletMap
        className="w-full h-full"
        onClick={handleMapClick}
        onMouseMove={poiPanel.trackCursor}
        cursorStyle={
          isSelectingPOILocation || isDrawingArea || editingArea || isMeasuring
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
            onConfigureGrid={() => setIsGridConfigOpen(true)}
          />
        }
        belowZoomControls={
          // No map image → no grid surface at all (§5's edge-case table),
          // matching the absence of the configuration entry above.
          isValidString(mapUrl) ? (
            <MapGridToggle
              isConfigured={gridColumns !== null && gridScale !== null}
              isVisible={isGridVisible}
              onToggle={() => setIsGridVisible((visible) => !visible)}
              onConfigure={() => setIsGridConfigOpen(true)}
            />
          ) : undefined
        }
      />

      {/* The grid overlay and its legend (SPEC-015 T6) — draws only while
          the toggle is on and the grid is configured. */}
      <MapGridOverlay
        isVisible={isGridVisible}
        gridColumns={gridColumns}
        gridScale={gridScale}
        imageSize={imageSize}
      />

      {/* Dismiss the temporary markers (TD-86) — a scratch pin for table
          talk, not a record of anything, so its only UI besides "add" is
          "clear them all." Visible to every viewer, not just the DM
          (TD-86: "this one is for players too"). */}
      {markers.length > 0 && (
        <button
          type="button"
          onClick={clearMarkers}
          className="absolute top-4 right-4 z-[1000] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-lg hover:bg-gray-50 transition-colors"
        >
          {tTemporaryMarkers("clear", { count: markers.length })}
        </button>
      )}

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

      {/* Configure the grid of the place currently being viewed (SPEC-015
          T5) — externally controlled like its two siblings above, opened
          from `MapOptionsButton`'s menu, which only offers it when the
          place has a map image. */}
      <MapGridConfigPanel
        placeId={parentId}
        isOpen={isGridConfigOpen}
        onClose={() => setIsGridConfigOpen(false)}
        gridColumns={gridColumns}
        gridScale={gridScale}
        imageSize={imageSize}
        onSaved={onGridChanged}
      />

      {/* "Modifica" for a place (TD-104) — name, description and area in
          one panel, opened from `PlacePopover`. Mounted on `editingZone`
          rather than gated by an `isOpen` prop like its siblings above:
          those three act on the place currently *being viewed*, which never
          changes while they are open, whereas this one acts on a child the
          DM picked, and a fresh mount per child is what keeps the form
          seeded from the right one. */}
      {editingZone && (
        <ZoneEditPanel
          placeId={editingZone.id}
          isOpen
          onClose={() => setEditingZone(null)}
          title={editingZone.title}
          description={editingZone.description}
          hasFootprint={editingZone.footprint !== null}
          onSaved={handleZoneEdited}
          onRedrawArea={(title) => armAreaRedraw({ id: editingZone.id, title })}
        />
      )}

      {/* Click–track–click distance measurement in the map's own units
          (SPEC-015 T7) — replaces the vendored panel flow, whose haversine
          arithmetic on pixel coordinates was TD-94. */}
      <MapMeasureTool
        isActive={isMeasuring}
        gridColumns={gridColumns}
        gridScale={gridScale}
        imageSize={imageSize}
        onExit={handleMeasureExit}
      />

      {/* The place popover (SPEC-016 T2, widened to landmarks in T7) —
          opened by a marker/rectangle click (`useNavigableChildren`) or a
          landmark marker click (`usePOIManager`), replacing the old
          click-to-descend/native-Leaflet-popup behaviour respectively.
          "Apri mappa" is the only path left into `onDescend`, zone only. */}
      {popoverTarget && (
        <PlacePopover
          target={popoverTarget}
          returnFocusTo={popoverReturnFocusTo}
          parentId={parentId}
          parentTitle={placeTitle}
          onClose={handleClosePopover}
          onOpenMap={handleOpenMap}
          onUnplace={(child) => void handleUnplace(child)}
          onDeleted={handlePopoverPlaceDeleted}
          onEditZone={handleEditZone}
          onEditLandmark={handleEditLandmark}
          onUnplaceLandmark={(poi) => void handleUnplaceLandmark(poi)}
          onDeleteLandmark={handleDeleteLandmark}
        />
      )}

      {/* Context Menu */}
      <MapContextMenu
        isOpen={isContextMenuOpen}
        position={contextMenuPosition}
        onClose={closeContextMenu}
        onAddMarker={handleAddMarker}
        onStartMeasurement={handleContextMenuMeasurement}
        onAddPOI={poiPanel.openAddAt}
        hideAddPlace={!!contextMenuOverArea}
        ariaLabel={tContextMenu("ariaLabel")}
        addMarkerLabel={tContextMenu("addMarker.trigger")}
        addMarkerSublabel={tContextMenu("addMarker.sublabel")}
        measureLabel={tContextMenu("measure.trigger")}
        measureSublabel={tContextMenu("measure.sublabel")}
        addPlaceLabel={tContextMenu("addPlace.trigger")}
        addPlaceSublabel={tContextMenu("addPlace.sublabel")}
        onAddSubMap={handleToggleDrawArea}
        addSubMapLabel={tDrawArea("trigger")}
        unplacedHere={picker.here}
        unplacedElsewhere={picker.elsewhere}
        positionPlaceHereLabel={tContextMenu("positionPlace.here")}
        positionPlaceElsewhereLabel={tContextMenu("positionPlace.elsewhere")}
        positionPlaceFilterPlaceholder={tContextMenu("positionPlace.filter")}
        positionPlaceNoMatchesLabel={tContextMenu("positionPlace.noMatches")}
        onPositionPlace={(id, lat, lng) =>
          void handleContextMenuPositionPlace(id, lat, lng)
        }
        positionPlaceLabel={tContextMenu("positionPlace.trigger")}
        positionPlaceSublabel={tGeography("unpositionedCount", {
          count: unpositionedCount,
          blocked: blockedUnpositionedCount,
        })}
      />

      {/* POI Panel */}
      <MapPOIPanel
        isOpen={poiPanel.isOpen}
        onClose={poiPanel.close}
        pois={pois}
        filterCategory={poiPanel.filterCategory}
        onAddPOI={addPOI}
        onUpdatePOI={updatePOI}
        onDeletePOI={deletePOI}
        onClearAll={clearAllPOIs}
        onExport={handlePOIExport}
        onImport={(file) => void handlePOIImport(file)}
        onFlyTo={flyToPOI}
        onRequestLocation={handleRequestPOILocation}
        onClearCoordinates={poiPanel.clearCoordinates}
        onModeChange={poiPanel.changeMode}
        isSelectingLocation={isSelectingPOILocation}
        initialLat={poiPanel.initialCoords?.lat}
        initialLng={poiPanel.initialCoords?.lng}
        cursorLat={poiPanel.cursorCoords?.lat}
        cursorLng={poiPanel.cursorCoords?.lng}
        mode={poiPanel.mode}
        onAddPlace={handleAddPlace}
        pendingFootprint={poiPanel.pendingFootprint}
        onFootprintConsumed={poiPanel.consumeFootprint}
        editTarget={poiPanel.editTarget}
      />
    </div>
  );
}

export default WorldMap;
