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
}

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
