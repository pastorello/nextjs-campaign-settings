"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  MapErrorBoundary,
  MapLoadingSpinner,
} from "@/app/modules/maps/components/map";
import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";
import type RootPlace from "@/app/lib/definitions/interfaces/maps/RootPlace";
import BaseButton from "@/app/ui/buttons/BaseButton";
import IconType from "@/app/ui/buttons/BaseButton/IconType";
import PageTitle from "@/app/ui/typography/PageTitle";
import WorldMap from "@/app/ui/geography/WorldMap";
import toStackEntry, {
  type PlaceStackEntry,
} from "@/app/modules/maps/lib/utils/toStackEntry";

export type { PlaceStackEntry };

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
export default function GeographyExplorer({
  root,
  unpositionedCount,
  initialStack,
}: {
  root: RootPlace;
  // Tree-wide, not scoped to the place in view (SPEC-007 T2) — how much of
  // the world is still undrawn. Rendered even at zero: its absence would be
  // ambiguous with "not computed" (SPEC-007 §5 edge cases).
  unpositionedCount: number;
  // A pre-built root-to-place chain (SPEC-011 T4), from a cross-entity
  // place search result — landing the DM directly on that place's own map
  // with the full "up" trail already in place, rather than at the root.
  // Absent (the default) preserves today's behaviour exactly: start at
  // `[root]`.
  initialStack?: PlaceStackEntry[];
}) {
  const t = useTranslations("geography");
  const [stack, setStack] = useState<PlaceStackEntry[]>(
    initialStack ?? [toStackEntry(root)]
  );
  const current = stack[stack.length - 1] ?? stack[0];

  const handleDescend = (child: NavigableChild) => {
    setStack((prev) => [...prev, toStackEntry(child)]);
  };

  const handleAscend = () => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  // The place currently being viewed was just deleted (SPEC-010 T3) — same
  // as "up," since a deleted place can no longer be viewed and its
  // reparented children now belong on the parent's map, which is what
  // popping the stack already lands the DM on (§5 step 4).
  const handleDeleted = handleAscend;

  // The place currently being viewed just got a map, or had its map
  // replaced (SPEC-007 T1) — patch the top of the stack in place rather than
  // re-fetching; `mapBounds`/`mapInitialView`/`mapInitialZoom` are untouched
  // by design (re-cropping is out of scope, SPEC-007 §3).
  const handleMapChanged = (mapImage: string) => {
    setStack((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      return [
        ...prev.slice(0, -1),
        { ...last, mapUrl: `/api/maps/${mapImage}/image` },
      ];
    });
  };

  if (!current) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 flex flex-none items-center gap-4">
        {stack.length > 1 && (
          <BaseButton icon={IconType.chevronUp} onClick={handleAscend}>
            {t("up")}
          </BaseButton>
        )}
        <PageTitle>{current.title}</PageTitle>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t("unpositionedCount", { count: unpositionedCount })}
        </span>
      </div>
      <div className="relative w-full flex-1 min-h-0">
        <MapErrorBoundary>
          <MapProvider>
            <WorldMap
              parentId={current.id}
              placeTitle={current.title}
              parentTitle={
                stack.length > 1 ? stack[stack.length - 2]!.title : ""
              }
              isRoot={stack.length === 1}
              mapUrl={current.mapUrl}
              bounds={current.bounds}
              initialView={current.initialView}
              initialZoom={current.initialZoom}
              onDescend={handleDescend}
              onMapChanged={handleMapChanged}
              onDeleted={handleDeleted}
            />
            <MapLoadingSpinner />
          </MapProvider>
        </MapErrorBoundary>
      </div>
    </div>
  );
}
