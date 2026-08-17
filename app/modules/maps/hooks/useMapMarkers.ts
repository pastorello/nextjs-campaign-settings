"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useLeafletMap } from "./useLeafletMap";
import type { Marker } from "leaflet";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string | undefined;
}

/**
 * Hook for managing user-added markers on the map
 *
 * Features:
 * - Add/remove markers programmatically
 * - Proper cleanup on unmount
 * - Unique ID generation for each marker
 * - Optional popup labels
 *
 * @returns Object with marker management functions and state
 */
export function useMapMarkers() {
  const map = useLeafletMap();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const leafletMarkersRef = useRef<Map<string, Marker>>(new Map());

  /**
   * Generate unique marker ID
   */
  const generateId = useCallback(() => {
    return `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Add a marker at the specified location
   */
  const addMarker = useCallback(
    async (lat: number, lng: number, label?: string) => {
      if (!map) return null;

      const id = generateId();

      try {
        const L = await import("leaflet");

        // Create Leaflet marker
        const leafletMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: "custom-user-marker",
            html: `
          <div class="w-6 h-6 bg-red-500 border-3 border-white rounded-[50%_50%_50%_0] -rotate-45 shadow-[0_2px_6px_rgba(0,0,0,0.3)] relative">
            <div class="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 translate-[-50%_-50%]"></div>
          </div>
        `,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24],
          }),
        }).addTo(map);

        // Add popup with coordinates if no label provided
        const popupContent = label || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        leafletMarker.bindPopup(popupContent);

        // Store reference
        leafletMarkersRef.current.set(id, leafletMarker);

        // Update state
        const newMarker: MapMarker = { id, lat, lng, label };
        setMarkers((prev) => [...prev, newMarker]);

        return id;
      } catch (error) {
        console.error("Failed to add marker:", error);
        return null;
      }
    },
    [map, generateId]
  );

  /**
   * Remove a marker by ID
   */
  const removeMarker = useCallback(
    (id: string) => {
      const leafletMarker = leafletMarkersRef.current.get(id);

      if (leafletMarker && map?.hasLayer(leafletMarker)) {
        map.removeLayer(leafletMarker);
      }

      leafletMarkersRef.current.delete(id);
      setMarkers((prev) => prev.filter((m) => m.id !== id));
    },
    [map]
  );

  /**
   * Remove all markers
   */
  const clearMarkers = useCallback(() => {
    leafletMarkersRef.current.forEach((leafletMarker) => {
      if (map?.hasLayer(leafletMarker)) {
        map.removeLayer(leafletMarker);
      }
    });

    leafletMarkersRef.current.clear();
    setMarkers([]);
  }, [map]);

  /**
   * Get marker by ID
   */
  const getMarker = useCallback(
    (id: string): MapMarker | undefined => {
      return markers.find((m) => m.id === id);
    },
    [markers]
  );

  // Cleanup on unmount
  useEffect(() => {
    // Copy ref value to local variable for cleanup
    const markersMap = leafletMarkersRef.current;

    return () => {
      markersMap.forEach((leafletMarker) => {
        if (map?.hasLayer(leafletMarker)) {
          map.removeLayer(leafletMarker);
        }
      });
      markersMap.clear();
    };
  }, [map]);

  return {
    markers,
    addMarker,
    removeMarker,
    clearMarkers,
    getMarker,
    markerCount: markers.length,
  };
}
