"use client";

import { memo, useCallback, useEffect, useRef, useMemo } from "react";
import { MapPin, Ruler, Star, Scaling, Layers, UserPlus } from "lucide-react";
import type { ContextMenuPosition } from "@/app/modules/maps/hooks/useMapContextMenu";

interface MapContextMenuProps {
  isOpen: boolean;
  position: ContextMenuPosition | null;
  onClose: () => void;
  onAddMarker: (lat: number, lng: number) => void;
  onStartMeasurement: () => void;
  onAddPOI?: (lat: number, lng: number) => void;
  // The right-clicked point falls inside an existing area (SPEC-009 T4) —
  // that ground belongs to the area's own map, one level down, so "Add
  // Place" is withheld here. Other entries (Measure, the client-only "Add
  // Marker") stay: they don't write a domain pin, so the containment rule
  // doesn't apply to them.
  hideAddPlace?: boolean;
  // Arms `WorldMap`'s redraw-to-replace gesture on the area the right-click
  // landed inside (SPEC-009 T5). Shown only when `showEditArea` is set —
  // the mirror image of `hideAddPlace`, an area rather than empty ground.
  onEditArea?: () => void;
  showEditArea?: boolean;
  // Resolved at the render boundary by `WorldMap` (ADR-0007) and passed down
  // as plain strings, same as every label below — each optional with an
  // English fallback so a caller that doesn't need translated copy (most
  // unit tests) isn't forced to supply it.
  editAreaLabel?: string;
  editAreaSublabel?: string;
  // Translated copy for the menu items that were still hardcoded English
  // until this pass (usability fix, 2026-08-17) — `ariaLabel` and the
  // always-shown Add Marker/Measure entries, plus Add Place's
  // label/sublabel.
  ariaLabel?: string;
  addMarkerLabel?: string;
  addMarkerSublabel?: string;
  measureLabel?: string;
  measureSublabel?: string;
  addPlaceLabel?: string;
  addPlaceSublabel?: string;
  // Two entries consolidated here from their own floating map corners
  // (usability fix, 2026-08-17): both add *content* to the map (a new
  // sub-map, an attached entity), so they belong alongside Add
  // Marker/Add Place rather than in `MapOptionsButton`'s "administer this
  // map" menu. `onAddSubMap` (ex-`DrawAreaButton`) is coordinate-agnostic
  // like `onAddPOI` — it arms drag-to-draw, it doesn't draw at the
  // right-clicked point itself — so it's gated by the same `hideAddPlace`
  // containment rule (SPEC-009 T4): ground already inside an area belongs
  // to that area's own map. `onAttachEntity` is place-level, not
  // point-dependent at all, and always shown.
  onAddSubMap?: () => void;
  addSubMapLabel?: string;
  onAttachEntity?: () => void;
  attachEntityLabel?: string;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
}

/**
 * Individual menu item component
 */
