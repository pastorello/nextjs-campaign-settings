import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type DrawAreaOptions = {
  enabled: boolean;
  onComplete: (footprint: unknown) => void;
  onCancel: () => void;
};
// The hook calls `useDrawArea` twice per render, draw first and redraw
// second — the same parity `WorldMap.test.tsx` relies on.
const drawn: { draw?: DrawAreaOptions; redraw?: DrawAreaOptions } = {};
let calls = 0;
vi.mock("@/app/modules/maps/hooks/useDrawArea", () => ({
  useDrawArea: (options: DrawAreaOptions) => {
    drawn[calls++ % 2 === 0 ? "draw" : "redraw"] = options;
  },
}));

// SPEC-024 T5's editor, stood in for: its own suite drives the handles.
type EditAreaOptions = {
  enabled: boolean;
  initial: unknown;
  onSave: (footprint: unknown, centre: unknown) => void;
  onCancel: () => void;
};
const edited: { options?: EditAreaOptions } = {};
const saveOutlineSpy = vi.fn();
vi.mock("@/app/modules/maps/hooks/useEditArea", () => ({
  useEditArea: (options: EditAreaOptions) => {
    edited.options = options;
    return { save: saveOutlineSpy };
  },
}));

const { updateZonePosition } = vi.hoisted(() => ({
  updateZonePosition: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/updateZonePosition", () => ({
  default: updateZonePosition,
}));

import { useAreaDrawing } from "./useAreaDrawing";
import { rectangleFootprint } from "@/app/modules/maps/lib/utils/footprint";

type Props = Parameters<typeof useAreaDrawing>[0];

const footprint = rectangleFootprint([1, 1], [2, 2]);
const area = { id: 5, title: "Kang" };

function render() {
  const props: Props = {
    parentId: 1,
    bounds: [
      [0, 0],
      [10, 10],
    ],
    onArm: vi.fn(),
    onAreaDrawn: vi.fn(),
    onPlacesChanged: vi.fn(),
  };
  const hook = renderHook((p: Props) => useAreaDrawing(p), {
    initialProps: props,
  });
  return { ...hook, props };
}

describe("useAreaDrawing (TD-127)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    calls = 0;
    updateZonePosition.mockResolvedValue({ ok: true });
  });

  it("toggles draw-an-area mode, cancelling point selection when arming", () => {
    const { result, props } = render();

    act(() => result.current.toggleDrawArea());
    expect(result.current.isDrawingArea).toBe(true);
    expect(drawn.draw?.enabled).toBe(true);
    expect(drawn.redraw?.enabled).toBe(false);
    expect(props.onArm).toHaveBeenCalledTimes(1);

    act(() => result.current.toggleDrawArea());
    expect(result.current.isDrawingArea).toBe(false);
  });

  it("hands a completed rectangle on and disarms", () => {
    const { result, props } = render();
    act(() => result.current.toggleDrawArea());

    act(() => drawn.draw?.onComplete(footprint));

    expect(props.onAreaDrawn).toHaveBeenCalledWith(footprint);
    expect(result.current.isDrawingArea).toBe(false);
  });

  it("keeps the two modes mutually exclusive", () => {
    const { result } = render();
    act(() => result.current.toggleDrawArea());

    act(() => result.current.armAreaRedraw(area));
    expect(result.current.isDrawingArea).toBe(false);
    expect(result.current.editingArea).toEqual(area);
    expect(drawn.redraw?.enabled).toBe(true);

    act(() => result.current.toggleDrawArea());
    expect(result.current.editingArea).toBeNull();
    expect(result.current.isDrawingArea).toBe(true);

    act(() => result.current.disarm());
    expect(result.current.isDrawingArea).toBe(false);
    expect(result.current.editingArea).toBeNull();
  });

  it("saves a redrawn area, then refetches", async () => {
    const { result, props } = render();
    act(() => result.current.armAreaRedraw(area));

    act(() => drawn.redraw?.onComplete(footprint));

    expect(updateZonePosition).toHaveBeenCalledWith({ id: 5, footprint });
    await waitFor(() => expect(props.onPlacesChanged).toHaveBeenCalledTimes(1));
    expect(result.current.editingArea).toBeNull();
  });

  it("shows the server's refusal for a redrawn area", async () => {
    updateZonePosition.mockResolvedValue({
      ok: false,
      errors: {
        footprint: [{ key: "areaOverlaps", values: { title: "Kang" } }],
      },
    });
    const { result, props } = render();
    act(() => result.current.armAreaRedraw(area));

    act(() => drawn.redraw?.onComplete(footprint));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "common.fieldErrors.areaOverlaps"
      )
    );
    expect(props.onPlacesChanged).not.toHaveBeenCalled();
  });

  it("cancels a redraw, but not draw-an-area mode, on navigation", () => {
    const { result, rerender, props } = render();
    act(() => result.current.armAreaRedraw(area));

    rerender({ ...props, parentId: 2 });
    expect(result.current.editingArea).toBeNull();

    act(() => result.current.toggleDrawArea());
    rerender({ ...props, parentId: 3 });
    expect(result.current.isDrawingArea).toBe(true);
  });

  describe("editing an outline in place (SPEC-024 T5)", () => {
    const outline = {
      id: 5,
      title: "Kang",
      footprint,
      centre: [1.5, 1.5] as [number, number],
    };

    it("arms the editor with the area, and disarms the other two modes", () => {
      const { result, props } = render();
      act(() => result.current.toggleDrawArea());

      act(() => result.current.armOutlineEdit(outline));

      expect(result.current.editingOutline).toBe(outline);
      expect(result.current.isDrawingArea).toBe(false);
      expect(result.current.editingArea).toBeNull();
      expect(props.onArm).toHaveBeenCalled();
      expect(edited.options).toMatchObject({ enabled: true, initial: outline });
    });

    it("saves the outline with the placed centre, then refetches and disarms", async () => {
      const { result, props } = render();
      act(() => result.current.armOutlineEdit(outline));
      const moved = rectangleFootprint([1, 1], [3, 3]);

      act(() => edited.options!.onSave(moved, [2, 2]));

      await waitFor(() => expect(props.onPlacesChanged).toHaveBeenCalled());
      expect(updateZonePosition).toHaveBeenCalledWith({
        id: 5,
        footprint: moved,
        centre: [2, 2],
      });
      expect(result.current.editingOutline).toBeNull();
    });

    it("keeps the editor open, edit intact, when the server refuses", async () => {
      updateZonePosition.mockResolvedValue({
        ok: false,
        errors: {
          footprint: [{ key: "areaOverlaps", values: { title: "Orc" } }],
        },
      });
      const { result, props } = render();
      act(() => result.current.armOutlineEdit(outline));

      act(() => edited.options!.onSave(footprint, [1.5, 1.5]));

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(result.current.editingOutline).toBe(outline);
      expect(props.onPlacesChanged).not.toHaveBeenCalled();
    });

    it("disarms on cancel, writing nothing", () => {
      const { result } = render();
      act(() => result.current.armOutlineEdit(outline));

      act(() => edited.options!.onCancel());

      expect(result.current.editingOutline).toBeNull();
      expect(updateZonePosition).not.toHaveBeenCalled();
    });

    it("hands the bar's Save to the editor's own save", () => {
      const { result } = render();
      act(() => result.current.armOutlineEdit(outline));

      act(() => result.current.saveOutline());

      expect(saveOutlineSpy).toHaveBeenCalled();
    });
  });
});
