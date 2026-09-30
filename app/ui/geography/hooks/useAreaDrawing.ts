"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useDrawArea } from "@/app/modules/maps/hooks/useDrawArea";
import { useEditArea } from "@/app/modules/maps/hooks/useEditArea";
import updateZonePosition from "@/app/lib/data/maps/updateZonePosition";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import type { Footprint, Point } from "@/app/modules/maps/lib/utils/footprint";

/** The area armed for a redraw, as `armAreaRedraw` takes it. */
export interface EditingArea {
  id: number;
  title: string;
}

/**
 * The area armed for editing its outline in place (SPEC-024 T5): what the
 * editor starts from — the stored outline and the centre its label sits on.
 */
export interface EditingOutline extends EditingArea {
  footprint: Footprint;
  centre: Point;
}

/**
 * The two drag-a-rectangle crosshair modes (SPEC-009 T2 and T5) —
 * extracted from `WorldMap` (TD-127).
 *
 * The third crosshair mode, picking a point for the POI panel, is
 * `usePOIPanel`'s. The three are mutually exclusive: arming either mode here
 * calls `onArm`, which `WorldMap` points at the panel's
 * `cancelLocationSelection`, and arming location selection calls `disarm`.
 */
export function useAreaDrawing({
  parentId,
  bounds,
  onArm,
  onAreaDrawn,
  onPlacesChanged,
}: {
  parentId: number;
  bounds: L.LatLngBoundsExpression;
  onArm: () => void;
  onAreaDrawn: (footprint: Footprint) => void;
  onPlacesChanged: () => void;
}): {
  isDrawingArea: boolean;
  editingArea: EditingArea | null;
  editingOutline: EditingOutline | null;
  toggleDrawArea: () => void;
  armAreaRedraw: (area: EditingArea) => void;
  armOutlineEdit: (area: EditingOutline) => void;
  saveOutline: () => void;
  cancelOutline: () => void;
  disarm: () => void;
} {
  const t = useTranslations("geography.errors");
  const tRoot = useTranslations();

  // Draw-an-area mode (SPEC-009 T2) — armed by `MapContextMenu`'s "Add
  // sub-map" entry (ex-`DrawAreaButton`, consolidated 2026-08-17), consumed
  // by `useDrawArea`. Mutually exclusive with the POI panel's location
  // selection (see the handlers below), the same way the crosshair modes
  // already exclude each other by being distinct.
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  // The area currently armed for a redraw-to-replace resize/move (SPEC-009
  // T5) — title is captured at arm time so a failure toast can name the area
  // without re-reading `areaChildren`. A third crosshair mode, mutually
  // exclusive with the other two the same way they already exclude each
  // other.
  const [editingArea, setEditingArea] = useState<EditingArea | null>(null);
  // An area whose outline is being edited in place (SPEC-024 T5) — the
  // third area mode, exclusive with the two above the same way.
  const [editingOutline, setEditingOutline] = useState<EditingOutline | null>(
    null
  );

  // A redraw in progress belongs to the map being left — `WorldMap` isn't
  // remounted on `parentId` change, so it is cancelled here, the same way
  // `WorldMap`'s own reset block cancels its state (and with the same
  // "adjusting state during render" pattern). Draw-an-area mode is not
  // reset on navigation, as before the extraction.
  const [prevParentId, setPrevParentId] = useState(parentId);
  if (parentId !== prevParentId) {
    setPrevParentId(parentId);
    setEditingArea(null);
    setEditingOutline(null);
  }

  // Cancels both modes here — what arming the POI panel's location
  // selection does to them (SPEC-009 T2).
  const disarm = useCallback(() => {
    setIsDrawingArea(false);
    setEditingArea(null);
    setEditingOutline(null);
  }, []);

  // Arms/disarms draw-area mode (SPEC-009 T2), cancelling the other
  // crosshair modes the same way they cancel this one.
  const toggleDrawArea = useCallback(() => {
    onArm();
    setEditingArea(null);
    setEditingOutline(null);
    setIsDrawingArea((prev) => !prev);
  }, [onArm]);

  // Arms the redraw-to-replace gesture (SPEC-009 T5) — the mirror of
  // `toggleDrawArea`, cancelling the other crosshair modes for the
  // same reason. `ZoneEditPanel` is the one caller: the right-click menu
  // used to arm this too, on the area the cursor was inside, and TD-104
  // removed that entry (the DM, 2026-08-30) in favour of a single edit
  // surface reached from the place itself. Still takes its target as an
  // argument rather than reading `contextMenuOverArea`, which is the shape
  // that let the popover reach it in the first place.
  const armAreaRedraw = useCallback(
    (area: EditingArea) => {
      setIsDrawingArea(false);
      setEditingOutline(null);
      onArm();
      setEditingArea(area);
    },
    [onArm]
  );

  // Arms in-place editing of an area's outline (SPEC-024 T5) — from
  // `ZoneEditPanel`, like the redraw, and exclusive with the other modes.
  const armOutlineEdit = useCallback(
    (area: EditingOutline) => {
      setIsDrawingArea(false);
      setEditingArea(null);
      onArm();
      setEditingOutline(area);
    },
    [onArm]
  );

  const cancelOutline = useCallback(() => {
    setEditingOutline(null);
  }, []);

  // The edited outline, with the centre the DM placed, re-runs every
  // placement check server-side. Unlike the redraw, a refusal leaves the
  // editor open with the edit intact: the DM fixes the vertex the message
  // names instead of starting the outline over.
  const handleOutlineSaved = useCallback(
    async (footprint: Footprint, centre: Point) => {
      if (!editingOutline) return;
      const { id, title } = editingOutline;
      try {
        const result = await updateZonePosition({ id, footprint, centre });
        if (result.ok) {
          setEditingOutline(null);
          onPlacesChanged();
        } else {
          const firstError = resolveFirstFieldError(result.errors ?? {}, tRoot);
          toast.error(firstError ?? t("placePositionFailed", { title }));
        }
      } catch (error) {
        console.error("Failed to save the edited outline:", error);
        toast.error(t("placePositionFailed", { title }));
      }
    },
    [editingOutline, onPlacesChanged, t, tRoot]
  );

  // The hook aborted the redraw gesture itself (Escape, a too-small drag)
  // and wants editing disarmed — the edit-mode counterpart of
  // `handleDrawAreaCancelled`.
  const handleAreaEditCancelled = useCallback(() => {
    setEditingArea(null);
  }, []);

  // A replacement rectangle finished drawing over the area being edited
  // (SPEC-009 T5) — re-runs both §7 checks server-side via
  // `updateZonePosition`, excluding the area's own row from its sibling
  // comparison. No optimistic update: the old rectangle stays hidden
  // (`editingArea`'s id passed to `useNavigableChildren`) until the server
  // confirms, then a refetch renders the new one.
  const handleAreaEditDrawn = useCallback(
    async (footprint: Footprint) => {
      if (!editingArea) return;
      const { id, title } = editingArea;
      setEditingArea(null);
      try {
        const result = await updateZonePosition({ id, footprint });
        if (result.ok) {
          onPlacesChanged();
        } else {
          const firstError = resolveFirstFieldError(result.errors ?? {}, tRoot);
          toast.error(firstError ?? t("placePositionFailed", { title }));
        }
      } catch (error) {
        console.error("Failed to resize/move area:", error);
        toast.error(t("placePositionFailed", { title }));
      }
    },
    [editingArea, onPlacesChanged, t, tRoot]
  );

  // A rectangle finished drawing (SPEC-009 T2) — disarms, and hands the
  // footprint to `onAreaDrawn`, which opens the create form with it
  // attached.
  const handleAreaDrawn = useCallback(
    (footprint: Footprint) => {
      setIsDrawingArea(false);
      onAreaDrawn(footprint);
    },
    [onAreaDrawn]
  );

  // The hook aborted the gesture itself (Escape, a too-small drag) and
  // wants the button disarmed (SPEC-009 T2).
  const handleDrawAreaCancelled = useCallback(() => {
    setIsDrawingArea(false);
  }, []);

  // Drag-to-draw an area on the current map (SPEC-009 T2) — armed by
  // `isDrawingArea`, disarmed by `handleAreaDrawn` on a completed rectangle
  // or by `handleDrawAreaCancelled`.
  useDrawArea({
    enabled: isDrawingArea,
    bounds,
    onComplete: handleAreaDrawn,
    onCancel: handleDrawAreaCancelled,
  });

  // Redraw-to-replace an existing area's rectangle (SPEC-009 T5) — armed by
  // `editingArea` (via `ZoneEditPanel`'s "redraw area"), disarmed by
  // `handleAreaEditDrawn` on a completed rectangle or by
  // `handleAreaEditCancelled`. A second, independent `useDrawArea` instance
  // rather than a mode flag on the one above: the two are mutually
  // exclusive by construction (every handler that sets one clears the
  // other), so only one is ever actually enabled.
  useDrawArea({
    enabled: editingArea !== null,
    bounds,
    onComplete: (footprint) => void handleAreaEditDrawn(footprint),
    onCancel: handleAreaEditCancelled,
  });

  const tOutline = useTranslations("geography.outlineEdit");
  const { save: saveOutline } = useEditArea({
    enabled: editingOutline !== null,
    initial: editingOutline,
    bounds,
    labels: {
      vertex: (index, total) => tOutline("vertex", { index, total }),
      midpoint: (from, to) => tOutline("midpoint", { from, to }),
      centre: tOutline("centre"),
    },
    onSave: (footprint, centre) => void handleOutlineSaved(footprint, centre),
    onCancel: cancelOutline,
  });

  return {
    isDrawingArea,
    editingArea,
    editingOutline,
    toggleDrawArea,
    armAreaRedraw,
    armOutlineEdit,
    saveOutline,
    cancelOutline,
    disarm,
  };
}
