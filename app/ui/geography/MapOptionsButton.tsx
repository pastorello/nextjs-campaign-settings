"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

interface MapOptionsButtonProps {
  /** Whether the place currently being viewed already has a map. */
  hasMap: boolean;
  /** The root has no "delete this map" option — rule 1, SPEC-010. */
  isRoot: boolean;
  onReplaceMap: () => void;
  onDeleteMap: () => void;
}

/**
 * The map's own "administer this map" entry point (usability fix,
 * 2026-08-17): replaces two separate, always-visible floating corner
 * controls (`MapUploadControl`, `DeletePlaceButton`) with a single icon
 * trigger, sitting in `MapControls`' own zoom/reset/fullscreen stack via
 * its `extraControls` slot, that opens a small menu with just those two
 * actions. Distinguished from `MapContextMenu`'s entries by scope: those
 * add *content* to the map (a marker, a place, a sub-map, an attached
 * entity); these two administer the map itself, regardless of where on it
 * you last clicked — hence a fixed control, not a right-click item.
 */
export default function MapOptionsButton({
  hasMap,
  isRoot,
  onReplaceMap,
  onDeleteMap,
}: MapOptionsButtonProps) {
  const t = useTranslations("geography.mapOptions");
  const tMapUpload = useTranslations("geography.mapUpload");
  const tDeletePlace = useTranslations("geography.deletePlace");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-label={t("trigger")}
        title={t("trigger")}
        className="flex h-9 w-9 items-center justify-center rounded bg-white dark:bg-slate-700 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600"
      >
        <Pencil className="h-5 w-5 text-gray-600 dark:text-gray-100" />
      </button>

      {isOpen && (
        <div className="absolute bottom-0 right-full mr-2 flex w-56 flex-col gap-1 rounded-lg bg-white dark:bg-gray-800 p-2 shadow-md">
          <button
            onClick={() => {
              setIsOpen(false);
              onReplaceMap();
            }}
            className="rounded px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {hasMap ? tMapUpload("replaceSubmit") : tMapUpload("uploadSubmit")}
          </button>
          {!isRoot && (
            <button
              onClick={() => {
                setIsOpen(false);
                onDeleteMap();
              }}
              className="rounded px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              {tDeletePlace("trigger")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
