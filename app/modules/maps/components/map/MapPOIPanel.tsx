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
} from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import type {
  POI,
  POICategory,
  LinkableEntityType,
  PlaceKind,
} from "@/app/modules/maps/types/poi";
import {
  POI_CATEGORIES,
  getCategoryColor,
  getCategoryBgColor,
} from "@/app/modules/maps/constants/poi-categories";
import { LINKABLE_ENTITY_TYPES } from "@/app/modules/maps/constants/linkable-entities";
import {
  PLACE_KINDS,
  isNavigablePlaceKind,
} from "@/app/modules/maps/constants/place-kinds";
import { formatDecimalDegrees } from "@/app/modules/maps/lib/utils/coordinates";
import { ALLOWED_MAP_IMAGE_CONTENT_TYPES } from "@/app/lib/storage/mapImageUploadRules";
import fetchLinkableEntities, {
  type LinkableEntityOption,
} from "@/app/lib/data/maps/fetchLinkableEntities";

/**
 * A navigable place (`region`, `plane`, `city`, `dungeon`), `deity` or `npc`
 * place under the current parent (SPEC-004 M5, T2). `kind: "poi"` is
 * deliberately not part of this — it keeps going through `onAddPOI`,
 * unchanged. See `createPlace.ts` for why.
 */
export type AddPlaceInput =
  | {
      kind: "region" | "plane" | "city" | "dungeon";
      title: string;
      lat: number;
      lng: number;
      description?: string;
      mapImage: string;
    }
  | {
      kind: "deity";
      title: string;
      lat: number;
      lng: number;
      description?: string;
      linkedType: "deity";
      linkedId: number;
    }
  | {
      kind: "npc";
      title: string;
      lat: number;
      lng: number;
      description?: string;
      linkedType: "npc";
      linkedId: number;
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
    description?: string,
    linkedType?: LinkableEntityType | null,
    linkedId?: number | null
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
  onModeChange?: (mode: "list" | "add" | "edit") => void;
  isSelectingLocation?: boolean;
  initialLat?: number | undefined;
  initialLng?: number | undefined;
  cursorLat?: number | undefined;
  cursorLng?: number | undefined;
  mode?: "list" | "add"; // Control view mode from parent
  // Creates a navigable/deity/npc place under the current parent, returning
  // whether it succeeded. Not optional: every consumer of this panel is now
  // scoped to a place (SPEC-004 M7), so there is always a parent to attach
  // to.
  onAddPlace: (input: AddPlaceInput) => Promise<boolean>;
}

type ViewMode = "list" | "add" | "edit";

