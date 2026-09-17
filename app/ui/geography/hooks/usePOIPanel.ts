"use client";

import { useCallback, useState } from "react";
import type { ViewMode } from "@/app/modules/maps/components/map/MapPOIPanel";
import type { POI, POICategory } from "@/app/modules/maps/types/poi";
import type { Footprint } from "@/app/modules/maps/lib/utils/footprint";

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * `MapPOIPanel`'s controlled state for `WorldMap` — extracted from it
 * (TD-127): whether the drawer is open and in which mode, what its add form
 * is seeded with (a point, a drawn footprint) or its edit form with (a
 * landmark), and the point-picking crosshair mode the form arms.
 *
 * Point picking is one of the map's three mutually exclusive crosshair
 * modes; the other two are `useAreaDrawing`'s, and `WorldMap` wires the
 * exclusion (`cancelLocationSelection` / that hook's `disarm`).
 */
export function usePOIPanel({ parentId }: { parentId: number }): {
  isOpen: boolean;
  filterCategory: POICategory | null;
  initialCoords: LatLng | null;
  mode: ViewMode;
  isSelectingLocation: boolean;
  cursorCoords: LatLng | null;
  pendingFootprint: Footprint | null;
  editTarget: POI | null;
  openAddAt: (lat: number, lng: number) => void;
  openAddForFootprint: (footprint: Footprint) => void;
  openEdit: (poi: POI) => void;
  close: () => void;
  changeMode: (mode: ViewMode) => void;
  consumeFootprint: () => void;
  toggleLocationSelection: () => void;
  cancelLocationSelection: () => void;
  pickLocation: (lat: number, lng: number) => void;
  trackCursor: (lat: number, lng: number) => void;
  clearCoordinates: () => void;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<POICategory | null>(
    null
  );
  const [initialCoords, setInitialCoords] = useState<LatLng | null>(null);
  const [mode, setMode] = useState<ViewMode>("list");
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<LatLng | null>(null);
  // The completed rectangle waiting for the create form (SPEC-009 T2) —
  // drawn in `useAreaDrawing`'s draw-an-area mode.
  const [pendingFootprint, setPendingFootprint] = useState<Footprint | null>(
    null
  );
  // The landmark `MapPOIPanel`'s edit form is pre-filled for (SPEC-016 T7,
  // "Modifica") — `null` whenever the panel isn't in an externally-requested
  // edit, cleared by `changeMode` the moment the panel leaves edit
  // mode (cancelled or saved) so re-editing the same landmark later still
  // transitions `null` → POI rather than being a no-op re-render.
  const [editTarget, setEditTarget] = useState<POI | null>(null);

  // The crosshair's cursor readout belongs to the map being left —
  // `WorldMap` isn't remounted on `parentId` change, so it is cleared here,
  // with the "adjusting state during render" pattern `WorldMap`'s own reset
  // block explains. Point selection itself stays armed, as before the
  // extraction: the add form survives a descend on purpose.
  const [prevParentId, setPrevParentId] = useState(parentId);
  if (parentId !== prevParentId) {
    setPrevParentId(parentId);
    setCursorCoords(null);
  }

  const openAddAt = useCallback((lat: number, lng: number) => {
    // Always set fresh coordinates - this ensures updates even if panel is already open
    setInitialCoords({ lat, lng });
    setFilterCategory(null);
    setMode("add");
    setIsOpen(true);
  }, []);

  // A rectangle finished drawing (SPEC-009 T2) — opens the create form with
  // the footprint attached, the same shape `openAddAt` uses for a point.
  const openAddForFootprint = useCallback((footprint: Footprint) => {
    setPendingFootprint(footprint);
    setFilterCategory(null);
    setMode("add");
    setIsOpen(true);
  }, []);

  // "Modifica" for a landmark (SPEC-016 T7) — opens the drawer already in
  // edit mode, pre-filled with it (`editTarget`, consumed by the panel's
  // own seeding effect).
  const openEdit = useCallback((poi: POI) => {
    setEditTarget(poi);
    setMode("edit");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsSelectingLocation(false);
    setMode("list");
    setPendingFootprint(null);
    setEditTarget(null);
    // Reset coordinates and category after a brief delay to allow panel to close smoothly
    setTimeout(() => {
      setFilterCategory(null);
      setInitialCoords(null);
    }, 100);
  }, []);

  // Handle POI panel mode change. Used to store this with a
  // `mode as "list" | "add"` cast, silently dropping a real "edit" value
  // the compiler was never told could happen — `mode`'s declared
  // type now matches this callback's own parameter type, so there's
  // nothing left to lie about (TD-85).
  const changeMode = useCallback((next: ViewMode) => {
    setMode(next);
    // Leaving edit mode — cancelled back to the list, or a successful save
    // (`MapPOIPanel.resetFormAfterSave`) — either way (SPEC-016 T7):
    // `editTarget` cleared so re-editing the same landmark later is a
    // `null` → POI transition the panel's seeding effect actually fires on,
    // not a no-op re-render.
    if (next !== "edit") setEditTarget(null);
  }, []);

  // A drawn rectangle is "spent" once the create form no longer needs it —
  // a successful save, backing out to the list, or starting a fresh
  // (non-area) add (SPEC-009 T2). Without this, a stale footprint could
  // otherwise attach itself to an unrelated point-based place.
  const consumeFootprint = useCallback(() => {
    setPendingFootprint(null);
  }, []);

  const toggleLocationSelection = useCallback(() => {
    setIsSelectingLocation((prev) => !prev);
  }, []);

  const cancelLocationSelection = useCallback(() => {
    setIsSelectingLocation(false);
    setCursorCoords(null);
  }, []);

  // The crosshair click landed on a point this map owns — it becomes the
  // add form's coordinates and the mode ends.
  const pickLocation = useCallback((lat: number, lng: number) => {
    setInitialCoords({ lat, lng });
    setIsSelectingLocation(false);
    setCursorCoords(null);
  }, []);

  // Handle map mouse move for cursor tracking
  const trackCursor = useCallback(
    (lat: number, lng: number) => {
      if (isSelectingLocation) {
        setCursorCoords({ lat, lng });
      }
    },
    [isSelectingLocation]
  );

  // Handle clear POI coordinates
  const clearCoordinates = useCallback(() => {
    setInitialCoords(null);
    setCursorCoords(null);
    setIsSelectingLocation(false);
  }, []);

  return {
    isOpen,
    filterCategory,
    initialCoords,
    mode,
    isSelectingLocation,
    cursorCoords,
    pendingFootprint,
    editTarget,
    openAddAt,
    openAddForFootprint,
    openEdit,
    close,
    changeMode,
    consumeFootprint,
    toggleLocationSelection,
    cancelLocationSelection,
    pickLocation,
    trackCursor,
    clearCoordinates,
  };
}
