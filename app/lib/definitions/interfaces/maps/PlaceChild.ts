/**
 * A place directly under some parent — either a navigable `zone` row
 * (`region`/`plane`/`city`/`dungeon`) or a landmark `poi` row, merged into
 * one shape (SPEC-004 §10 M6, reshaped by SPEC-008 T8 once the two lived in
 * separate tables). `lat`/`lng`/`category`/`mapImage` are nullable because
 * only one variant ever carries each: a landmark always has `lat`/`lng`/
 * `category` and never a map; a zone may have neither `lat`/`lng` yet
 * (unplaced) and only a navigable zone has a map. `kind` is `"poi"` for a
 * landmark row, the zone's own `kind` otherwise — the same discriminator
 * `PlaceKind` already uses elsewhere.
 */
interface PlaceChild {
  id: number;
  title: string;
  description: string | null;
  kind: string;
  lat: number | null;
  lng: number | null;
  category: string | null;
  mapImage: string | null;
  // How to frame this place's own map, if it has one (SPEC-004 M7). Raw
  // `unknown`/`Json` — nothing has ever written them yet (no UI sets them),
  // so a reader parses and falls back to a default rather than trusting the
  // shape. See `placeMapView.ts`.
  mapBounds: unknown;
  mapInitialView: unknown;
  mapInitialZoom: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export default PlaceChild;
