"use client";

import { useTranslations } from "next-intl";

interface DrawAreaButtonProps {
  isDrawing: boolean;
  onToggle: () => void;
}

/**
 * Arms/disarms drag-to-draw an area on the current map (SPEC-009 T2). A
 * toggle button rather than a context-menu entry — drawing a rectangle
 * needs a drag, and the existing context menu only handles a single click
 * (`MapContextMenu`'s "Add Marker"/"Add Place"). While armed, `useDrawArea`
 * owns the actual mousedown/mousemove/mouseup gesture; this button only
 * flips `isDrawing`.
 */
export default function DrawAreaButton({
  isDrawing,
  onToggle,
}: DrawAreaButtonProps) {
  const t = useTranslations("geography.drawArea");

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <button
        onClick={onToggle}
        className={`rounded-lg px-3 py-2 text-sm font-medium shadow-md transition-colors ${
          isDrawing
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        {isDrawing ? t("active") : t("trigger")}
      </button>
    </div>
  );
}