interface POIFormData {
  kind: PlaceKind;
  title: string;
  description: string;
  lat: string;
  lng: string;
  category: POICategory;
  linkedType: LinkableEntityType | null;
  linkedId: number | null;
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
}: MapPOIPanelProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [editingPOI, setEditingPOI] = useState<POI | null>(null);
  const [isSavingPlace, setIsSavingPlace] = useState(false);
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
      linkedType: null,
      linkedId: null,
      mapFile: null,
    }),
    [initialLatStr, initialLngStr, filterCategory]
  );

  const [formData, setFormData] = useState<POIFormData>(initialFormData);

  // Options for the entity selector, cached per type for the life of the
  // panel — small lists (NPCs, deities), cheap to keep rather than refetch
  // every time the DM flips the type selector back and forth.
  const linkOptionsCacheRef = useRef<
    Partial<Record<LinkableEntityType, LinkableEntityOption[]>>
  >({});
  const [linkOptions, setLinkOptions] = useState<LinkableEntityOption[]>([]);
  const [isLoadingLinkOptions, setIsLoadingLinkOptions] = useState(false);

  // Fetch the entity list whenever a link type is chosen. Guarded by a
  // generation counter for the same reason `usePOIManager.renderMarkers` is:
  // switching the type twice in quick succession must not let the first,
  // slower fetch overwrite the second's result. The `setState` calls live
  // inside `loadOptions`, an async function invoked from the effect rather
  // than run directly in its body — the same shape `MapSearchBar` already
  // uses — because a synchronous `setState` at the top of an effect body
  // triggers `react-hooks/set-state-in-effect`.
  const linkFetchGenerationRef = useRef(0);
  useEffect(() => {
    const type = formData.linkedType;

    const loadOptions = async () => {
      if (type === null) {
        setLinkOptions([]);
        return;
      }

      const cached = linkOptionsCacheRef.current[type];
      if (cached) {
        setLinkOptions(cached);
        return;
      }

      linkFetchGenerationRef.current += 1;
      const generation = linkFetchGenerationRef.current;
      setIsLoadingLinkOptions(true);

      try {
        const options = await fetchLinkableEntities(type);
        if (generation !== linkFetchGenerationRef.current) return;
        linkOptionsCacheRef.current[type] = options;
        setLinkOptions(options);
      } catch (error) {
        console.error("Failed to load linkable entities:", error);
        if (generation !== linkFetchGenerationRef.current) return;
        toast.error("Could not load the list to link to");
      } finally {
        if (generation === linkFetchGenerationRef.current) {
          setIsLoadingLinkOptions(false);
        }
      }
    };

    void loadOptions();
  }, [formData.linkedType]);

  /**
   * Handle link type change — resets the chosen entity, since a previously
   * selected NPC id means nothing once the type switches to deity.
   */
  const handleLinkedTypeChange = useCallback((value: string) => {
    const type = value === "" ? null : (value as LinkableEntityType);
    setFormData((prev) => ({ ...prev, linkedType: type, linkedId: null }));
  }, []);

  const handleLinkedIdChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      linkedId: value === "" ? null : Number(value),
    }));
  }, []);

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

  // Filter POIs by category if specified
  const displayPOIs = filterCategory
    ? pois.filter((poi) => poi.category === filterCategory)
    : pois;

  const categoryName = filterCategory
    ? POI_CATEGORIES.find((c) => c.id === filterCategory)?.name
    : "My Places";

  /**
   * Handle add POI mode
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
      linkedType: null,
      linkedId: null,
      mapFile: null,
    });
  }, [setViewMode, initialLatStr, initialLngStr, filterCategory]);

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
        linkedType: poi.linkedType ?? null,
        linkedId: poi.linkedId ?? null,
        mapFile: null,
      });
    },
    [setViewMode]
  );

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
      linkedType: null,
      linkedId: null,
      mapFile: null,
    });
    onClearCoordinates?.();
  }, [setViewMode, onClearCoordinates]);

  /**
   * Handle save. `kind: "poi"` (the only kind an edit ever is) keeps the
   * original synchronous, optimistic path through `onAddPOI`/`onUpdatePOI`.
   * `region`/`deity`/`npc` creation goes through `onAddPlace` instead
   * (SPEC-004 M5) — a real server round-trip, so the button disables while
   * it's in flight rather than optimistically closing the form.
   */
  const handleSave = useCallback(async () => {
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    const title = formData.title.trim();

    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please enter valid coordinates");
      return;
    }

    if (viewMode === "edit" && editingPOI) {
      if (formData.linkedType !== null && formData.linkedId === null) {
        toast.error(
          "Please select an entity to link to, or set it back to None"
        );
        return;
      }

      onUpdatePOI(editingPOI.id, {
        title,
        description: formData.description.trim() || undefined,
        lat,
        lng,
        category: formData.category,
        linkedType: formData.linkedType,
        linkedId: formData.linkedId,
      });
      toast.success("Place updated successfully");
      resetFormAfterSave();
      return;
    }

    const description = formData.description.trim() || undefined;

    if (formData.kind === "poi") {
      if (formData.linkedType !== null && formData.linkedId === null) {
        toast.error(
          "Please select an entity to link to, or set it back to None"
        );
        return;
      }

      onAddPOI(
        title,
        lat,
        lng,
        formData.category,
        description,
        formData.linkedType,
        formData.linkedId
      );
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

        const succeeded = await onAddPlace({
          kind: formData.kind,
          title,
          lat,
          lng,
          mapImage,
          ...(description !== undefined && { description }),
        });
        if (!succeeded) {
          toast.error("Could not save the place");
          return;
        }
      } finally {
        setIsSavingPlace(false);
      }

      toast.success("Place added successfully");
      resetFormAfterSave();
      return;
    }

    // kind is "deity" or "npc" — branched, not a single object built from
    // `formData.kind`: `formData.kind` is still the two-member union here,
    // and `AddPlaceInput`'s deity/npc variants are separate types, so a
    // literal built from the union doesn't structurally match either one.
    const { kind, linkedId } = formData;
    if (linkedId === null) {
      toast.error("Please select an entity to link to");
      return;
    }

    setIsSavingPlace(true);
    let succeeded: boolean;
    try {
      succeeded = await (kind === "deity"
        ? onAddPlace({
            kind: "deity",
            title,
            lat,
            lng,
            linkedType: "deity",
            linkedId,
            ...(description !== undefined && { description }),
          })
        : onAddPlace({
            kind: "npc",
            title,
            lat,
            lng,
            linkedType: "npc",
            linkedId,
            ...(description !== undefined && { description }),
          }));
    } finally {
      setIsSavingPlace(false);
    }
    if (!succeeded) {
      toast.error("Could not save the place");
      return;
    }

    toast.success("Place added successfully");
    resetFormAfterSave();
  }, [
    formData,
    viewMode,
    editingPOI,
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
   * Handle clear all with confirmation
   */
  const handleClearAll = useCallback(() => {
    if (confirm(`Are you sure you want to delete all ${pois.length} POIs?`)) {
      onClearAll();
      toast.success(
        `Cleared ${pois.length} place${pois.length !== 1 ? "s" : ""}`
      );
    }
  }, [pois.length, onClearAll]);

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
                    linkedType:
                      kind === "deity" || kind === "npc" ? kind : null,
                    linkedId: null,
                    mapFile: null,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {PLACE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Coordinates Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Coordinates
            </label>
            {formData.lat && formData.lng && !isSelectingLocationProp ? (
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
                  title="Clear coordinates"
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
                    {cat.icon} {cat.name}
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

          {/* Linked Entity — kind: "poi" (optional, either type), or
              kind: "deity"/"npc" (required, type fixed by the kind chosen
              above, so only the entity itself is picked here). */}
          {formData.kind === "poi" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Linked entity
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.linkedType ?? ""}
                  onChange={(e) => handleLinkedTypeChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">None</option>
                  {LINKABLE_ENTITY_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {formData.linkedType !== null && (
                  <select
                    value={formData.linkedId ?? ""}
                    onChange={(e) => handleLinkedIdChange(e.target.value)}
                    disabled={isLoadingLinkOptions}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm disabled:opacity-50"
                  >
                    <option value="">
                      {isLoadingLinkOptions ? "Loading…" : "Select…"}
                    </option>
                    {linkOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
          {(formData.kind === "deity" || formData.kind === "npc") && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {LINKABLE_ENTITY_TYPES.find((t) => t.id === formData.kind)
                  ?.label ?? formData.kind}
              </label>
              <select
                value={formData.linkedId ?? ""}
                onChange={(e) => handleLinkedIdChange(e.target.value)}
                disabled={isLoadingLinkOptions}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm disabled:opacity-50"
              >
                <option value="">
                  {isLoadingLinkOptions ? "Loading…" : "Select…"}
                </option>
                {linkOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
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
                Clear
              </span>
            </button>
          </div>
        </div>

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
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-lg transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {content}
    </div>
  );
});

MapPOIPanel.displayName = "MapPOIPanel";
