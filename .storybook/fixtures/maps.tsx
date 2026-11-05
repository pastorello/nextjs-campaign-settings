import type { ReactNode } from "react";
import { expect, mocked, waitFor } from "storybook/test";

import fetchEntitiesAtPlace from "@/app/lib/data/maps/fetchEntitiesAtPlace";
import fetchPlaceChildren from "@/app/lib/data/maps/fetchPlaceChildren";
import fetchPlaceDeletionImpact from "@/app/lib/data/maps/fetchPlaceDeletionImpact";
import fetchUnplacedPlaces from "@/app/lib/data/maps/fetchUnplacedPlaces";
import type PlaceChild from "@/app/lib/definitions/interfaces/maps/PlaceChild";
import type RootPlace from "@/app/lib/definitions/interfaces/maps/RootPlace";

import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";
import type { POI } from "@/app/modules/maps/types/poi";
import { LeafletMap } from "@/app/modules/maps/components/map/LeafletMap";
import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import type { MapCorners } from "@/app/modules/maps/lib/utils/percentPosition";
import { computeImageBounds } from "@/app/modules/maps/lib/utils/placeMapView";

/**
 * The map's fixtures (ADR-0021). No story reaches a network: the pixel map is
 * a small PNG drawn for this repo, in `.storybook/public/api/maps/`, which
 * Storybook serves where the app's authenticated image route would be
 * (`/api/maps/<id>/image`).
 */
export const worldMapUrl = "/api/maps/story-world/image";

/** The PNG's natural size — the frame `useMapImageOverlay` derives from it. */
export const worldMapSize = { width: 800, height: 600 } as const;

/** The corners Leaflet frames that image with (`[[0,0],[height,width]]`). */
export const worldMapBounds = computeImageBounds(
  worldMapSize.width,
  worldMapSize.height
);

/** The same frame as `MapCorners`, which the place form's position fields take. */
export const worldMapCorners: MapCorners = [
  [0, 0],
  [worldMapSize.height, worldMapSize.width],
];

/**
 * A Leaflet map to hang a map-aware component on: the real `MapProvider` and
 * `LeafletMap` in a box with a height, as `WorldMap` mounts them. Leaflet's
 * CSS arrives through `global.css`, as in the app.
 */
export function MapStage({ children }: { children?: ReactNode }) {
  return (
    <MapProvider>
      <div className="relative h-96 w-full">
        <LeafletMap
          center={[worldMapSize.height / 2, worldMapSize.width / 2]}
          zoom={0}
          minZoom={-3}
          maxZoom={3}
        >
          {children}
        </LeafletMap>
      </div>
    </MapProvider>
  );
}

/**
 * Waits until Leaflet has built the map and registered it with the context:
 * `LeafletMap` imports Leaflet dynamically, so the container exists a beat
 * before the map does.
 */
export async function waitForMap(canvasElement: HTMLElement) {
  await waitFor(() =>
    expect(
      canvasElement.querySelector(".leaflet-container .leaflet-pane")
    ).not.toBeNull()
  );
}

/** A region on the world map, with an area and a map of its own. */
export const marcaDiBrina: NavigableChild = {
  id: 3,
  title: "Marca di Brina",
  description: "<p>Una costa battuta dal vento, tra scogli e fari spenti.</p>",
  lat: 330,
  lng: 280,
  mapImage: "story-region",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  footprint: {
    ring: [
      [250, 200],
      [250, 360],
      [410, 360],
      [410, 200],
    ],
  },
  gridColumns: null,
  gridScale: null,
  imageId: null,
};

/** A place that is a point, with no map of its own yet. */
export const torreSpezzata: NavigableChild = {
  ...marcaDiBrina,
  id: 4,
  title: "Torre Spezzata",
  description: null,
  lat: 180,
  lng: 560,
  mapImage: null,
  footprint: null,
};

/** A landmark on the region's map. */
export const locandaDelCorvo: POI = {
  id: "poi-5",
  title: "Locanda del Corvo",
  description: "Una locanda dove si vende birra scura e si parla poco.",
  lat: 300,
  lng: 300,
  category: "food-drink",
  createdAt: 0,
  updatedAt: 0,
};

/** The world's root place: its map is the pixel map above. */
export const aerivel: RootPlace = {
  id: 1,
  title: "Aerivel",
  mapImage: "story-world",
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  gridColumns: null,
  gridScale: null,
};

const row: PlaceChild = {
  id: 0,
  title: "",
  description: null,
  kind: "region",
  lat: null,
  lng: null,
  category: null,
  mapImage: null,
  mapBounds: null,
  mapInitialView: null,
  mapInitialZoom: null,
  footprint: null,
  gridColumns: null,
  gridScale: null,
  imageId: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

/** What `fetchPlaceChildren` answers for the root: an area, a city, a landmark. */
export const aerivelChildren: PlaceChild[] = [
  {
    ...row,
    id: 3,
    title: "Marca di Brina",
    description: marcaDiBrina.description,
    lat: marcaDiBrina.lat,
    lng: marcaDiBrina.lng,
    mapImage: "story-world",
    footprint: marcaDiBrina.footprint,
  },
  {
    ...row,
    id: 4,
    title: "Porto Cenere",
    kind: "city",
    lat: 180,
    lng: 560,
  },
  {
    ...row,
    id: 5,
    title: "Locanda del Corvo",
    kind: "poi",
    category: "food-drink",
    lat: 300,
    lng: 480,
  },
];

/**
 * Answers every read the map's hooks make (`useNavigableChildren`,
 * `usePOIManager`, `useUnplacedPlaces`, the popover's entity list) from the
 * fixtures above. Call it from `beforeEach`: Storybook resets each spy
 * before the next story.
 */
export function mockWorld(children: PlaceChild[] = aerivelChildren) {
  mocked(fetchPlaceChildren).mockResolvedValue(children);
  mocked(fetchUnplacedPlaces).mockResolvedValue([
    {
      id: 8,
      title: "Faro Dimenticato",
      kind: "city",
      parentId: 1,
      parentTitle: "Aerivel",
    },
  ]);
  mocked(fetchEntitiesAtPlace).mockResolvedValue([]);
  mocked(fetchPlaceDeletionImpact).mockResolvedValue({
    placeCount: 0,
    npcCount: 0,
    deityCount: 0,
  });
}
