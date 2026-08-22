"use client";

import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Upload,
  Download,
  Trash2,
  ArrowLeft,
  Save,
  Edit2,
  MapPin,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { POI, POICategory, PlaceKind } from "@/app/modules/maps/types/poi";
import {
  POI_CATEGORIES,
  getCategoryColor,
  getCategoryBgColor,
} from "@/app/modules/maps/constants/poi-categories";
import {
  PLACE_KINDS,
  NAVIGABLE_PLACE_KINDS,
  isNavigablePlaceKind,
} from "@/app/modules/maps/constants/place-kinds";
import { formatDecimalDegrees } from "@/app/modules/maps/lib/utils/coordinates";
import {
  footprintCentre,
  type Footprint,
} from "@/app/modules/maps/lib/utils/footprint";
import { ALLOWED_MAP_IMAGE_CONTENT_TYPES } from "@/app/lib/storage/mapImageUploadRules";
import type { UnplacedChild } from "@/app/modules/maps/hooks/useUnplacedChildren";

/**
 * A navigable place (`region`, `plane`, `city`, `dungeon`) under the current
 * parent (SPEC-004 M5, T2). `kind: "poi"` is deliberately not part of this —
 * it keeps going through `onAddPOI`, unchanged. See `createPlace.ts` for
 * why. `kind: "deity"`/`"npc"` variants existed here until SPEC-008 T5: the
 * map no longer creates a new pin for an entity, only attaches an existing
 * one to a place that already exists (§5) — see `AssignLocationModal`.
 */
export type AddPlaceInput = {
  kind: "region" | "plane" | "city" | "dungeon";
  title: string;
  lat: number;
  lng: number;
  description?: string;
  mapImage: string;
  // The rectangle this place casts on the parent's map (SPEC-009 T2),
  // present only when it was created by drawing an area rather than
  // clicking a point.
  footprint?: Footprint;
};

interface MapPOIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pois: POI[];
  filterCategory?: POICategory | null;
  onAddPOI: (
    title: string,
    lat: number,
    lng: number,
    category: POICategory,
    description?: string
  ) => void;
  onUpdatePOI: (
    id: string,
    updates: Partial<Omit<POI, "id" | "createdAt">>
  ) => void;
  onDeletePOI: (id: string) => void;
  onClearAll: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onFlyTo: (poi: POI) => void;
  onRequestLocation?: () => void;
  onClearCoordinates?: () => void;
  onModeChange?: (mode: ViewMode) => void;
  isSelectingLocation?: boolean;
  initialLat?: number | undefined;
  initialLng?: number | undefined;
  cursorLat?: number | undefined;
  cursorLng?: number | undefined;
  // Control view mode from parent. `ViewMode`'s full range, including
  // "edit" — `MapPOIPanel` itself drives that transition (`handleEditMode`)
  // whenever an external mode is in force (TD-85: this used to be narrowed
  // to `"list" | "add"` here, so the caller had to cast a real "edit" value
  // down to a lie the compiler believed; see `WorldMap.tsx`'s
  // `handlePOIModeChange`).
  mode?: ViewMode;
  // Creates a navigable/deity/npc place under the current parent, returning
  // whether it succeeded and, on failure, the server's own refusal message
  // (SPEC-009 T2) — `createPlace` already names exactly what went wrong, so
  // this shows that instead of a generic fallback. Not optional: every
  // consumer of this panel is now scoped to a place (SPEC-004 M7), so there
  // is always a parent to attach to.
  onAddPlace: (
    input: AddPlaceInput
  ) => Promise<{ ok: boolean; error?: string }>;
  // This place's children still missing a position, any kind (TD-71,
  // SPEC-005 §5.A) — the "Unplaced places" section above the POI list.
  // Required like `onAddPlace`: every consumer is scoped to a place, so
  // there is always a (possibly empty) list to show.
  unplacedChildren: UnplacedChild[];
  // Toggles positioning mode for a child: calling it with an id already
  // being positioned cancels, same as calling it with a new one switches
  // the target. `null` means nothing is being positioned right now.
  onPositionPlace: (id: number) => void;
  positioningPlaceId: number | null;
  // A rectangle just finished drawing on the map (SPEC-009 T2) and is
  // waiting for this form: the kind selector narrows to the navigable
  // kinds, coordinate-picking is replaced by a read-only centre readout,
  // and `handleSave` derives `lat`/`lng` from the footprint itself.
  pendingFootprint?: Footprint | null;
  // The footprint above is no longer needed by the form — a successful
  // save, backing out to the list, or starting a fresh non-area add — so
  // the caller can drop it before it might otherwise attach itself to an
  // unrelated place.
  onFootprintConsumed?: () => void;
  // Opens the edit form pre-filled with this POI (SPEC-016 T7) — the place
  // popover's "Modifica" reaches `handleEditMode` from outside for the
  // first time; previously it was only ever called from `POIListItem`'s own
  // row, which nothing could reach (TD-85). The caller is expected to pair
  // this with `mode="edit"` and `isOpen`; this component only seeds the
  // form, it doesn't open the panel or force the mode itself.
  editTarget?: POI | null;
}

