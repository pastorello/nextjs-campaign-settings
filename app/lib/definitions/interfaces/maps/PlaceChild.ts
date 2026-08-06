import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

/**
 * A place pinned directly under some parent (SPEC-004 §10 M6) — the tree-
 * aware counterpart to `Poi.ts`, which only ever describes a fully
 * positioned, categorized `kind: "poi"` row. A child can be any kind, so
 * `lat`/`lng`/`category` are nullable here where `Poi`'s are not, and
 * `kind`/`mapImage` are exposed so a caller can tell a navigable `region`
 * (has a map) from a leaf without a second query.
 */
interface PlaceChild {
  id: number;
  title: string;
  description: string | null;
  kind: string;
  lat: number | null;
  lng: number | null;
  category: string | null;
  linkedType: LinkableEntityType | null;
  linkedId: number | null;
  mapImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default PlaceChild;
