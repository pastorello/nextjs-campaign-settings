"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import parseGridScale from "@/app/lib/config/geography/parseGridScale";

/**
 * Whether `MapMeasureTool` is armed (SPEC-015 T7) — extracted from
 * `WorldMap` (TD-127). `start` is the context menu's "Measure" entry,
 * `exit` the tool's own.
 */
export function useMeasureTool({
  parentId,
  gridColumns,
  gridScale,
  imageSize,
}: {
  parentId: number;
  gridColumns: number | null;
  gridScale: string | null;
  imageSize: { width: number; height: number } | null;
}): {
  isMeasuring: boolean;
  start: () => void;
  exit: () => void;
} {
  const tMeasure = useTranslations("geography.measure");
  // Click–track–click measurement (SPEC-015 T7) — armed from the context
  // menu, only when the grid is configured; off on every load, like the
  // grid toggle.
  const [isMeasuring, setIsMeasuring] = useState(false);

  // "Off on every load" (SPEC-015 §9) includes navigating to another place —
  // `WorldMap` isn't remounted on `parentId` change, so the measure tool
  // disarms here the same way the grid toggle does there: its grid is the
  // previous map's. The "adjusting state during render" pattern, for the
  // reason `WorldMap`'s own reset block gives.
  const [prevParentId, setPrevParentId] = useState(parentId);
  if (parentId !== prevParentId) {
    setPrevParentId(parentId);
    setIsMeasuring(false);
  }

  const exit = useCallback(() => {
    setIsMeasuring(false);
  }, []);

  const start = useCallback(() => {
    // No grid, no distances (§5's edge-case table): measurement never
    // starts, and the DM gets the one-line explanation rather than a
    // guessed number. `imageSize === null` (image still loading or
    // undecodable) blocks for the same reason — there is no pixel width
    // to convert through yet.
    if (
      gridColumns === null ||
      parseGridScale(gridScale) === null ||
      imageSize === null
    ) {
      toast.info(tMeasure("unavailable"));
      return;
    }
    setIsMeasuring(true);
  }, [gridColumns, gridScale, imageSize, tMeasure]);

  return { isMeasuring, start, exit };
}
