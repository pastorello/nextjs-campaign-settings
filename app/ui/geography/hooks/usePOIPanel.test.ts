import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePOIPanel } from "./usePOIPanel";
import type { Footprint } from "@/app/modules/maps/lib/utils/footprint";
import type { POI } from "@/app/modules/maps/types/poi";

const footprint: Footprint = [
  [1, 1],
  [2, 2],
];
const poi = { id: "client-1", title: "Faro" } as POI;

function render() {
  return renderHook(({ parentId }) => usePOIPanel({ parentId }), {
    initialProps: { parentId: 1 },
  });
}

describe("usePOIPanel (TD-127)", () => {
  afterEach(() => vi.useRealTimers());

  it("opens in add mode at a point", () => {
    const { result } = render();

    act(() => result.current.openAddAt(3, 4));

    expect(result.current).toMatchObject({
      isOpen: true,
      mode: "add",
      initialCoords: { lat: 3, lng: 4 },
      filterCategory: null,
    });
  });

  it("opens in add mode for a drawn footprint, until it is consumed", () => {
    const { result } = render();

    act(() => result.current.openAddForFootprint(footprint));
    expect(result.current).toMatchObject({ isOpen: true, mode: "add" });
    expect(result.current.pendingFootprint).toBe(footprint);

    act(() => result.current.consumeFootprint());
    expect(result.current.pendingFootprint).toBeNull();
  });

  it("clears the edit target once the panel leaves edit mode (SPEC-016 T7)", () => {
    const { result } = render();

    act(() => result.current.openEdit(poi));
    expect(result.current).toMatchObject({ isOpen: true, mode: "edit" });
    expect(result.current.editTarget).toBe(poi);

    act(() => result.current.changeMode("edit"));
    expect(result.current.editTarget).toBe(poi);

    act(() => result.current.changeMode("list"));
    expect(result.current.editTarget).toBeNull();
  });

  it("resets on close, and the seeds only after the close animation", () => {
    vi.useFakeTimers();
    const { result } = render();
    act(() => result.current.openAddAt(3, 4));
    act(() => result.current.openAddForFootprint(footprint));
    act(() => result.current.toggleLocationSelection());

    act(() => result.current.close());
    expect(result.current).toMatchObject({
      isOpen: false,
      mode: "list",
      isSelectingLocation: false,
      pendingFootprint: null,
      editTarget: null,
    });
    expect(result.current.initialCoords).toEqual({ lat: 3, lng: 4 });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.initialCoords).toBeNull();
  });

  it("tracks the cursor only while picking, and a pick ends the mode", () => {
    const { result } = render();

    act(() => result.current.trackCursor(1, 1));
    expect(result.current.cursorCoords).toBeNull();

    act(() => result.current.toggleLocationSelection());
    act(() => result.current.trackCursor(5, 6));
    expect(result.current.cursorCoords).toEqual({ lat: 5, lng: 6 });

    act(() => result.current.pickLocation(7, 8));
    expect(result.current).toMatchObject({
      isSelectingLocation: false,
      cursorCoords: null,
      initialCoords: { lat: 7, lng: 8 },
    });
  });

  it("cancels picking without touching the chosen point", () => {
    const { result } = render();
    act(() => result.current.openAddAt(3, 4));
    act(() => result.current.toggleLocationSelection());
    act(() => result.current.trackCursor(5, 6));

    act(() => result.current.cancelLocationSelection());

    expect(result.current).toMatchObject({
      isSelectingLocation: false,
      cursorCoords: null,
      initialCoords: { lat: 3, lng: 4 },
    });

    act(() => result.current.clearCoordinates());
    expect(result.current.initialCoords).toBeNull();
  });

  it("clears the cursor readout, but keeps picking armed, on navigation", () => {
    const { result, rerender } = render();
    act(() => result.current.toggleLocationSelection());
    act(() => result.current.trackCursor(5, 6));

    rerender({ parentId: 2 });

    expect(result.current.cursorCoords).toBeNull();
    expect(result.current.isSelectingLocation).toBe(true);
  });
});