const MenuItem = memo(function MenuItem({
  icon,
  label,
  sublabel,
  onClick,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg group"
    >
      <span className="flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </div>
        {sublabel && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
});

MenuItem.displayName = "MenuItem";

// Menu dimensions for position calculation (approximate)
const MENU_WIDTH = 220;
const MENU_HEIGHT = 180;
const MENU_PADDING = 8;

/**
 * MapContextMenu - Right-click context menu for map interactions
 *
 * Features:
 * - Add marker at clicked location
 * - Start measurement from clicked location
 * - Keyboard accessible (Escape to close)
 * - Auto-positions to stay within viewport
 * - Memoized for performance
 */
export const MapContextMenu = memo(function MapContextMenu({
  isOpen,
  position,
  onClose,
  onAddMarker,
  onStartMeasurement,
  onAddPOI,
  hideAddPlace = false,
  onEditArea,
  showEditArea = false,
  editAreaLabel,
  editAreaSublabel,
  ariaLabel = "Map context menu",
  addMarkerLabel = "Add Marker",
  addMarkerSublabel = "Place a marker here",
  measureLabel = "Measure",
  measureSublabel = "Start distance measurement",
  addPlaceLabel = "Add Place",
  addPlaceSublabel = "Create a place here",
  onAddSubMap,
  addSubMapLabel = "Add sub-map",
  onAttachEntity,
  attachEntityLabel = "Attach an existing entity",
}: MapContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate adjusted position using useMemo instead of useEffect + setState
  const displayPosition = useMemo(() => {
    if (!position) return { x: 0, y: 0 };

    let x = position.x;
    let y = position.y;

    // Use window dimensions as fallback for container bounds
    // The actual adjustment will happen via CSS if needed
    if (typeof window !== "undefined") {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontal position if menu would overflow right edge
      if (x + MENU_WIDTH > viewportWidth) {
        x = Math.max(0, x - MENU_WIDTH - MENU_PADDING);
      }

      // Adjust vertical position if menu would overflow bottom edge
      if (y + MENU_HEIGHT > viewportHeight) {
        y = Math.max(0, y - MENU_HEIGHT - MENU_PADDING);
      }
    }

    return { x, y };
  }, [position]);

  /**
   * Handle add marker
   */
  const handleAddMarker = useCallback(() => {
    if (!position) return;
    onAddMarker(position.latlng.lat, position.latlng.lng);
    onClose();
  }, [position, onAddMarker, onClose]);

  /**
   * Handle start measurement
   */
  const handleStartMeasurement = useCallback(() => {
    onStartMeasurement();
    onClose();
  }, [onStartMeasurement, onClose]);

  /**
   * Handle add to POI
   */
  const handleAddPOI = useCallback(() => {
    if (!position || !onAddPOI) return;
    onAddPOI(position.latlng.lat, position.latlng.lng);
    onClose();
  }, [position, onAddPOI, onClose]);

  /**
   * Arms the resize/move gesture on the area under the right-click
   * (SPEC-009 T5).
   */
  const handleEditArea = useCallback(() => {
    if (!onEditArea) return;
    onEditArea();
    onClose();
  }, [onEditArea, onClose]);

  /**
   * Arms drag-to-draw a sub-map area (ex-`DrawAreaButton`, SPEC-009 T2).
   */
  const handleAddSubMap = useCallback(() => {
    if (!onAddSubMap) return;
    onAddSubMap();
    onClose();
  }, [onAddSubMap, onClose]);

  /**
   * Opens the attach-existing-entity picker (ex-`AttachEntityButton`,
   * SPEC-008 §5/T5).
   */
  const handleAttachEntity = useCallback(() => {
    if (!onAttachEntity) return;
    onAttachEntity();
    onClose();
  }, [onAttachEntity, onClose]);

  /**
   * Handle click outside to close
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close from the contextmenu event
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-[1100] min-w-[200px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 px-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: displayPosition.x,
        top: displayPosition.y,
      }}
      role="menu"
      aria-label={ariaLabel}
    >
      {/* Add Marker */}
      <MenuItem
        icon={<MapPin className="h-4 w-4" />}
        label={addMarkerLabel}
        sublabel={addMarkerSublabel}
        onClick={handleAddMarker}
      />

      {/* Measurement */}
      <MenuItem
        icon={<Ruler className="h-4 w-4" />}
        label={measureLabel}
        sublabel={measureSublabel}
        onClick={handleStartMeasurement}
      />

      {/* Add Place (if handler provided) — opens a form covering every
          kind (region, plane, city, dungeon, deity, npc, poi), not just
          POIs; label/sublabel match MapPOIPanel's own "Add Place" heading
          rather than the POI-specific copy this predates (TD-67). */}
      {onAddPOI && !hideAddPlace && (
        <>
          {/* Divider */}
          <div className="my-1.5 border-t border-gray-200 dark:border-gray-700" />

          <MenuItem
            icon={<Star className="h-4 w-4" />}
            label={addPlaceLabel}
            sublabel={addPlaceSublabel}
            onClick={handleAddPOI}
          />
        </>
      )}

      {/* Add sub-map (ex-"Disegna area"/DrawAreaButton) — arms drag-to-draw,
          same containment rule as Add Place: ground already inside an
          area belongs to that area's own map. */}
      {onAddSubMap && !hideAddPlace && (
        <>
          <div className="my-1.5 border-t border-gray-200 dark:border-gray-700" />

          <MenuItem
            icon={<Layers className="h-4 w-4" />}
            label={addSubMapLabel}
            onClick={handleAddSubMap}
          />
        </>
      )}

      {/* Attach an existing entity (ex-AttachEntityButton) — place-level,
          not point-dependent, so unaffected by hideAddPlace. */}
      {onAttachEntity && (
        <>
          <div className="my-1.5 border-t border-gray-200 dark:border-gray-700" />

          <MenuItem
            icon={<UserPlus className="h-4 w-4" />}
            label={attachEntityLabel}
            onClick={handleAttachEntity}
          />
        </>
      )}

      {/* Edit Area — arms the redraw-to-replace gesture on the area the
          right-click landed inside (SPEC-009 T5). The mirror of "Add Place"
          above: shown only over an area, never over empty ground. */}
      {onEditArea && showEditArea && (
        <>
          <div className="my-1.5 border-t border-gray-200 dark:border-gray-700" />

          <MenuItem
            icon={<Scaling className="h-4 w-4" />}
            label={editAreaLabel ?? "Edit Area"}
            {...(editAreaSublabel !== undefined && {
              sublabel: editAreaSublabel,
            })}
            onClick={handleEditArea}
          />
        </>
      )}
    </div>
  );
});

MapContextMenu.displayName = "MapContextMenu";
