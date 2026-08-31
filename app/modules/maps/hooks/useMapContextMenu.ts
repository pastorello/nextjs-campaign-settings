"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useLeafletMap } from "./useLeafletMap";
import type { LeafletMouseEvent } from "leaflet";

export interface ContextMenuPosition {
  x: number;
  y: number;
  latlng: {
    lat: number;
    lng: number;
  };
}

export interface UseMapContextMenuReturn {
  isOpen: boolean;
  position: ContextMenuPosition | null;
  close: () => void;
  /**
   * Run `fn` — which must synchronously call a Leaflet method that zooms the
   * map, e.g. `setView`/`fitBounds` — without letting the `zoomstart` it
   * fires close an already-open menu.
   *
   * Since TD-100 the menu closes on what the DM did to the map, not on where
   * the map ended up: `dragstart` and `zoomstart`, never `movestart`. For a
   * pan that distinction is free, because Leaflet fires map-level `dragstart`
   * from its drag handler alone. For a zoom it is not: `zoomstart` fires
   * identically whether the DM spun the wheel or app code called `fitBounds`
   * (e.g. `WorldMap`'s TD-81/TD-87 corrective re-fit, fired asynchronously
   * once a loaded image reports its real aspect ratio). Left unguarded, such
   * a re-fit landing while the menu is open closes it — and since `zoomstart`
   * fires synchronously within the very call that triggers it, wrapping that
   * call here is enough to tell the two apart without threading any extra
   * state through the map instance itself.
   */
  runWithoutClosing: (fn: () => void) => void;
}

/**
 * Hook for managing map context menu (right-click menu)
 *
 * Features:
 * - Proper event handler cleanup (stores reference to specific handler)
 * - Prevents default browser context menu on map
 * - Tracks click position in both screen and map coordinates
 * - Closes on map click, on the DM dragging or zooming the map, or on escape
 *
 * @returns Object with context menu state and controls
 */
export function useMapContextMenu(): UseMapContextMenuReturn {
  const map = useLeafletMap();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);

  // Store handler references for proper cleanup
  const contextMenuHandlerRef = useRef<((e: LeafletMouseEvent) => void) | null>(
    null
  );
  const clickHandlerRef = useRef<(() => void) | null>(null);
  const userMoveHandlerRef = useRef<(() => void) | null>(null);

  // Set for the duration of a `runWithoutClosing` call — see that function
  // and the `UseMapContextMenuReturn.runWithoutClosing` doc comment.
  const suppressCloseRef = useRef(false);

  /**
   * Close the context menu
   */
  const close = useCallback(() => {
    setIsOpen(false);
    setPosition(null);
  }, []);

  const runWithoutClosing = useCallback((fn: () => void) => {
    suppressCloseRef.current = true;
    try {
      fn();
    } finally {
      suppressCloseRef.current = false;
    }
  }, []);

  /**
   * Handle escape key to close menu
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }

    return undefined;
  }, [isOpen, close]);

  /**
   * Setup context menu event handlers
   */
  useEffect(() => {
    if (!map) return;

    // Context menu handler (right-click)
    const handleContextMenu = (e: LeafletMouseEvent) => {
      // Prevent default browser context menu
      e.originalEvent.preventDefault();

      // Get container position for accurate menu placement
      const containerPoint = e.containerPoint;

      setPosition({
        x: containerPoint.x,
        y: containerPoint.y,
        latlng: {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        },
      });
      setIsOpen(true);
    };

    // Click handler to close menu
    const handleClick = () => {
      if (isOpen) {
        close();
      }
    };

    // The DM moving the map closes the menu; the app moving the map does not
    // (TD-100). `movestart` cannot tell those apart — it fires for every
    // camera move, including the ones the map's own initialisation tail makes
    // (`invalidateSize` → `moveend` → `setMaxBounds`'s `panInsideMaxBounds`
    // → a pan), which is how a menu the DM had just opened could vanish
    // mid-click. `dragstart` and `zoomstart` are the DM's two ways of moving
    // it, so the menu listens to those instead; the one case they still share
    // with app code is a programmatic zoom, which `runWithoutClosing` marks.
    //
    // Known and accepted: Leaflet's keyboard pan (arrow keys, `panBy`) fires
    // neither, so it leaves the menu open where it used to close it. Its
    // zoom keys still close it, and so does clicking anywhere on the map.
    const handleUserMove = () => {
      if (isOpen && !suppressCloseRef.current) {
        close();
      }
    };

    // Store references
    contextMenuHandlerRef.current = handleContextMenu;
    clickHandlerRef.current = handleClick;
    userMoveHandlerRef.current = handleUserMove;

    // Attach handlers
    map.on("contextmenu", handleContextMenu);
    map.on("click", handleClick);
    map.on("dragstart", handleUserMove);
    map.on("zoomstart", handleUserMove);

    // Cleanup
    return () => {
      if (contextMenuHandlerRef.current) {
        map.off("contextmenu", contextMenuHandlerRef.current);
        contextMenuHandlerRef.current = null;
      }
      if (clickHandlerRef.current) {
        map.off("click", clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
      if (userMoveHandlerRef.current) {
        map.off("dragstart", userMoveHandlerRef.current);
        map.off("zoomstart", userMoveHandlerRef.current);
        userMoveHandlerRef.current = null;
      }
    };
  }, [map, isOpen, close]);

  return {
    isOpen,
    position,
    close,
    runWithoutClosing,
  };
}
