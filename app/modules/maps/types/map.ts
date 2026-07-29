/**
 * Map-related TypeScript type definitions
 */

import type { Map as LeafletMap } from "leaflet";

/**
 * Map configuration options
 */
export interface MapConfig {
  defaultCenter: [number, number];
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomControl: boolean;
  attributionControl: boolean;
}

/**
 * Tile provider configuration
 */
export interface TileProvider {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  category: "standard" | "satellite" | "dark" | "custom";
}

/**
 * Map context value type
 */
export interface MapContextValue {
  map: LeafletMap | null;
  setMap: (map: LeafletMap | null) => void;
  isReady: boolean;
  error: Error | null;
  isInitializing: boolean;
  setMapError: (error: Error | null) => void;
  startInitializing: () => void;
}

/**
 * Coordinate tuple type
 */
export type Coordinate = [number, number];

/**
 * Bounds type
 */
export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * The subset of a world.geojson feature's `properties` this app actually
 * reads. `GeoJSON.GeoJsonProperties` is `{ [name: string]: any } | null` by
 * design — geometry, not this app's data — so every read through it was
 * `any` until now.
 */
export interface CountryProperties {
  NAME?: string;
  NAME_LONG?: string;
  ISO_A2?: string;
  ISO_A3?: string;
}
