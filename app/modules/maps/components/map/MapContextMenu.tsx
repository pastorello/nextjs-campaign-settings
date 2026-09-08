"use client";

import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { MapPin, Ruler, Star, Layers, Crosshair } from "lucide-react";
import type { ContextMenuPosition } from "@/app/modules/maps/hooks/useMapContextMenu";
/**
 * One row of "Posiziona luogo"'s picker (SPEC-017 T9).
 *
 * `key`, not `id`: the pool merges two tables whose id sequences are
 * independent (TD-102), so a campaign-wide pool can hold a zone and a
 * landmark with the same number — `${table}:${id}` is what tells them
 * apart, both for React and for the caller looking the pick back up.
 *
 * `sublabel` carries the row's provenance ("da «Regno di Kang»"), already
 * formatted: this component takes strings, never message keys (ADR-0007).
 */
export interface UnplacedPickerRow {
  key: string;
  title: string;
  sublabel?: string;
}

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
  // No "Modifica area" here any more (TD-104, the DM on 2026-08-30). It
  // armed the redraw on the area the right-click landed inside, and it was
  // the only entry point to an area whose *place* is awkward to click —
  // under a panel, off-screen, beneath another marker. `PlacePopover`'s
  // "Modifica" opens `ZoneEditPanel`, which reaches the same gesture from
  // the place itself, and the DM chose one surface over two. Removing the
  // escape hatch was named as the cost and accepted; if it turns out to
  // bite, restore it deliberately rather than as a bug fix.
  //
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
  // Consolidated here from its own floating map corner (usability fix,
  // 2026-08-17): it adds *content* to the map (a new sub-map), so it
  // belongs alongside Add Marker/Add Place rather than in
  // `MapOptionsButton`'s "administer this map" menu. `onAddSubMap`
  // (ex-`DrawAreaButton`) is coordinate-agnostic like `onAddPOI` — it arms
  // drag-to-draw, it doesn't draw at the right-clicked point itself — so
  // it's gated by the same `hideAddPlace` containment rule (SPEC-009 T4):
  // ground already inside an area belongs to that area's own map.
  onAddSubMap?: () => void;
  addSubMapLabel?: string;
  // TD-85 — positions an existing unplaced place at the exact point the
  // context menu was opened over. `unplacedPlaces` is the campaign's pool
  // of unplaced places, minus the ones this particular map cannot accept
  // (`useUnplacedPlaces` plus `WorldMap`'s ancestor filter, SPEC-017 T8);
  // it fills the dropdown *and* decides whether the entry is enabled,
  // because those must be the same question.
  //
  // TD-103: they were not. The entry used to be disabled on a tree-wide
  // count (`countUnpositionedPlaces`, SPEC-007 T2) while the dropdown was
  // filled from this list, so on any map whose own children were all placed
  // the entry looked available and opened an empty list — a click that did
  // nothing at all. The tree-wide number remains an awareness figure and
  // still reaches this component, but only as `positionPlaceSublabel`'s
  // already-rendered text, never as a claim about reachability.
  //
  // Disabled, not hidden, when there is nothing here to place, so "nothing
  // left to place" stays legible (DM, 2026-08-18) rather than the item
  // silently disappearing. Gated by the same `hideAddPlace` containment
  // rule as Add Place (SPEC-009 T4): ground already inside an area belongs
  // to that area's own map.
  //
  // Split in two by the caller, which is the only one that knows which map
  // is in view (SPEC-017 T9): the map's own unplaced children first, then
  // everything else in the campaign, each of those rows naming where it
  // currently lives. Picking from the second group moves the place here.
  unplacedHere?: UnplacedPickerRow[];
  unplacedElsewhere?: UnplacedPickerRow[];
  onPositionPlace?: (key: string, lat: number, lng: number) => void;
  positionPlaceLabel?: string;
  positionPlaceSublabel?: string;
  positionPlaceHereLabel?: string;
  positionPlaceElsewhereLabel?: string;
  positionPlaceFilterPlaceholder?: string;
  positionPlaceNoMatchesLabel?: string;
}

/**
 * "Posiziona luogo" — the entry and, once expanded, the pool it can place
 * here (TD-85, SPEC-017 T9).
 *
 * **Its own component so that its state has the right lifetime.** Which
 * rows are expanded and what the filter says are true of one right-click,
 * not of the session: the next menu should open collapsed and unfiltered.
 * `MapContextMenu` renders `null` while closed, so a child of it is
 * unmounted then and comes back fresh — where the parent, which stays
 * mounted, had to reset the same state in an effect. That effect is also
 * what `react-hooks/set-state-in-effect` refuses, and rightly: unmounting
 * is the mechanism React already gives you for "forget this".
 */
