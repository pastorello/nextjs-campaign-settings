"use client";

import { Grid3x3 } from "lucide-react";
import { useTranslations } from "next-intl";

interface MapGridToggleProps {
  /**
   * Whether the place being viewed has a stored grid (SPEC-015 §6, both
   * columns set). Without one the toggle is inert: it never draws a guessed
   * grid, it opens the configuration panel instead (§5's edge-case table).
   */
  isConfigured: boolean;
  isVisible: boolean;
  onToggle: () => void;
  /** Opens `MapGridConfigPanel` — the same panel `MapOptionsButton` offers. */
  onConfigure: () => void;
}

/**
 * The grid toggle beside zoom in/out (SPEC-015 §5 step 5) — a domain
 * control (it knows whether a grid is configured), so it lives here and
 * sits in `MapControls`' generic `belowZoomControls` slot rather than
 * inside that deliberately domain-agnostic file. Off on every load, never
 * persisted (§9, decided 2026-08-20) — the state belongs to `WorldMap`.
 */
export default function MapGridToggle({
  isConfigured,
  isVisible,
  onToggle,
  onConfigure,
}: MapGridToggleProps) {
  const t = useTranslations("geography.gridToggle");
  const label = !isConfigured
    ? t("configure")
    : isVisible
      ? t("hide")
      : t("show");

  return (
    <button
      onClick={() => (isConfigured ? onToggle() : onConfigure())}
      aria-pressed={isVisible}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 ${
        isVisible
          ? "bg-gray-100 dark:bg-slate-600"
          : "bg-white dark:bg-slate-700"
      }`}
    >
      <Grid3x3 className="h-5 w-5 text-gray-600 dark:text-gray-100" />
    </button>
  );
}