export type ViewMode = "list" | "add" | "edit";

interface POIFormData {
  kind: PlaceKind;
  title: string;
  description: string;
  lat: string;
  lng: string;
  category: POICategory;
  // Navigable kinds only — the file staged for upload, not yet sent anywhere.
  mapFile: File | null;
}

/**
 * POI List Item Component - Fixed: No nested buttons
 */
const POIListItem = memo(function POIListItem({
  poi,
  onEdit,
  onDelete,
  onFlyTo,
}: {
  poi: POI;
  onEdit: () => void;
  onDelete: () => void;
  onFlyTo: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const categoryColor = getCategoryColor(poi.category);
  const categoryBgColor = getCategoryBgColor(poi.category);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
    >
      {/* Category Icon - Clickable to fly to */}
      <button
        onClick={onFlyTo}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
        style={{ backgroundColor: categoryBgColor }}
        title="Fly to location"
      >
        <MapPin className="h-5 w-5" style={{ color: categoryColor }} />
      </button>

      {/* Content - Clickable to fly to */}
      <button onClick={onFlyTo} className="flex-1 min-w-0 text-left">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {poi.title}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDecimalDegrees([poi.lat, poi.lng], 4)}
        </div>
      </button>

      {/* Actions (show on hover) - Separate buttons, not nested */}
      {isHovered && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      )}
    </div>
  );
});

POIListItem.displayName = "POIListItem";

/**
 * MapPOIPanel - POI management panel
 *
 * Features:
 * - List view with category filtering
 * - Add/Edit POI forms
 * - Import/Export GeoJSON
 * - LocalStorage persistence
 * - Responsive (drawer on mobile, panel on desktop)
 * - Interactive coordinate selection
 */