function PositionPlaceEntry({
  here,
  elsewhere,
  onPick,
  label,
  sublabel,
  hereLabel,
  elsewhereLabel,
  filterPlaceholder,
  noMatchesLabel,
}: {
  here: UnplacedPickerRow[];
  elsewhere: UnplacedPickerRow[];
  onPick: (key: string) => void;
  label: string;
  sublabel?: string;
  hereLabel: string;
  elsewhereLabel: string;
  filterPlaceholder: string;
  noMatchesLabel: string;
}) {
  const [isListOpen, setIsListOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const poolSize = here.length + elsewhere.length;
  const term = filter.trim().toLowerCase();
  const matching = (rows: UnplacedPickerRow[]) =>
    term === ""
      ? rows
      : rows.filter((row) => row.title.toLowerCase().includes(term));
  const matchingHere = matching(here);
  const matchingElsewhere = matching(elsewhere);
  // Headings only when both groups have something to show. With one group
  // on screen a heading says nothing the rows do not — an "elsewhere" row
  // already names the map it comes from, one per row.
  const showGroupHeadings =
    matchingHere.length > 0 && matchingElsewhere.length > 0;

  return (
    <>
      <div className="my-1.5 border-t border-gray-200 dark:border-gray-700" />

      <MenuItem
        icon={<Crosshair className="h-4 w-4" />}
        label={label}
        {...(sublabel !== undefined && { sublabel })}
        // A no-op while disabled: an empty pool is nothing to expand, and
        // it is the same condition the entry is disabled on (TD-103).
        onClick={() => poolSize > 0 && setIsListOpen((open) => !open)}
        disabled={poolSize === 0}
      />
      {isListOpen && poolSize > 0 && (
        <div className="ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={filterPlaceholder}
            aria-label={filterPlaceholder}
            className="mb-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          {/* Capped and scrollable: the pool is the whole campaign now
              (SPEC-017 T8), and 41 rows is a real number on the DM's own
              database. */}
          <div className="max-h-64 overflow-y-auto">
            <PickerGroup
              {...(showGroupHeadings && { label: hereLabel })}
              rows={matchingHere}
              onPick={onPick}
            />
            <PickerGroup
              {...(showGroupHeadings && { label: elsewhereLabel })}
              rows={matchingElsewhere}
              onPick={onPick}
            />
            {matchingHere.length === 0 && matchingElsewhere.length === 0 && (
              <p className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                {noMatchesLabel}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * One labelled block of picker rows. A row carrying a `sublabel` is one
 * from another map, and picking it moves the place here — which is why the
 * provenance is rendered under the title rather than left to a heading.
 */
function PickerGroup({
  label,
  rows,
  onPick,
}: {
  label?: string;
  rows: UnplacedPickerRow[];
  onPick: (key: string) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <>
      {label !== undefined && (
        <p className="px-2 pt-1 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </p>
      )}
      {rows.map((row) => (
        <button
          key={row.key}
          onClick={() => onPick(row.key)}
          className="flex w-full flex-col items-start rounded-lg px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <span>{row.title}</span>
          {row.sublabel !== undefined && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {row.sublabel}
            </span>
          )}
        </button>
      ))}
    </>
  );
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
  ariaLabel = "Map context menu",
  addMarkerLabel = "Add Marker",
  addMarkerSublabel = "Place a marker here",
  measureLabel = "Measure",
  measureSublabel = "Start distance measurement",
  addPlaceLabel = "Add Place",
  addPlaceSublabel = "Create a place here",
  onAddSubMap,
  addSubMapLabel = "Add sub-map",
  unplacedHere = [],
  unplacedElsewhere = [],
  onPositionPlace,
  positionPlaceLabel = "Position a place",
  positionPlaceSublabel,
  positionPlaceHereLabel = "On this map",
  positionPlaceElsewhereLabel = "From other maps",
  positionPlaceFilterPlaceholder = "Filter by name",
  positionPlaceNoMatchesLabel = "No place matches.",
}: MapContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  // Whether "Posiziona luogo"'s own dropdown of unplaced places is expanded

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
   * Arms drag-to-draw a sub-map area (ex-`DrawAreaButton`, SPEC-009 T2).
   */
  const handleAddSubMap = useCallback(() => {
    if (!onAddSubMap) return;
    onAddSubMap();
    onClose();
  }, [onAddSubMap, onClose]);

  /**
   * Positions the chosen place at the point the menu was opened over, then
   * closes the whole menu (TD-85) — picking from the dropdown is the whole
   * gesture, there's nothing left to confirm.
   */
  const handlePositionPlace = useCallback(
    (key: string) => {
      if (!position || !onPositionPlace) return;
      onPositionPlace(key, position.latlng.lat, position.latlng.lng);
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
        <PositionPlaceEntry
          here={unplacedHere}
          elsewhere={unplacedElsewhere}
          onPick={handlePositionPlace}
          label={positionPlaceLabel}
          {...(positionPlaceSublabel !== undefined && {
            sublabel: positionPlaceSublabel,
          })}
          hereLabel={positionPlaceHereLabel}
          elsewhereLabel={positionPlaceElsewhereLabel}
          filterPlaceholder={positionPlaceFilterPlaceholder}
          noMatchesLabel={positionPlaceNoMatchesLabel}
        />
      )}
    </div>
  );
});

MapContextMenu.displayName = "MapContextMenu";
