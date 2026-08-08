"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLeafletMap } from "./useLeafletMap";
import type {
  POI,
  POIGeoJSON,
  POICategory,
} from "@/app/modules/maps/types/poi";
import {
  getCategoryMarkerBgClass,
  isPOICategory,
} from "@/app/modules/maps/constants/poi-categories";
import { notifyError } from "@/app/lib/notifications/notify";
import fetchPlaceChildren from "@/app/lib/data/maps/fetchPlaceChildren";
import createPoi from "@/app/lib/data/maps/createPoi";
import updatePoiAction from "@/app/lib/data/maps/updatePoi";
import deletePoiAction from "@/app/lib/data/maps/deletePoi";
import type PlaceChild from "@/app/lib/definitions/interfaces/maps/PlaceChild";
import type { Marker } from "leaflet";

/**
 * Maps a persisted, positioned `kind: "poi"` child to the client shape: a
 * stable client key, and epoch milliseconds instead of `Date` (which is
 * what the panel and the GeoJSON export have always worked in). Takes the
 * narrowed shape `loadPOIs` already filtered `fetchPlaceChildren`'s rows
 * down to — `lat`/`lng`/`category` are nullable on a `PlaceChild` in
 * general (a navigable `zone` child has none of them), but never for one
 * this hook decided is a POI.
 */