export const MapPOIPanel = memo(function MapPOIPanel({
  isOpen,
  onClose,
  pois,
  filterCategory,
  onAddPOI,
  onUpdatePOI,
  onDeletePOI,
  onClearAll,
  onExport,
  onImport,
  onFlyTo,
  onRequestLocation,
  onClearCoordinates,
  onModeChange,
  isSelectingLocation: isSelectingLocationProp = false,
  initialLat,
  initialLng,
  cursorLat,
  cursorLng,
  mode: externalMode,
  onAddPlace,
  unplacedChildren,
  onPositionPlace,
  positioningPlaceId,
  pendingFootprint = null,
  onFootprintConsumed,
  editTarget = null,
}: MapPOIPanelProps) {
  const t = useTranslations();
  const [isMobile, setIsMobile] = useState(false);
  const [editingPOI, setEditingPOI] = useState<POI | null>(null);
  const [isSavingPlace, setIsSavingPlace] = useState(false);
  const [isUnplacedOpen, setIsUnplacedOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const snapPoints = [0.4, 0.7, 1];
  // TD-20b: snapPoints is a fixed literal array declared above, with three elements.
  const [snap, setSnap] = useState<number | string | null>(snapPoints[1]!);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Derive initial coordinates for form
  const initialLatStr = initialLat?.toFixed(6) || "";
  const initialLngStr = initialLng?.toFixed(6) || "";

  // Use external mode if provided, otherwise manage internally
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("list");
  const viewMode = externalMode || internalViewMode;
  const setViewMode = useCallback(
    (mode: ViewMode) => {
      if (externalMode && onModeChange) {
        // Notify parent of mode change
        onModeChange(mode);
      } else {
        // Manage internally
        setInternalViewMode(mode);
      }
    },
    [externalMode, onModeChange]
  );

  // Initialize form data - derive from props when available
  const initialFormData = useMemo<POIFormData>(
    () => ({
      kind: "poi",
      title: "",
      description: "",
      lat: initialLatStr,
      lng: initialLngStr,
      category: filterCategory || "food-drink",
      mapFile: null,
    }),
    [initialLatStr, initialLngStr, filterCategory]
  );

  const [formData, setFormData] = useState<POIFormData>(initialFormData);

  // Update form coordinates when they change from parent
  // This is a legitimate use of setState in effect for prop synchronization
  useEffect(() => {
    if (initialLatStr && initialLngStr) {
      setFormData((prev) => ({
        ...prev,
        lat: initialLatStr,
        lng: initialLngStr,
      }));
    }
  }, [initialLatStr, initialLngStr]);

  // A rectangle just finished drawing (SPEC-009 T2) — seed the form for an
  // area rather than a point: default to the first navigable kind (an area
  // is never a landmark), and clear the fields a fresh draw shouldn't
  // inherit from whatever was in the form before.
  useEffect(() => {
    if (pendingFootprint) {
      setFormData((prev) => ({
        ...prev,
        kind: NAVIGABLE_PLACE_KINDS[0],
        title: "",
        description: "",
        mapFile: null,
      }));
    }
  }, [pendingFootprint]);

  // Filter POIs by category if specified
  const displayPOIs = filterCategory
    ? pois.filter((poi) => poi.category === filterCategory)
    : pois;

  const filterCategoryLabelKey = filterCategory
    ? POI_CATEGORIES.find((c) => c.id === filterCategory)?.labelKey
    : undefined;
  // TD-95 — was the hardcoded "My Places". The DM asked for a rename while
  // this was being fixed, not a literal re-translation: "Luoghi di
  // interesse" in Italian, matched here by "Places of Interest" rather than
  // a re-translated "My Places" — echoing the POI terminology (POICategory,
  // "poiCategories") already used throughout this panel.
  const categoryName = filterCategoryLabelKey
    ? t(filterCategoryLabelKey)
    : t("geography.poiPanel.title");

  /**
   * Handle add POI mode. Also drops any pending footprint (SPEC-009 T2):
   * this is the plain "Add" entry, not the draw-an-area one, so a rectangle
   * left over from a drawn-then-abandoned area must not silently attach
   * itself to whatever gets created here.
   */
  const handleAddMode = useCallback(() => {
    setViewMode("add");
    setEditingPOI(null);
    setFormData({
      kind: "poi",
      title: "",
      description: "",
      lat: initialLatStr,
      lng: initialLngStr,
      category: filterCategory || "food-drink",
      mapFile: null,
    });
    onFootprintConsumed?.();
  }, [
    setViewMode,
    initialLatStr,
    initialLngStr,
    filterCategory,
    onFootprintConsumed,
  ]);

  /**
   * Handle edit POI mode. Editing is always `kind: "poi"` — `pois` (and so
   * the row this edits) never contains anything else (SPEC-004 M7,
   * `usePOIManager` only manages `kind: "poi"` children); the kind selector
   * below only renders in "add" mode for that reason.
   */
  const handleEditMode = useCallback(
    (poi: POI) => {
      setViewMode("edit");
      setEditingPOI(poi);
      setFormData({
        kind: "poi",
        title: poi.title,
        description: poi.description || "",
        lat: poi.lat.toFixed(6),
        lng: poi.lng.toFixed(6),
        category: poi.category,
        mapFile: null,
      });
    },
    [setViewMode]
  );

  // Seeds the edit form from outside (SPEC-016 T7) — the place popover's
  // "Modifica" hands this component a POI to edit rather than the DM
  // picking one from the (unreachable, TD-85) list row itself. Fires once
  // per distinct `editTarget` the caller hands over, not on every
  // `handleEditMode` identity change — the caller (`WorldMap`) is
  // responsible for clearing `editTarget` back to `null` once the panel
  // leaves edit mode, so re-editing the same landmark later still triggers
  // this (a `null` → POI transition, not a no-op re-render).
  useEffect(() => {
    if (editTarget) handleEditMode(editTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on `editTarget` alone, not `handleEditMode`'s own identity
  }, [editTarget]);

  const resetFormAfterSave = useCallback(() => {
    setViewMode("list");
    setEditingPOI(null);
    setFormData({
      kind: "poi",
      title: "",
      description: "",
      lat: "",
      lng: "",
      category: "food-drink",
      mapFile: null,
    });
    onClearCoordinates?.();
    onFootprintConsumed?.();
  }, [setViewMode, onClearCoordinates, onFootprintConsumed]);

  /**
   * Handle save. `kind: "poi"` (the only kind an edit ever is) keeps the
   * original synchronous, optimistic path through `onAddPOI`/`onUpdatePOI`.
   * `region`/`plane`/`city`/`dungeon` creation goes through `onAddPlace`
   * instead (SPEC-004 M5) — a real server round-trip, so the button
   * disables while it's in flight rather than optimistically closing the
   * form.
   */
  const handleSave = useCallback(async () => {
    const title = formData.title.trim();

    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    // SPEC-009 T2 — a pending footprint already fixes the position; the
    // coordinate fields are hidden for that flow and never populated, so
    // parsing them as typed input would always fail.
    let lat: number;
    let lng: number;
    if (pendingFootprint) {
      [lat, lng] = footprintCentre(pendingFootprint);
    } else {
      lat = parseFloat(formData.lat);
      lng = parseFloat(formData.lng);
      if (isNaN(lat) || isNaN(lng)) {
        toast.error("Please enter valid coordinates");
        return;
      }
    }

    if (viewMode === "edit" && editingPOI) {
      onUpdatePOI(editingPOI.id, {
        title,
        description: formData.description.trim() || undefined,
        lat,
        lng,
        category: formData.category,
      });
      toast.success("Place updated successfully");
      resetFormAfterSave();
      return;
    }

    const description = formData.description.trim() || undefined;

    if (formData.kind === "poi") {
      onAddPOI(title, lat, lng, formData.category, description);
      toast.success("Place added successfully");
      resetFormAfterSave();
      return;
    }

    if (isNavigablePlaceKind(formData.kind)) {
      if (!formData.mapFile) {
        toast.error("Please choose a map image");
        return;
      }

      setIsSavingPlace(true);
      try {
        const uploadBody = new FormData();
        uploadBody.set("file", formData.mapFile);
        const uploadResponse = await fetch("/api/maps/upload", {
          method: "POST",
          body: uploadBody,
        });
        if (!uploadResponse.ok) {
          toast.error("Could not upload the map");
          return;
        }
        const { id: mapImage } = (await uploadResponse.json()) as {
          id: string;
        };

        const result = await onAddPlace({
          kind: formData.kind,
          title,
          lat,
          lng,
          mapImage,
          ...(description !== undefined && { description }),
          ...(pendingFootprint && { footprint: pendingFootprint }),
        });
        if (!result.ok) {
          toast.error(result.error ?? "Could not save the place");
          return;
        }
      } finally {
        setIsSavingPlace(false);
      }

      toast.success("Place added successfully");
      resetFormAfterSave();
      return;
    }
  }, [
    formData,
    viewMode,
    editingPOI,
    pendingFootprint,
    onAddPOI,
    onUpdatePOI,
    onAddPlace,
    resetFormAfterSave,
  ]);

  /**
   * Handle import file
   */
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImport(file);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onImport]
  );

  /**
   * Handle delete POI with toast
   */
  const handleDeletePOI = useCallback(
    (id: string, title: string) => {
      onDeletePOI(id);
      toast.success(`"${title}" deleted`);
    },
    [onDeletePOI]
  );

  /**
   * Handle clear all with confirmation. The toast used to hand-build its own
   * English pluralisation (`place${n !== 1 ? "s" : ""}`) — next-intl's own
   * plural support (already used elsewhere in this catalogue, e.g.
   * `geography.unpositionedCount`) replaces it here (TD-95).
   */
  const handleClearAll = useCallback(() => {
    if (confirm(`Are you sure you want to delete all ${pois.length} POIs?`)) {
      onClearAll();
      toast.success(
        t("geography.poiPanel.clearedToast", { count: pois.length })
      );
    }
  }, [pois.length, onClearAll, t]);

  /**
   * Handle location selection mode toggle
   */
  const handleToggleLocationSelection = useCallback(() => {
    onRequestLocation?.();
  }, [onRequestLocation]);

  /**
   * Handle clear coordinates
   */
  const handleClearCoordinates = useCallback(() => {
    setFormData((prev) => ({ ...prev, lat: "", lng: "" }));
    if (!isSelectingLocationProp) {
      onRequestLocation?.();
    }
  }, [isSelectingLocationProp, onRequestLocation]);

  /**
   * Render content based on view mode
   */
  const renderContent = () => {
    // Form view (Add/Edit)
    if (viewMode === "add" || viewMode === "edit") {
      return (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 scrollbar-thin px-6 py-4">
          {/* Kind Selection — add mode only. Editing is always kind: "poi"
              (see handleEditMode), so changing kind mid-edit has no meaning. */}
          {viewMode === "add" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kind
              </label>
              <select
                value={formData.kind}
                onChange={(e) => {
                  const kind = e.target.value as PlaceKind;
                  setFormData((prev) => ({
                    ...prev,
                    kind,
                    mapFile: null,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {/* SPEC-009 T2 — a drawn area is always a navigable kind
                    (rule 1: a rectangle always means a map); a landmark
                    point isn't one of the options in that flow. */}
                {(pendingFootprint ? NAVIGABLE_PLACE_KINDS : PLACE_KINDS).map(
                  (kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {/* Coordinates Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Coordinates
            </label>
            {pendingFootprint ? (
              // SPEC-009 T2 — the footprint already fixes the position;
              // there is nothing to pick or type, just the derived centre
              // for confirmation.
              <div className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono text-gray-600 dark:text-gray-400">
                {formatDecimalDegrees(footprintCentre(pendingFootprint), 4)}
              </div>
            ) : formData.lat && formData.lng && !isSelectingLocationProp ? (
              <div className="flex gap-2">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.lat}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lat: e.target.value }))
                    }
                    placeholder="Latitude"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="text"
                    value={formData.lng}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lng: e.target.value }))
                    }
                    placeholder="Longitude"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <button
                  onClick={handleClearCoordinates}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t("geography.poiPanel.clearCoordinates")}
                >
                  <XCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={handleToggleLocationSelection}
                  className={`w-full px-4 py-3 border-2 border-dashed rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    isSelectingLocationProp
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                  }`}
                >
                  <MapPin
                    className={`h-4 w-4 ${
                      isSelectingLocationProp ? "animate-pulse" : ""
                    }`}
                  />
                  {isSelectingLocationProp
                    ? "Click on map to select location"
                    : "Click to select location on map"}
                </button>
                {isSelectingLocationProp && cursorLat && cursorLng && (
                  <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                      {cursorLat.toFixed(6)}, {cursorLng.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Selection — kind: "poi" only */}
          {formData.kind === "poi" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as POICategory,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {POI_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {t(cat.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Map Image — navigable kinds only (region, plane, city, dungeon) */}
          {isNavigablePlaceKind(formData.kind) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Map image
              </label>
              <input
                type="file"
                accept={ALLOWED_MAP_IMAGE_CONTENT_TYPES.join(",")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mapFile: e.target.files?.[0] ?? null,
                  }))
                }
                className="block w-full text-sm text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter place name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Description Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Add notes or details (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
            />
          </div>
        </div>
      );
    }

    // List view
    return (
      <>
        {/* Action Buttons */}
        <div className="px-6 py-4 border-b dark:border-gray-800">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleAddMode}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">
                Add
              </span>
            </button>
            <button
              onClick={handleImportClick}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">
                Import
              </span>
            </button>
            <button
              onClick={onExport}
              disabled={pois.length === 0}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">
                Export
              </span>
            </button>
            <button
              onClick={handleClearAll}
              disabled={pois.length === 0}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">
                {t("geography.poiPanel.clear")}
              </span>
            </button>
          </div>
        </div>

        {/* Unplaced places (TD-71, SPEC-005 §5.A) — any kind with no
            lat/lng yet. Above the POI list: positioning one is the
            precondition for it to ever appear there or on the map at all. */}
        {unplacedChildren.length > 0 && (
          <div className="border-b dark:border-gray-800">
            <button
              onClick={() => setIsUnplacedOpen((open) => !open)}
              className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span>
                {t("geography.poiPanel.unplacedCount", {
                  count: unplacedChildren.length,
                })}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isUnplacedOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isUnplacedOpen && (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {unplacedChildren.map((child) => {
                  const isPositioning = positioningPlaceId === child.id;
                  return (
                    <div
                      key={child.id}
                      className="flex items-center justify-between gap-3 px-6 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 dark:text-white truncate">
                          {child.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {child.kind}
                        </div>
                      </div>
                      <button
                        onClick={() => onPositionPlace(child.id)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isPositioning
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        <MapPin
                          className={`h-3.5 w-3.5 ${isPositioning ? "animate-pulse" : ""}`}
                        />
                        {isPositioning
                          ? "Click on map (cancel)"
                          : "Position on map"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* POI List */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 scrollbar-thin">
          {displayPOIs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <MapPin className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                No places yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Add your first place to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {displayPOIs.map((poi) => (
                <POIListItem
                  key={poi.id}
                  poi={poi}
                  onEdit={() => handleEditMode(poi)}
                  onDelete={() => handleDeletePOI(poi.id, poi.title)}
                  onFlyTo={() => onFlyTo(poi)}
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Header Image - Hidden on mobile */}
      {!isMobile && (
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600">
          <Image
            src="/leaflet/images/poi-bg.png"
            alt="POI Background"
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover"
            priority
            onError={(e) => {
              // Fallback to gradient if image not found
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />

          {/* Title overlay */}
          <div className="absolute bottom-4 left-6 right-6 z-20">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg">
              {categoryName}
            </h2>
            <p className="text-sm text-white/90 mt-1 drop-shadow">
              {displayPOIs.length}{" "}
              {displayPOIs.length === 1 ? "place" : "places"}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Header / Top Bar */}
      {isMobile && viewMode === "list" && (
        <div className="px-6 py-4 border-b dark:border-gray-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {categoryName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {displayPOIs.length} {displayPOIs.length === 1 ? "place" : "places"}
          </p>
        </div>
      )}

      {/* Top Bar (for add/edit mode) */}
      {(viewMode === "add" || viewMode === "edit") && (
        <div className="flex items-center justify-between px-6 py-3 border-b dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={() => {
              setViewMode("list");
              onFootprintConsumed?.();
            }}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {viewMode === "edit" ? "Edit Place" : "Add Place"}
          </h3>
          <button
            onClick={() => void handleSave()}
            disabled={isSavingPlace}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSavingPlace
              ? "Saving…"
              : viewMode === "edit"
                ? "Update"
                : "Save"}
          </button>
        </div>
      )}

      {/* Content */}
      {renderContent()}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.geojson"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        snapPoints={snapPoints}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        modal={false}
        noBodyStyles
      >
        <Drawer.Portal>
          <Drawer.Content
            className="fixed flex flex-col bg-white dark:bg-gray-900 rounded-t-[10px] bottom-0 left-0 right-0 h-full max-h-[97%] !z-[1100] shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
            aria-describedby={undefined}
          >
            <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-gray-300 dark:bg-gray-600" />
            <div className="flex-1 overflow-hidden">
              <Drawer.Title className="sr-only">{categoryName}</Drawer.Title>
              {content}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop: Side Panel
  return (
    <div
      className={`absolute top-0 left-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-[1000] transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Close Button */}
      <button
        onClick={() => {
          onClose();
        }}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-lg transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {content}
    </div>
  );
});

MapPOIPanel.displayName = "MapPOIPanel";
