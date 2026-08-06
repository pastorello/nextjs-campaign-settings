/**
 * POI (Point of Interest) type definitions
 */

export type POICategory =
  | "food-drink"
  | "shopping"
  | "transport"
  | "lodging"
  | "health"
  | "entertainment"
  | "nature"
  | "services"
  | "education"
  | "religion"
  | "business"
  | "tourism"
  | "emergency"
  | "utilities";

export interface POICategoryConfig {
  id: POICategory;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
}

/**
 * Entity kinds a POI can link to (TD-14 / SPEC-002). `linkedType` +
 * `linkedId` together identify one row in one table — a polymorphic pair,
 * not a foreign key — so new kinds slot in here without a schema change.
 */
export type LinkableEntityType = "npc" | "deity";

export interface LinkableEntityTypeConfig {
  id: LinkableEntityType;
  label: string;
  // Base list-page path; the entity is reached via that page's existing
  // `?id=` exact-match filter (`getQuery.ts`), not a dedicated detail route
  // — there isn't one for NPCs or deities today.
  path: string;
}

/**
 * The world tree's place kinds (SPEC-004 §5.1) — the MVP's closed set.
 * `region` is the only navigable kind and carries its own map; `deity` and
 * `npc` each link to exactly one record; `poi` is a categorized leaf marker
 * like the 14 existing categories. The richer vocabulary (plane, city,
 * dungeon, …) is SPEC-004 T2, not built yet.
 */
export type PlaceKind = "region" | "deity" | "npc" | "poi";

export interface POI {
  id: string;
  title: string;
  description?: string | undefined;
  lat: number;
  lng: number;
  category: POICategory;
  // `null` clears an existing link on update; `undefined` (the default)
  // leaves it alone. See `poiSchema.ts`'s `hasPairedLink`.
  linkedType?: LinkableEntityType | null;
  linkedId?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface POIGeoJSON {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
    properties: {
      id: string;
      title: string;
      description?: string | undefined;
      category: POICategory;
      createdAt: number;
      updatedAt: number;
    };
  }>;
}
