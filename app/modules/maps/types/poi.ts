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
  /** Message key resolved with `t()` at the render boundary — see ADR-0007. */
  labelKey: string;
  color: string;
  bgColor: string;
  /** Tailwind `bg-*` class matching `color` exactly — for the Leaflet marker's raw HTML string, which the content scanner can't pick up from `color`'s hex value (CLAUDE.md rule #8). */
  markerBgClass: string;
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
 * The world tree's place kinds (SPEC-004 §5.1, richer vocabulary added by
 * T2). `region`, `plane`, `city` and `dungeon` are the navigable kinds —
 * each carries its own map, per `NAVIGABLE_PLACE_KINDS` in
 * `constants/place-kinds.ts`; `deity` and `npc` each link to exactly one
 * record; `poi` is a categorized leaf marker like the 14 existing
 * categories.
 */
export type PlaceKind =
  "region" | "plane" | "city" | "dungeon" | "deity" | "npc" | "poi";

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
