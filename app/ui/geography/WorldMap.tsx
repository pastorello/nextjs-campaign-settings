"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LeafletMap } from "@/app/modules/maps/components/map/LeafletMap";
import { MapControls } from "@/app/modules/maps/components/map/MapControls";
import MapMeasureTool from "@/app/ui/geography/MapMeasureTool";
import parseGridScale from "@/app/lib/config/geography/parseGridScale";
import { MapContextMenu } from "@/app/modules/maps/components/map/MapContextMenu";
import {
  MapPOIPanel,
  type AddPlaceInput,
  type ViewMode,
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
import type {
  POI,
  POICategory,
  POIGeoJSON,
} from "@/app/modules/maps/types/poi";
import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";
import isValidString from "@/app/lib/utils/validators/isValidString";
import createPlace from "@/app/lib/data/maps/createPlace";
import placeLandmark from "@/app/lib/data/maps/placeLandmark";
import placeZone from "@/app/lib/data/maps/placeZone";
import updateZonePosition from "@/app/lib/data/maps/updateZonePosition";
import unplacePlace from "@/app/lib/data/maps/unplacePlace";
import PlacePopover, {
  type PopoverTarget,
} from "@/app/ui/geography/PlacePopover";
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
import {
  computeImageBounds,
  computeMinZoom,
} from "@/app/modules/maps/lib/utils/placeMapView";

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
  gridColumns,
  gridScale,
  onDescend,
  onMapChanged,
  onGridChanged,
  onDeleted,
  unpositionedCount,
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
}) {
  const t = useTranslations("geography.errors");
  const tGeography = useTranslations("geography");
  const tContextMenu = useTranslations("geography.contextMenu");
  const tDrawArea = useTranslations("geography.drawArea");
  const tTemporaryMarkers = useTranslations("geography.temporaryMarkers");
  const tMeasure = useTranslations("geography.measure");
  // Click–track–click measurement (SPEC-015 T7) — armed from the context
  // menu, only when the grid is configured; off on every load, like the
  // grid toggle.
  const [isMeasuring, setIsMeasuring] = useState(false);
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
  const [isPOIPanelOpen, setIsPOIPanelOpen] = useState(false);
  const [poiFilterCategory, setPOIFilterCategory] =
    useState<POICategory | null>(null);
  const [poiInitialCoords, setPOIInitialCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [poiPanelMode, setPOIPanelMode] = useState<ViewMode>("list");
  const [isSelectingPOILocation, setIsSelectingPOILocation] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // Draw-an-area mode (SPEC-009 T2) — armed by `MapContextMenu`'s "Add
  // sub-map" entry (ex-`DrawAreaButton`, consolidated 2026-08-17), consumed
  // by `useDrawArea`. `pendingFootprint` is the completed rectangle waiting for
  // the create form; mutually exclusive with `isSelectingPOILocation` (see
  // their handlers below), the same way the crosshair modes already exclude
  // each other by being distinct.
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [pendingFootprint, setPendingFootprint] = useState<Footprint | null>(
    null
  );
  // The area currently armed for a redraw-to-replace resize/move (SPEC-009
  // T5) — title is captured at arm time so a failure toast can name the area
  // without re-reading `areaChildren`. A third crosshair mode, mutually
  // exclusive with the other two the same way they already exclude each
  // other.
  const [editingArea, setEditingArea] = useState<{
    id: number;
    title: string;
  } | null>(null);

  // The place whose "Modifica" panel is open (TD-104). Holds the whole
  // `NavigableChild` because the panel seeds three things from it — name,
  // description, and whether there is a footprint to redraw — and because
  // mounting on this value rather than gating a permanently-mounted panel
  // with `isOpen` is what makes the seeding correct for free: editing place
  // A and then place B mounts a fresh form, so there is no stale-target
  // clearing dance of the kind `poiEditTarget` needs below.
  const [editingZone, setEditingZone] = useState<NavigableChild | null>(null);

  // The place popover (SPEC-016 T2, widened to landmarks in T7) — one at a
  // time by construction, a single state slot rather than a set. Clicking a
  // marker/rectangle (`useNavigableChildren`) or a landmark marker
  // (`usePOIManager`) used to descend/open a native Leaflet popup
  // respectively; now both open this instead, and "Apri mappa" inside the
  // popover is what actually descends (zone only — a landmark has none).
  const [popoverTarget, setPopoverTarget] = useState<PopoverTarget | null>(
    null
  );

  // The landmark `MapPOIPanel`'s edit form is pre-filled for (SPEC-016 T7,
  // "Modifica") — `null` whenever the panel isn't in an externally-requested
  // edit, cleared by `handlePOIModeChange` the moment the panel leaves edit
  // mode (cancelled or saved) so re-editing the same landmark later still
  // transitions `null` → POI rather than being a no-op re-render.
  const [poiEditTarget, setPoiEditTarget] = useState<POI | null>(null);

  // Context menu hook
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    close: closeContextMenu,
    runWithoutClosing,
  } = useMapContextMenu();

  // User markers hook — ephemeral, table-talk scratch pins (TD-86): no
  // persistence anywhere by design, so `clearMarkers` is this component's
  // only way to let the DM (or a player — this control isn't DM-gated) get
  // rid of them before a reload does it automatically. `removeMarker`
  // (per-marker) stays unused here; a bulk "clear temporary markers" control
  // was the simpler of the two dismiss shapes TD-86 proposed.
  const { markers, addMarker, clearMarkers } = useMapMarkers();

  // A landmark marker click opens the popover (SPEC-016 T7), the same
  // `isMeasuring` guard `handlePlaceClick` uses below for the identical
  // reason (§5's edge-case table: map clicks belong to the measure tool
  // while it's active). Declared ahead of `usePOIManager` — it's this
  // hook's own `onPOIClick` argument — the same ordering constraint
  // `handleEditMode`/`createMarker` already impose inside that hook.
  const handlePOIClick = useCallback(
    (poi: POI) => {
      if (isMeasuring) return;
      setPopoverTarget({ kind: "poi", poi });
    },
    [isMeasuring]
  );

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
  } = usePOIManager(parentId, handlePOIClick);

  // Bumped after a successful region create so `useNavigableChildren`
  // reloads — its own effect only reruns on `parentId`/`refetchToken`
  // changing, and creating a place changes neither.
  const [placesRefetchToken, setPlacesRefetchToken] = useState(0);

  // A marker/rectangle click opens the popover instead of descending
  // directly (SPEC-016 T2) — suppressed while measuring, since map clicks
  // belong to the measure tool then (§5's edge-case table). Other crosshair
  // modes (positioning, drawing an area) don't need a guard here: a Leaflet
  // marker/rectangle click never reaches the map's own click handler those
  // modes listen on.
  const handlePlaceClick = useCallback(
    (child: NavigableChild) => {
      if (isMeasuring) return;
      setPopoverTarget({ kind: "zone", place: child });
    },
    [isMeasuring]
  );

  // "Apri mappa" (SPEC-016 T2) — the popover's own descend action, now the
  // only path into `onDescend`.
  const handleOpenMap = useCallback(
    (child: NavigableChild) => {
      onDescend(child);
      setPopoverTarget(null);
    },
    [onDescend]
  );

  const handleClosePopover = useCallback(() => {
    setPopoverTarget(null);
  }, []);

  // "Sposta nei luoghi non posizionati" (SPEC-016 T5) — no confirmation
  // (§9's open question, agreed 2026-08-21). Clears the place's position
  // (and, for an area, its footprint — `unplacePlace` handles both) and
  // sends it back to the unpositioned pool. Success bumps
  // `placesRefetchToken`, the same convention `handleContextMenuPositionPlace`
  // uses in the other direction, so `unplacedChildren` picks up the child and
  // `navigableChildren` drops its marker; the popover closes since there is
  // nothing left at this position to show. `unpositionedCount` itself gets
  // no equivalent bump here, because a client-side "bonus" on top of
  // whatever the server already did double-counted — that much was
  // observed, and it is the reason this code looks the way it does.
  //
  // What this comment used to claim, and should not have (TD-105): that
  // the refresh comes from `unplacePlace`'s
  // `revalidatePath("/dashboard/geography")`, "confirmed live in e2e".
  // The observation was real and the attribution was not. `revalidatePath`
  // matches the route *file* structure, and these pages are
  // `app/[locale]/dashboard/geography` — so the correct argument is
  // `("/[locale]/dashboard/geography", "page")` and no call in this
  // codebase is in that form. E2E cannot settle it either way: it runs
  // `pnpm dev`, where Server Components re-render per request regardless.
  // Pointing this mutation at a nonsense path leaves `map-unplace.spec`
  // passing, count assertion included. See TD-105.
  const handleUnplace = useCallback(
    async (child: NavigableChild) => {
      try {
        const result = await unplacePlace({ id: child.id });
        if (result.ok) {
          setPlacesRefetchToken((token) => token + 1);
          setPopoverTarget(null);
        } else {
          toast.error(t("placeUnplaceFailed", { title: child.title }));
        }
      } catch (error) {
        console.error("Failed to un-place the place:", error);
        toast.error(t("placeUnplaceFailed", { title: child.title }));
      }
    },
    [t]
  );

  // "Rimuovi definitivamente" (SPEC-016 T6) — `PlacePopover` embeds
  // `DeletePlaceButton` itself (the confirmation dialog and the SPEC-010
  // mutation are entirely its own); this only runs once it reports success.
  // Same bookkeeping `handleUnplace` does, for the same reason: the deleted
  // place is a child of the one currently being viewed, not the one
  // currently being viewed itself, so there is no navigation stack to pop —
  // just a marker to drop and a popover with nothing left to show.
  const handlePopoverPlaceDeleted = useCallback(() => {
    setPlacesRefetchToken((token) => token + 1);
    setPopoverTarget(null);
  }, []);

  // "Modifica" (SPEC-016 T7) — opens the shared `MapPOIPanel` drawer already
  // in edit mode, pre-filled with the clicked landmark (`editTarget`,
  // consumed by the panel's own seeding effect). The popover closes: the
  // DM's focus has moved to the edit form, the same way "Apri mappa"
  // already closes it for a zone.
  const handleEditLandmark = useCallback((poi: POI) => {
    setPoiEditTarget(poi);
    setPOIPanelMode("edit");
    setIsPOIPanelOpen(true);
    setPopoverTarget(null);
  }, []);

  // "Modifica" (TD-104) — opens `ZoneEditPanel` for the clicked place. The
  // popover closes for the same reason it does for a landmark: the DM's
  // focus has moved to the form. It has to, besides — `useDrawArea` and the
  // popover's own outside-click listener both bind `mousedown`, so a
  // popover left open would be dismissed by the first drag of a redraw
  // anyway.
  const handleEditZone = useCallback((place: NavigableChild) => {
    setEditingZone(place);
    setPopoverTarget(null);
  }, []);

  // The panel committed a name/description. Nothing here holds those two
  // directly — `useNavigableChildren` owns the list the map draws from — so
  // a refetch is the whole update, the same bookkeeping every other place
  // mutation on this component does.
  const handleZoneEdited = useCallback(() => {
    setPlacesRefetchToken((token) => token + 1);
  }, []);

  // "Elimina" (SPEC-016 T7) — `usePOIManager.deletePOI` is synchronous
  // (optimistic, no server round trip to await) and already unconfirmed, so
  // this closes the popover immediately rather than waiting on anything.
  const handleDeleteLandmark = useCallback(
    (poi: POI) => {
      deletePOI(poi.id);
      setPopoverTarget(null);
    },
    [deletePOI]
  );

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

  // This place's children with no position yet — always a Zone now (SPEC-008
  // T8: a landmark POI's `lat`/`lng` are required at creation) — feeds
  // `MapContextMenu`'s "Posiziona luogo" dropdown and its count (TD-85).
  // It used to feed `MapPOIPanel`'s "Unplaced places" picker as well; that
  // was the DM's second method for the same job and is withdrawn (SPEC-016
  // T9, SPEC-005 §3).
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
  // The bounds actually framing the map right now — starts as the
  // stored/default `bounds` prop and is corrected once the loaded image
  // reports its real pixel dimensions (TD-81/TD-87). Kept in state, not
  // derived inline, because both `useDrawArea` instances below need the
  // corrected value too: clamping a drawn rectangle to the old default
  // square while the visible image is a different aspect ratio would let
  // the DM draw outside what the map actually shows.
  const [effectiveBounds, setEffectiveBounds] =
    useState<L.LatLngBoundsExpression>(bounds);
  // The loaded image's natural pixel size (SPEC-015 T5) — `null` until the
  // browser reports it, and reset on every map change, so the grid panel's
  // derived height renders as `—` rather than a number computed from a
  // previous map's aspect ratio.
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleMeasureExit = useCallback(() => {
    setIsMeasuring(false);
  }, []);

  // Context menu handlers
  const handleAddMarker = useCallback(
    (lat: number, lng: number) => {
      void addMarker(lat, lng);
    },
    [addMarker]
  );

  const handleContextMenuMeasurement = useCallback(() => {
    // No grid, no distances (§5's edge-case table): measurement never
    // starts, and the DM gets the one-line explanation rather than a
    // guessed number. `imageSize === null` (image still loading or
    // undecodable) blocks for the same reason — there is no pixel width
    // to convert through yet.
    if (
      gridColumns === null ||
      parseGridScale(gridScale) === null ||
      imageSize === null
    ) {
      toast.info(tMeasure("unavailable"));
      return;
    }
    setIsMeasuring(true);
  }, [gridColumns, gridScale, imageSize, tMeasure]);

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
    setPOIPanelMode("list");
    setPendingFootprint(null);
    setPoiEditTarget(null);
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

  // Positions an unplaced place directly at the point the context menu was
  // opened over (TD-85) — the right-click itself is the aim, so picking a
  // place from "Posiziona luogo"'s dropdown finalizes the position right
  // away rather than re-arming a second crosshair click the way the
  // withdrawn panel picker did (SPEC-016 T9). `MapContextMenu`
  // withholds this entry over an existing area with the same `hideAddPlace`
  // gate it already applies to "Add Place" (SPEC-009 T4), so this handler
  // never needs its own containment check.
  const handleContextMenuPositionPlace = useCallback(
    async (id: number, lat: number, lng: number) => {
      const child = unplacedChildren.find((candidate) => candidate.id === id);
      const title = child?.title ?? "";

      // TD-102 — the id on its own does not say which table to write to.
      // `fetchPlaceChildren` merges `zone` and `poi` rows into one list and
      // the two id sequences are independent, so without the row that
      // produced this entry there is nothing to route on. Refuse rather
      // than default to a table: defaulting is what moved a place the DM
      // never chose.
      if (!child) {
        console.error("No unplaced child matches the chosen id:", id);
        toast.error(t("placePositionFailed", { title }));
        return;
      }

      const isLandmark = child.kind === "poi";

      try {
        // `kind === "poi"` is a sound discriminator, not a convention:
        // `fetchPlaceChildren` hardcodes it for every `poi` row,
        // `placeSchema` restricts `zone.kind` to the navigable kinds, and
        // SPEC-008 T8's migration copied only navigable-kind rows into
        // `zone`. No zone can carry it.
        const result = isLandmark
          ? await placeLandmark({ id, lat, lng })
          : await placeZone({ id, parentId, lat, lng });
        if (result.ok) {
          setPlacesRefetchToken((token) => token + 1);
          // A landmark that gains coordinates has to be *loaded*, not just
          // dropped from the unplaced list: `usePOIManager` owns the
          // landmark markers and holds its own state, and this write
          // happened outside its optimistic path — the row is not in `pois`
          // yet, so `updatePOI` would have nothing to find. `reloadPOIs`
          // exists for exactly this and had been left with no caller:
          // SPEC-016 T9 withdrew `MapPOIPanel`'s unplaced picker, which was
          // the one that used to call it. Without this the placement
          // persists and the marker appears only on the next reload
          // (TD-102).
          if (isLandmark) await reloadPOIs();
        } else {
          // TD-93 — a refused second placement is not a failed one: the
          // write was rejected on purpose, and the DM needs to be told what
          // to do about it rather than invited to "try again". The landmark
          // wording stops short of naming a recovery: SPEC-016 T5's "Sposta
          // nei luoghi non posizionati" exists for navigable places only,
          // so telling a DM to un-place a landmark first would point at a
          // control that is not there (TD-102).
          toast.error(
            result.code === "alreadyPlaced"
              ? isLandmark
                ? t("landmarkAlreadyPositioned", { title })
                : t("placeAlreadyPositioned", { title })
              : t("placePositionFailed", { title })
          );
        }
      } catch (error) {
        console.error("Failed to position place from the context menu:", error);
        toast.error(t("placePositionFailed", { title }));
      }
    },
    // `parentId` is a dependency now that a placement writes it (SPEC-017
    // T4): `GeographyExplorer` does not key `WorldMap`, so descending swaps
    // the prop on a mounted component and a memoised handler holding the
    // old id would move the place onto the map the DM just left.
    [unplacedChildren, parentId, reloadPOIs, t]
  );

  // Handle POI location selection request. Also cancels draw-area mode
  // (SPEC-009 T2) — see `handleToggleDrawArea`.
  const handleRequestPOILocation = useCallback(() => {
    setIsDrawingArea(false);
    setEditingArea(null);
    setIsSelectingPOILocation((prev) => !prev);
  }, []);

  // Arms/disarms draw-area mode (SPEC-009 T2), cancelling the other
  // crosshair modes the same way they cancel this one.
  const handleToggleDrawArea = useCallback(() => {
    setIsSelectingPOILocation(false);
    setEditingArea(null);
    setCursorCoords(null);
    setIsDrawingArea((prev) => !prev);
  }, []);

  // Arms the redraw-to-replace gesture (SPEC-009 T5) — the mirror of
  // `handleToggleDrawArea`, cancelling the other crosshair modes for the
  // same reason. `ZoneEditPanel` is the one caller: the right-click menu
  // used to arm this too, on the area the cursor was inside, and TD-104
  // removed that entry (the DM, 2026-08-30) in favour of a single edit
  // surface reached from the place itself. Still takes its target as an
  // argument rather than reading `contextMenuOverArea`, which is the shape
  // that let the popover reach it in the first place.
  const armAreaRedraw = useCallback((area: { id: number; title: string }) => {
    setIsDrawingArea(false);
    setIsSelectingPOILocation(false);
    setCursorCoords(null);
    setEditingArea(area);
  }, []);

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
    bounds: effectiveBounds,
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
    bounds: effectiveBounds,
    onComplete: (footprint) => void handleAreaEditDrawn(footprint),
    onCancel: handleAreaEditCancelled,
  });

  // Handle clear POI coordinates
  const handleClearPOICoordinates = useCallback(() => {
    setPOIInitialCoords(null);
    setCursorCoords(null);
    setIsSelectingPOILocation(false);
  }, []);

  // Handle POI panel mode change. Used to store this with a
  // `mode as "list" | "add"` cast, silently dropping a real "edit" value
  // the compiler was never told could happen — `poiPanelMode`'s declared
  // type now matches this callback's own parameter type, so there's
  // nothing left to lie about (TD-85).
  const handlePOIModeChange = useCallback((mode: ViewMode) => {
    setPOIPanelMode(mode);
    // Leaving edit mode — cancelled back to the list, or a successful save
    // (`MapPOIPanel.resetFormAfterSave`) — either way (SPEC-016 T7):
    // `poiEditTarget` cleared so re-editing the same landmark later is a
    // `null` → POI transition the panel's seeding effect actually fires on,
    // not a no-op re-render.
    if (mode !== "edit") setPoiEditTarget(null);
  }, []);

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
    [isSelectingPOILocation, areaChildren, onDescend]
  );

  // Handle map mouse move for cursor tracking
  const handleMapMouseMove = useCallback(
    (lat: number, lng: number) => {
      if (isSelectingPOILocation) {
        setCursorCoords({ lat, lng });
      }
    },
    [isSelectingPOILocation]
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
    setCursorCoords(null);
    setEditingArea(null);
    // Same reasoning as the popover below: the panel edits a place that
    // belongs to the map being left (TD-104).
    setEditingZone(null);
    // The popover refers to a place on the map being left (SPEC-016 T2) —
    // `WorldMap` isn't remounted on `parentId` change, so without this it
    // would survive the navigation open, anchored to nothing on the new map.
    setPopoverTarget(null);
    // "Off on every load" (SPEC-015 §9) includes navigating to another
    // place — `WorldMap` isn't remounted on `parentId` change, so without
    // this the previous map's toggle state would carry over. The measure
    // tool disarms for the same reason: its grid is the previous map's.
    setIsGridVisible(false);
    setIsMeasuring(false);
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

        // The previous map's dimensions say nothing about this one —
        // unknown again until the new image reports its own (SPEC-015 T5).
        setImageSize(null);

        // Framed with the stored/default bounds and hidden (opacity 0)
        // until the image itself reports its real pixel dimensions
        // (TD-81) — the stored `mapBounds` is a hardcoded square today
        // (nothing writes it yet, see the module doc comment in
        // `placeMapView.ts`), so painting it before correction would
        // stretch a non-square image on one axis for however long the
        // fetch takes.
        const image = L.imageOverlay(mapUrl, bounds, { opacity: 0 });

        if (map) {
          image.addTo(map);
          setCurrentImage(image);
          setEffectiveBounds(bounds);

          // Interim framing before the image's own dimensions are known —
          // the same stored/default view this component has always opened
          // with. Corrected below once the image reports its real size.
          //
          // TD-87: the floor must be measured, not pinned to a constant —
          // `getBoundsZoom` reports the zoom at which the image fills the
          // container, but it clamps its own answer to whatever
          // minZoom/maxZoom the map *currently* has (`LeafletMap`'s
          // tile-map default of 3 the very first time this effect runs, or
          // a previous render's own computed floor on any later one), so
          // the floor is loosened first or the "fit" would just echo the
          // old floor back unchanged.
          //
          // `setView` fires Leaflet's `zoomstart` whenever it changes the
          // zoom — wrapped in `runWithoutClosing` so it can never be mistaken
          // for the DM zooming the map and close a context menu that happens
          // to be open (unlikely for this interim call, which runs at mount,
          // but the corrective re-fit below is exactly this situation and the
          // two are kept consistent).
          runWithoutClosing(() => {
            map.setMinZoom(-Infinity);
            const minZoom = computeMinZoom(
              map.getBoundsZoom(bounds),
              initialZoom
            );
            map.setMinZoom(minZoom);
            map.setMaxZoom(10);
            map.setMaxBounds(bounds);
            // `animate: false`, and not only because an animated initial
            // framing is pointless: `runWithoutClosing`'s suppression window
            // is synchronous, and Leaflet defers an *animated* zoom's
            // `zoomstart` into a `requestAnimFrame` (`_tryAnimatedZoom`) —
            // outside the window, where it would close a context menu the DM
            // has meanwhile opened. With `animate: false` the whole view
            // change, `zoomstart` included, runs inside the suppression.
            //
            // This reasoning used to be written in terms of `movestart` and
            // the pan `setMaxBounds`'s `panInsideMaxBounds` hook makes on the
            // deferred `moveend` — the cascade CI caught, where the menu
            // detached ~100ms after opening. That cascade still happens;
            // since TD-100 the menu simply does not listen to it any more,
            // which is why the argument for `animate: false` is now the zoom
            // rather than the pan.
            map.setView(initialView, initialZoom, { animate: false });
          });

          image.once("load", () => {
            if (cancelled) return;

            const element = image.getElement();
            const naturalWidth = element?.naturalWidth;
            const naturalHeight = element?.naturalHeight;
            // A broken/undecodable image has no natural size to frame
            // against — fall back to the stored/default bounds rather than
            // computing nonsense from zeros.
            const fittedBounds =
              naturalWidth && naturalHeight
                ? computeImageBounds(naturalWidth, naturalHeight)
                : bounds;
            // Same guard as above: a broken image keeps the aspect ratio
            // unknown, so the grid panel's derived height stays `—`.
            setImageSize(
              naturalWidth && naturalHeight
                ? { width: naturalWidth, height: naturalHeight }
                : null
            );

            // `ImageOverlay.setBounds` requires an actual `L.LatLngBounds`
            // instance, unlike the constructor and `Map.fitBounds`/
            // `setMaxBounds`, which accept the plain tuple form directly —
            // `fittedBounds` is always that plain 2-corner tuple in
            // practice (from `computeImageBounds` or the stored/default
            // `bounds` prop, never an existing `LatLngBounds` instance).
            const [southWest, northEast] = fittedBounds as [
              L.LatLngTuple,
              L.LatLngTuple,
            ];
            image.setBounds(L.latLngBounds(southWest, northEast));
            image.setOpacity(1);
            setEffectiveBounds(fittedBounds);

            // TD-87, same reasoning as the interim framing above: the
            // floor is re-measured against the corrected bounds (fixing
            // bounds without re-fitting the floor to match would leave the
            // floor stale, still measured against the stored/default
            // square) — loosened first so `getBoundsZoom` reports the real
            // fit rather than the floor just set above. `fitBounds` below
            // is what the map is about to open at, so it doubles as its
            // own `openZoom`.
            //
            // This whole re-fit is wrapped in `runWithoutClosing`: it fires
            // whenever the browser finishes loading the image, which is
            // asynchronous and can land well after mount — including while
            // a DM has the right-click context menu open. `fitBounds`
            // changes the zoom, and Leaflet fires `zoomstart` for that
            // exactly as it does for the DM's own wheel or pinch, so
            // unwrapped it closed the menu (and detached its "Aggiungi
            // luogo" button) mid-click in CI, a real regression this fixes
            // rather than a flaky test.
            runWithoutClosing(() => {
              map.setMinZoom(-Infinity);
              const fitZoom = map.getBoundsZoom(fittedBounds);
              map.setMinZoom(computeMinZoom(fitZoom, fitZoom));
              map.setMaxBounds(fittedBounds);
              // Same `animate: false` reasoning as the interim framing
              // above — this re-fit is the case that actually bit in CI.
              map.fitBounds(fittedBounds, { animate: false });
            });
          });
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
        onMouseMove={handleMapMouseMove}
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
          className="absolute top-4 right-4 z-[1000] flex items-center gap-2 rounded-lg bg-white dark:bg-slate-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
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
          parentId={parentId}
          parentTitle={placeTitle}
          onClose={handleClosePopover}
          onOpenMap={handleOpenMap}
          onUnplace={(child) => void handleUnplace(child)}
          onDeleted={handlePopoverPlaceDeleted}
          onEditZone={handleEditZone}
          onEditLandmark={handleEditLandmark}
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
        onAddPOI={handleContextMenuAddPOI}
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
        unplacedPlaces={unplacedChildren}
        onPositionPlace={(id, lat, lng) =>
          void handleContextMenuPositionPlace(id, lat, lng)
        }
        positionPlaceLabel={tContextMenu("positionPlace.trigger")}
        positionPlaceSublabel={tGeography("unpositionedCount", {
          count: unpositionedCount,
        })}
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
        pendingFootprint={pendingFootprint}
        onFootprintConsumed={handleFootprintConsumed}
        editTarget={poiEditTarget}
      />
    </div>
  );
}

export default WorldMap;
