"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  MapErrorBoundary,
  MapLoadingSpinner,
} from "@/app/modules/maps/components/map";
import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import {
  parsePlaceMapBounds,
  parsePlaceMapInitialView,
  parsePlaceMapInitialZoom,
} from "@/app/modules/maps/lib/utils/placeMapView";
import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";
import type RootPlace from "@/app/lib/definitions/interfaces/maps/RootPlace";
import BaseButton from "@/app/ui/buttons/BaseButton";
import IconType from "@/app/ui/buttons/BaseButton/IconType";
import PageTitle from "@/app/ui/typography/PageTitle";
import WorldMap from "@/app/ui/geography/WorldMap";

interface PlaceStackEntry {
  id: number;
  title: string;
  mapUrl: string;
  bounds: L.LatLngBoundsExpression;
  initialView: L.LatLngExpression;
  initialZoom: number;
}

function toStackEntry(place: {
  id: number;
  title: string;
  mapImage: string;
  mapBounds: unknown;
  mapInitialView: unknown;
  mapInitialZoom: number | null;
}): PlaceStackEntry {
  return {
    id: place.id,
    title: place.title,
    mapUrl: `/api/maps/${place.mapImage}/image`,
    bounds: parsePlaceMapBounds(place.mapBounds),
    initialView: parsePlaceMapInitialView(place.mapInitialView),
    initialZoom: parsePlaceMapInitialZoom(place.mapInitialZoom),
  };
}

/**
 * The tree-navigation view backing `/dashboard/geography` (SPEC-004 §10 M7),
 * replacing the hardcoded four-map switcher. Owns the "which place is
 * currently being viewed" stack that M4's create-world flow and M5's panel
 * work (once it ships) both need `parentId` for — the "up" button pops it,
 * clicking a navigable pin (via `WorldMap`/`useNavigableChildren`) pushes.
 *
 * A stack, not a fetched ancestor chain: full breadcrumbs are explicitly not
 * MVP (SPEC-004 §10 M7), so "how did I get here" only needs to be undone one
 * step at a time, which the DM's own navigation already remembers.
 */
export default function GeographyExplorer({ root }: { root: RootPlace }) {
  const t = useTranslations("geography");
  const [stack, setStack] = useState<PlaceStackEntry[]>([toStackEntry(root)]);
  const current = stack[stack.length - 1] ?? stack[0];

  const handleDescend = (child: NavigableChild) => {
    setStack((prev) => [...prev, toStackEntry(child)]);
  };

  const handleAscend = () => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  if (!current) return null;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {stack.length > 1 && (
          <BaseButton icon={IconType.chevronUp} onClick={handleAscend}>
            {t("up")}
          </BaseButton>
        )}
        <PageTitle>{current.title}</PageTitle>
      </div>
      <div className="relative w-full h-screen">
        <MapErrorBoundary>
          <MapProvider>
            <WorldMap
              parentId={current.id}
              mapUrl={current.mapUrl}
              bounds={current.bounds}
              initialView={current.initialView}
              initialZoom={current.initialZoom}
              onDescend={handleDescend}
            />
            <MapLoadingSpinner />
          </MapProvider>
        </MapErrorBoundary>
      </div>
    </div>
  );
}
