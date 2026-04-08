"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { LeafletMap } from "@/app/modules/maps/components/map/LeafletMap";
import { LeafletTileLayer } from "@/app/modules/maps/components/map/LeafletTileLayer";
import { LeafletGeoJSON } from "@/app/modules/maps/components/map/LeafletGeoJSON";
import { MapSearchBar } from "@/app/modules/maps/components/map/MapSearchBar";
import { MapTopBar } from "@/app/modules/maps/components/map/MapTopBar";
import { MapTileSwitcher } from "@/app/modules/maps/components/map/MapTileSwitcher";
import { MapControls } from "@/app/modules/maps/components/map/MapControls";
import { MapDetailsPanel } from "@/app/modules/maps/components/map/MapDetailsPanel";
import { MapMeasurementPanel } from "@/app/modules/maps/components/map/MapMeasurementPanel";
import { MapContextMenu } from "@/app/modules/maps/components/map/MapContextMenu";
import { MapPOIPanel } from "@/app/modules/maps/components/map/MapPOIPanel";
import { useMapTileProvider } from "@/app/modules/maps/hooks/useMapTileProvider";
import { useMapContextMenu } from "@/app/modules/maps/hooks/useMapContextMenu";
import { useMapMarkers } from "@/app/modules/maps/hooks/useMapMarkers";
import { usePOIManager } from "@/app/modules/maps/hooks/usePOIManager";
import type { POICategory } from "@/app/modules/maps/types/poi";
import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";
import { m } from "framer-motion";
import isValidString from "@/app/lib/utils/validators/isValidString";
import { sendErrorNotification } from "@/app/lib/actions/notifications/sendNotification";

// Memoized style object to prevent unnecessary re-renders
const GEOJSON_STYLE = {
  fillColor: "#3b82f6",
  fillOpacity: 0.2,
  color: "#2563eb",
  weight: 2,
} as const;

/**
 * MapMain - Main map component with theme-aware tile provider
 *
 * Optimizations:
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Static style object for GeoJSON
 * - Stable function references
 */
function WorldMap({
  mapUrl,
  bounds,
  initialView,
  initialZoom,
}: {
  mapUrl: string;
  bounds: L.LatLngBoundsExpression;
  initialView: L.LatLngExpression;
  initialZoom: number;
}) {
  const [selectedCountry, setSelectedCountry] =
    useState<GeoJSON.Feature | null>(null);
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
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

  // Use custom hook for theme-aware tile provider management
  const { tileProvider, currentProviderId, setProviderId } =
    useMapTileProvider();

  // Context menu hook
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    close: closeContextMenu,
  } = useMapContextMenu();

  // User markers hook
  const { addMarker } = useMapMarkers();

  // POI Manager hook
  const {
    pois,
    addPOI,
    updatePOI,
    deletePOI,
    clearAllPOIs,
    exportGeoJSON,
    importGeoJSON,
    flyToPOI,
  } = usePOIManager();

  const map = useLeafletMap();
  const [currentImage, setCurrentImage] = useState<L.ImageOverlay | null>(null);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleCountrySelect = useCallback(async (countryId: string) => {
    try {
      const response = await fetch(
        `/api/countries/${encodeURIComponent(countryId)}`
      );
      const feature = await response.json();
      setSelectedCountry(feature);
    } catch (error) {
      console.error("Error loading country GeoJSON:", error);
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedCountry(null);
  }, []);

  const handleMeasurementOpen = useCallback(() => {
    setIsMeasurementOpen(true);
  }, []);

  const handleMeasurementClose = useCallback(() => {
    setIsMeasurementOpen(false);
  }, []);

  // Context menu handlers
  const handleAddMarker = useCallback(
    (lat: number, lng: number) => {
      addMarker(lat, lng);
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
  const handleOpenPOIPanel = useCallback((category?: POICategory) => {
    setPOIFilterCategory(category || null);
    setPOIInitialCoords(null);
    setPOIPanelMode("list");
    setIsPOIPanelOpen(true);
  }, []);

  const handleClosePOIPanel = useCallback(() => {
    setIsPOIPanelOpen(false);
    setIsSelectingPOILocation(false);
    setPOIPanelMode("list");
    // Reset coordinates and category after a brief delay to allow panel to close smoothly
    setTimeout(() => {
      setPOIFilterCategory(null);
      setPOIInitialCoords(null);
    }, 100);
  }, []);

  // Handle POI location selection request
  const handleRequestPOILocation = useCallback(() => {
    setIsSelectingPOILocation((prev) => !prev);
  }, []);

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

  // Handle map click for POI location selection
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isSelectingPOILocation) {
        setPOIInitialCoords({ lat, lng });
        setIsSelectingPOILocation(false);
        setCursorCoords(null);
      }
    },
    [isSelectingPOILocation]
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
        const geojson = JSON.parse(text);
        const count = importGeoJSON(geojson);
        toast.success(
          `Successfully imported ${count} place${count !== 1 ? "s" : ""}!`
        );
      } catch (error) {
        console.error("Failed to import POIs:", error);
        toast.error("Failed to import file. Please check the format.");
      }
    },
    [importGeoJSON]
  );

  // Category click handler for MapTopBar
  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      // Map category IDs to POI categories
      const categoryMapping: Record<string, POICategory> = {
        restaurants: "food-drink",
        hotels: "lodging",
        attractions: "tourism",
        transit: "transport",
      };

      const poiCategory = categoryMapping[categoryId.toLowerCase()];
      if (poiCategory) {
        handleOpenPOIPanel(poiCategory);
      }
    },
    [handleOpenPOIPanel]
  );

  // Memoize tile layer props to prevent unnecessary updates
  const tileLayerProps = useMemo(
    () => ({
      url: tileProvider.url,
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom,
    }),
    [tileProvider.url, tileProvider.attribution, tileProvider.maxZoom]
  );

  const initializeMap = async () => {
    if (!isValidString(mapUrl)) {
      sendErrorNotification("Map URL is not configured properly.");
      return;
    }

    const L = await import("leaflet");

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
  };

  useEffect(() => {
    initializeMap();
  }, [map, mapUrl]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map */}
      <LeafletMap
        className="w-full h-full"
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        cursorStyle={isSelectingPOILocation ? "crosshair" : "grab"}
      ></LeafletMap>

      {/* Search Bar
      <MapSearchBar
        onCountrySelect={handleCountrySelect}
        selectedCountry={selectedCountry}
        onClearSelection={handleClearSelection}
        onMeasurementClick={handleMeasurementOpen}
        onPOIClick={() => handleOpenPOIPanel()}
        isPOIPanelOpen={isPOIPanelOpen}
        onClosePOIPanel={handleClosePOIPanel}
      /> 
      */}

      {/* Top Bar
      <MapTopBar onCategoryClick={handleCategoryClick} />
       */}

      {/* Map Controls */}
      <MapControls />

      {/* Country Details Panel */}
      <MapDetailsPanel
        country={selectedCountry}
        onClose={handleClearSelection}
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
        onImport={handlePOIImport}
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
      />
    </div>
  );
}

export default WorldMap;
