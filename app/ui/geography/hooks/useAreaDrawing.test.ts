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

const { updateZonePosition } = vi.hoisted(() => ({
  updateZonePosition: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/updateZonePosition", () => ({
  default: updateZonePosition,
}));

import { useAreaDrawing } from "./useAreaDrawing";
import type { Footprint } from "@/app/modules/maps/lib/utils/footprint";

type Props = Parameters<typeof useAreaDrawing>[0];

const footprint: Footprint = [
  [1, 1],
  [2, 2],
];
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
});
