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
 * The entity kinds a location can be assigned to (SPEC-008). Originally
 * TD-14/SPEC-002's polymorphic `linkedType`/`linkedId` pair on `poi` itself
 * — a landmark optionally linking to an entity — which SPEC-008 T8 removed
 * along with the columns (superseded by `npc`/`deities`' own
 * `zoneId`/`poiId`, the entity pointing at its location rather than the
 * other way around). The type lives on, repurposed for choosing *which*
 * entity to attach — `fetchLinkableEntities`, `AttachEntityButton`.
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
 * `constants/place-kinds.ts` — and live in the `zone` table. `poi` is a
 * categorized landmark leaf, its own table since SPEC-008 T8; `kind: "poi"`
 * here is a client-side UI discriminator only (which form fields to show,
 * which action to call), not a stored column the way it once was.
 * `deity`/`npc` variants existed here until T8 — the map no longer creates
 * an entity pin at all (T5), so no stored row can carry either kind anymore.
 */
export type PlaceKind = "region" | "plane" | "city" | "dungeon" | "poi";

export interface POI {
  id: string;
  title: string;
  description?: string | undefined;
  lat: number;
  lng: number;
  category: POICategory;
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
