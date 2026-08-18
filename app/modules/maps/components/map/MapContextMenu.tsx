"use client";

import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  MapPin,
  Ruler,
  Star,
  Scaling,
  Layers,
  UserPlus,
  Crosshair,
} from "lucide-react";
import type { ContextMenuPosition } from "@/app/modules/maps/hooks/useMapContextMenu";
import type { UnplacedChild } from "@/app/modules/maps/hooks/useUnplacedChildren";

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
  // TD-85 — positions an existing unplaced place at the exact point the
  // context menu was opened over. `unplacedPlaces` is this place's own
  // unplaced children (`useUnplacedChildren`, scoped to the map currently
  // open) and fills the dropdown; `unpositionedCount` is the tree-wide
  // count SPEC-007 T2 already computes (`countUnpositionedPlaces`), reused
  // as-is per the DM's 2026-08-18 decision — an awareness number ("how many
  // are waiting" across the whole campaign), not a claim that all of them
  // are reachable from here. The entry is disabled, not hidden, exactly
  // when that count is zero, so "nothing left to place" stays legible
  // (DM, 2026-08-18) rather than the item silently disappearing. Gated by
  // the same `hideAddPlace` containment rule as Add Place (SPEC-009 T4):
  // ground already inside an area belongs to that area's own map.
  unplacedPlaces?: UnplacedChild[];
  unpositionedCount?: number;
  onPositionPlace?: (id: number, lat: number, lng: number) => void;
  positionPlaceLabel?: string;
  positionPlaceSublabel?: string;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  // TD-85's "Posiziona luogo" is the first entry that can be visible but
  // unusable — every place already positioned — rather than simply absent.
  disabled?: boolean;
}

/**
 * Individual menu item component
 */
const MenuItem = memo(function MenuItem({
  icon,
  label,
  sublabel,
  onClick,
  disabled = false,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 w-full px-2 py-1 text-left transition-colors rounded-lg group ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
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
  unplacedPlaces = [],
  unpositionedCount = 0,
  onPositionPlace,
  positionPlaceLabel = "Position a place",
  positionPlaceSublabel,
}: MapContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  // Whether "Posiziona luogo"'s own dropdown of unplaced places is expanded
  // (TD-85). Reset whenever the menu closes, so the next right-click always
  // opens collapsed rather than remembering the last interaction — the menu
  // component stays mounted between opens (`isOpen`/`position` just gate
  // its render), so this state would otherwise carry over.
  const [isPositionListOpen, setIsPositionListOpen] = useState(false);
  useEffect(() => {
    if (!isOpen) setIsPositionListOpen(false);
  }, [isOpen]);

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
   * Toggles "Posiziona luogo"'s dropdown (TD-85). A no-op while disabled —
   * `unpositionedCount === 0` means there is nothing the dropdown could
   * ever offer.
   */
  const handleTogglePositionList = useCallback(() => {
    if (unpositionedCount === 0) return;
    setIsPositionListOpen((open) => !open);
  }, [unpositionedCount]);

  /**
   * Positions the chosen place at the point the menu was opened over, then
   * closes the whole menu (TD-85) — picking from the dropdown is the whole
   * gesture, there's nothing left to confirm.
   */
  const handlePositionPlace = useCallback(
    (id: number) => {
      if (!position || !onPositionPlace) return;
      onPositionPlace(id, position.latlng.lat, position.latlng.lng);
      setIsPositionListOpen(false);
      onClose();
    },
    [position, onPositionPlace, onClose]
  );

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

      {/* Position an unplaced place here (TD-85) — disabled rather than
          hidden once nothing is left to place, so the absence of work
          stays legible. Withheld over an existing area by the same
          containment rule as Add Place (SPEC-009 T4). */}
      {onPositionPlace && !hideAddPlace && (
        <>
          <div className="my-1.5 border-t border-gray-200 dark:border-gray-700" />

          <MenuItem
            icon={<Crosshair className="h-4 w-4" />}
            label={positionPlaceLabel}
            {...(positionPlaceSublabel !== undefined && {
              sublabel: positionPlaceSublabel,
            })}
            onClick={handleTogglePositionList}
            disabled={unpositionedCount === 0}
          />
          {isPositionListOpen && unplacedPlaces.length > 0 && (
            <div className="ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
              {unplacedPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handlePositionPlace(place.id)}
                  className="flex w-full items-center rounded-lg px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {place.title}
                </button>
              ))}
            </div>
          )}
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