function toClientPOI(
  row: PlaceChild & { lat: number; lng: number; category: string },
  clientId: string,
  category: POICategory
): POI {
  return {
    id: clientId,
    title: row.title,
    description: row.description ?? undefined,
    lat: row.lat,
    lng: row.lng,
    category,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

/**
 * Hook for managing POIs (Points of Interest)
 *
 * Features:
 * - CRUD operations for POIs, persisted in Postgres via Server Actions
 * - Optimistic updates: the map reacts immediately, the write follows
 * - GeoJSON import/export
 * - Map marker rendering with category colors
 * - Proper cleanup on unmount
 *
 * ## Persistence (TD-14 / SPEC-002)
 *
 * POIs used to live in `localStorage`. They are rows in Postgres now, global
 * to the instance rather than to a browser. Three details of that move are
 * load-bearing and easy to undo by accident:
 *
 * 1. **`POI.id` is a client key, not the database id.** It is generated here,
 *    once, and never reassigned — including when the row's real id comes back
 *    from `createPoi`. That id lives in `serverIdsRef`, keyed by the client
 *    id. Reassigning `POI.id` mid-flight was the obvious design, and it is
 *    the bug SPEC-002 §9 predicted: `markersRef` is keyed by that id, so a
 *    marker created under the temporary key is orphaned the moment the key
 *    changes — visible on the map, absent from the map used to remove it.
 *    A stable key removes the problem rather than managing it.
 *
 * 2. **Operations on one POI are serialised through `operationsRef`.** Adding
 *    a POI and deleting it before its create has landed is reachable by hand
 *    (add, then delete from the list), and the delete needs a server id that
 *    does not exist yet. Chaining each POI's work onto its own predecessor
 *    means the delete simply runs after the create, reads the id it
 *    deposited, and succeeds. No polling, no "please wait" state.
 *
 * 3. **`renderMarkers` is guarded by a generation counter.** It is async — it
 *    `await`s `import("leaflet")` per marker — and it clears every marker
 *    before rebuilding. Two overlapping runs would therefore interleave: the
 *    second clears `markersRef`, then the first finishes its loop and writes
 *    stale markers into it, leaving markers on the map that nothing tracks.
 *    Server round-trips make overlapping runs far likelier than
 *    `localStorage` ever did.
 *
 * @returns Object with POI management functions and state
 */
export function usePOIManager(parentId: number) {
  const map = useLeafletMap();
  const t = useTranslations("geography.errors");
  const [pois, setPOIs] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const markersRef = useRef<Map<string, Marker>>(new Map());

  // The current POI list, readable synchronously. Every mutation writes here
  // and to React state together (see `commit`), so a handler can compute the
  // next list — and capture the previous one for rollback — without reading
  // stale state or doing work inside a state updater.
  const poisRef = useRef<POI[]>([]);

  // Client id -> database id. Populated when a create resolves, and read by
  // whatever update or delete was queued behind it.
  const serverIdsRef = useRef<Map<string, number>>(new Map());

  // Client id -> the tail of that POI's operation chain. See note 2 above.
  const operationsRef = useRef<Map<string, Promise<void>>>(new Map());

  const renderGenerationRef = useRef(0);

  // Every `t(...)` call in this hook happens inside an async handler that
  // runs after the render that queued it, so the *latest* translator is the
  // right one to use — and reading it through a ref keeps `t` out of the
  // dependency arrays below. That matters: `useTranslations` is only
  // referentially stable because next-intl memoises it internally, and a
  // `t` in the mount effect's dependency chain turns any lapse in that
  // memoisation into an infinite load → render → load loop. Depending on
  // another library's memoisation for termination is not a bet worth taking.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  /**
   * Applies a change to the POI list, keeping the ref and React state in
   * lockstep so the next synchronous caller sees it.
   */
  const commit = useCallback((updater: (current: POI[]) => POI[]) => {
    const next = updater(poisRef.current);
    poisRef.current = next;
    setPOIs(next);
  }, []);

  /**
   * Queues work for one POI behind anything already queued for it.
   */
  const enqueue = useCallback((clientId: string, task: () => Promise<void>) => {
    const previous = operationsRef.current.get(clientId) ?? Promise.resolve();
    const next = previous.then(task).catch((error: unknown) => {
      // Each task handles its own failure; this is the net that keeps one
      // rejection from breaking the chain for every later operation.
      console.error("POI operation failed:", error);
    });
    operationsRef.current.set(clientId, next);
  }, []);

  /**
   * Load this place's `kind: "poi"` children from the server (SPEC-004 M7).
   * `fetchPlaceChildren` can also return navigable `zone` siblings, but
   * those have no category and are rendered elsewhere (`useNavigableChildren`),
   * not managed here.
   */
  const loadPOIs = useCallback(async () => {
    try {
      const rows = await fetchPlaceChildren(parentId);

      const poiRows = rows.filter(
        (
          row
        ): row is typeof row & {
          lat: number;
          lng: number;
          category: string;
        } =>
          row.kind === "poi" &&
          row.lat !== null &&
          row.lng !== null &&
          row.category !== null
      );

      const loaded: POI[] = [];
      const serverIds = new Map<string, number>();

      for (const row of poiRows) {
        // The category column has no database-level enum, so a row can name
        // a category this build no longer knows. Discard it with a warning
        // rather than widening the type — the same call TD-02b made for a
        // hand-edited `localStorage` entry.
        if (!isPOICategory(row.category)) {
          console.warn("Discarding POI with an unknown category:", row.id);
          continue;
        }

        const clientId = String(row.id);
        serverIds.set(clientId, row.id);
        loaded.push(toClientPOI(row, clientId, row.category));
      }

      serverIdsRef.current = serverIds;
      commit(() => loaded);
    } catch (error) {
      console.error("Failed to load POIs:", error);
      notifyError(tRef.current("poiLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [commit, parentId]);

  /**
   * Generate unique POI ID
   */
  const generateId = useCallback(() => {
    return `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Update existing POI. Declared ahead of `createMarker`/`renderMarkers`
   * (its original position, further down, is where `addPOI` also lives) —
   * `renderMarkers` calls this from a marker's `dragend` handler (TD-71,
   * SPEC-005 §5.B), and a `const` referenced before its own declaration in
   * the same function body is a TS/TDZ error even inside a closure that
   * only runs later.
   */
  const updatePOI = useCallback(
    (id: string, updates: Partial<Omit<POI, "id" | "createdAt">>) => {
      const previous = poisRef.current.find((poi) => poi.id === id);
      if (!previous) return;

      commit((current) =>
        current.map((poi) =>
          poi.id === id ? { ...poi, ...updates, updatedAt: Date.now() } : poi
        )
      );

      enqueue(id, async () => {
        const serverId = serverIdsRef.current.get(id);
        // No server id means the create failed and this POI was already rolled
        // back out of the list. Nothing to update.
        if (serverId === undefined) return;

        const restore = () => {
          commit((current) =>
            current.map((poi) => (poi.id === id ? previous : poi))
          );
          notifyError(tRef.current("poiSaveFailed", { title: previous.title }));
        };

        try {
          const result = await updatePoiAction({
            id: serverId,
            ...(updates.title !== undefined && { title: updates.title }),
            ...(updates.description !== undefined && {
              description: updates.description,
            }),
            ...(updates.lat !== undefined && { lat: updates.lat }),
            ...(updates.lng !== undefined && { lng: updates.lng }),
            ...(updates.category !== undefined && {
              category: updates.category,
            }),
          });

          if (!result.ok) restore();
        } catch (error) {
          console.error("Failed to update POI:", error);
          restore();
        }
      });
    },
    [commit, enqueue]
  );

  /**
   * Create marker for POI
   */
  const createMarker = useCallback(
    async (poi: POI) => {
      if (!map) return null;

      try {
        const L = await import("leaflet");
        const markerBgClass = getCategoryMarkerBgClass(poi.category);

        const marker = L.marker([poi.lat, poi.lng], {
          // TD-71, SPEC-005 §5.B — a placed marker can be dragged to a new
          // spot; `renderMarkers` wires the `dragend` handler once this
          // returns, since `updatePOI` isn't in scope here.
          draggable: true,
          icon: L.divIcon({
            className: "custom-poi-marker",
            html: `
          <div class="w-8 h-8 flex items-center justify-center -rotate-45 shadow-[0_3px_8px_rgba(0,0,0,0.3)] border-3 border-white rounded-[50%_50%_50%_0] ${markerBgClass}">
            <div class="rotate-45 text-sm">📍</div>
          </div>
        `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          }),
        }).addTo(map);

        // Add popup
        const popupContent = `
      <div class="min-w-[150px]">
        <div class="font-semibold mb-1">${poi.title}</div>
        ${
          poi.description
            ? `<div class="text-xs text-gray-600 mb-1">${poi.description}</div>`
            : ""
        }
        <div class="text-[11px] text-gray-400">${poi.lat.toFixed(
          6
        )}, ${poi.lng.toFixed(6)}</div>
      </div>
    `;
        marker.bindPopup(popupContent);

        return marker;
      } catch (error) {
        console.error("Failed to create POI marker:", error);
        return null;
      }
    },
    [map]
  );

  /**
   * Render all POI markers on map
   */
  const renderMarkers = useCallback(async () => {
    if (!map) return;

    // See note 3 in the hook's doc comment: this run's ticket. Any later run
    // increments the counter, which tells this one to stop and clean up
    // instead of writing stale markers into a map another run now owns.
    renderGenerationRef.current += 1;
    const generation = renderGenerationRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    markersRef.current.clear();

    // Create new markers
    for (const poi of pois) {
      const marker = await createMarker(poi);

      if (generation !== renderGenerationRef.current) {
        // Superseded mid-flight. This marker is already on the map but no
        // longer belongs to anyone, so remove it here — leaving it is exactly
        // the orphan this guard exists to prevent.
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
        return;
      }

      if (marker) {
        // TD-71, SPEC-005 §5.B — reposition on drop. `updatePOI` already
        // does the optimistic-update/revert/toast dance; this only has to
        // read the marker's new position and hand it off.
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          updatePOI(poi.id, { lat, lng });
        });
        markersRef.current.set(poi.id, marker);
      }
    }
  }, [map, pois, createMarker, updatePOI]);

  /**
   * Add new POI
   *
   * Returns the optimistic POI synchronously — the marker is on the map
   * before the write starts. If the write fails the POI is removed again and
   * the user is told.
   */
  const addPOI = useCallback(
    (
      title: string,
      lat: number,
      lng: number,
      category: POICategory,
      description?: string
    ): POI => {
      const now = Date.now();
      const newPOI: POI = {
        id: generateId(),
        title,
        description,
        lat,
        lng,
        category,
        createdAt: now,
        updatedAt: now,
      };

      commit((current) => [...current, newPOI]);

      enqueue(newPOI.id, async () => {
        try {
          const result = await createPoi({
            title,
            lat,
            lng,
            category,
            zoneId: parentId,
            ...(description !== undefined && { description }),
          });

          if (!result.ok) {
            commit((current) => current.filter((poi) => poi.id !== newPOI.id));
            notifyError(tRef.current("poiSaveFailed", { title }));
            return;
          }

          serverIdsRef.current.set(newPOI.id, result.id);
        } catch (error) {
          console.error("Failed to create POI:", error);
          commit((current) => current.filter((poi) => poi.id !== newPOI.id));
          notifyError(tRef.current("poiSaveFailed", { title }));
        }
      });

      return newPOI;
    },
    [commit, enqueue, generateId, parentId]
  );

  /**
   * Delete POI
   */
  const deletePOI = useCallback(
    (id: string) => {
      const index = poisRef.current.findIndex((poi) => poi.id === id);
      if (index === -1) return;

      const removed = poisRef.current[index];
      if (!removed) return;

      commit((current) => current.filter((poi) => poi.id !== id));

      // Remove marker
      const marker = markersRef.current.get(id);
      if (marker && map?.hasLayer(marker)) {
        map.removeLayer(marker);
      }
      markersRef.current.delete(id);

      enqueue(id, async () => {
        const serverId = serverIdsRef.current.get(id);
        // Never persisted — either the create failed, or this POI only ever
        // existed optimistically. Either way there is no row to delete.
        if (serverId === undefined) return;

        try {
          await deletePoiAction(serverId);
          serverIdsRef.current.delete(id);
        } catch (error) {
          console.error("Failed to delete POI:", error);
          // Put it back where it was, rather than at the end.
          commit((current) => {
            const restored = [...current];
            restored.splice(Math.min(index, restored.length), 0, removed);
            return restored;
          });
          notifyError(
            tRef.current("poiDeleteFailed", { title: removed.title })
          );
        }
      });
    },
    [commit, enqueue, map]
  );

  /**
   * Clear all POIs
   */
  const clearAllPOIs = useCallback(() => {
    const cleared = poisRef.current;

    commit(() => []);

    // Clear all markers
    markersRef.current.forEach((marker) => {
      if (map?.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    markersRef.current.clear();

    for (const poi of cleared) {
      enqueue(poi.id, async () => {
        const serverId = serverIdsRef.current.get(poi.id);
        if (serverId === undefined) return;

        try {
          await deletePoiAction(serverId);
          serverIdsRef.current.delete(poi.id);
        } catch (error) {
          console.error("Failed to delete POI:", error);
          commit((current) => [...current, poi]);
          notifyError(tRef.current("poiDeleteFailed", { title: poi.title }));
        }
      });
    }
  }, [commit, enqueue, map]);

  /**
   * Get POIs by category
   */
  const getPOIsByCategory = useCallback(
    (category: POICategory): POI[] => {
      return pois.filter((poi) => poi.category === category);
    },
    [pois]
  );

  /**
   * Export POIs as GeoJSON
   */
  const exportGeoJSON = useCallback((): POIGeoJSON => {
    return {
      type: "FeatureCollection",
      features: pois.map((poi) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [poi.lng, poi.lat],
        },
        properties: {
          id: poi.id,
          title: poi.title,
          description: poi.description,
          category: poi.category,
          createdAt: poi.createdAt,
          updatedAt: poi.updatedAt,
        },
      })),
    };
  }, [pois]);

  /**
   * Import POIs from GeoJSON
   *
   * Each imported POI is created on the server independently, so one bad
   * entry cannot lose the rest of the file.
   */
  const importGeoJSON = useCallback(
    (geojson: POIGeoJSON) => {
      try {
        const importedPOIs: POI[] = geojson.features.map((feature) => ({
          // A fresh client id, never the file's: an imported id is a foreign
          // string that could collide with a POI already on the map.
          id: generateId(),
          title: feature.properties.title,
          description: feature.properties.description,
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          category: feature.properties.category,
          createdAt: feature.properties.createdAt || Date.now(),
          updatedAt: feature.properties.updatedAt || Date.now(),
        }));

        commit((current) => [...current, ...importedPOIs]);

        for (const poi of importedPOIs) {
          enqueue(poi.id, async () => {
            try {
              const result = await createPoi({
                title: poi.title,
                lat: poi.lat,
                lng: poi.lng,
                category: poi.category,
                zoneId: parentId,
                ...(poi.description !== undefined && {
                  description: poi.description,
                }),
              });

              if (!result.ok) {
                commit((current) => current.filter((p) => p.id !== poi.id));
                notifyError(
                  tRef.current("poiSaveFailed", { title: poi.title })
                );
                return;
              }

              serverIdsRef.current.set(poi.id, result.id);
            } catch (error) {
              console.error("Failed to create imported POI:", error);
              commit((current) => current.filter((p) => p.id !== poi.id));
              notifyError(tRef.current("poiSaveFailed", { title: poi.title }));
            }
          });
        }

        return importedPOIs.length;
      } catch (error) {
        console.error("Failed to import GeoJSON:", error);
        throw new Error("Invalid GeoJSON format");
      }
    },
    [commit, enqueue, generateId, parentId]
  );

  /**
   * Fly to POI location
   */
  const flyToPOI = useCallback(
    (poi: POI) => {
      if (!map) return;
      map.flyTo([poi.lat, poi.lng], 16, {
        duration: 1.5,
      });

      // Open popup if marker exists
      const marker = markersRef.current.get(poi.id);
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 1500);
      }
    },
    [map]
  );

  // Load POIs on mount
  useEffect(() => {
    void loadPOIs();
  }, [loadPOIs]);

  // Render markers when POIs or map changes
  useEffect(() => {
    if (!isLoading) {
      void renderMarkers();
    }
  }, [pois, map, isLoading, renderMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach((marker) => {
        if (map?.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      markers.clear();
    };
  }, [map]);

  return {
    pois,
    isLoading,
    addPOI,
    updatePOI,
    deletePOI,
    clearAllPOIs,
    getPOIsByCategory,
    exportGeoJSON,
    importGeoJSON,
    flyToPOI,
    poiCount: pois.length,
    // Re-runs the same load `loadPOIs` does on mount (TD-71, SPEC-005 §5.A)
    // — positioning a previously-unplaced `kind: "poi"` child happens
    // through a direct `updatePoi` call outside this hook's own optimistic
    // path (it isn't in `pois` yet, so `updatePOI` has nothing to find), so
    // the caller reloads explicitly once that write lands.
    reloadPOIs: loadPOIs,
  };
}
