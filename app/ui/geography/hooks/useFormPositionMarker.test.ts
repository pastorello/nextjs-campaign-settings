import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// TD-149: the marker SPEC-025 §5.2 promised — "typing in them moves the
// marker" — for the position the place form currently holds.

const fakeMap = {};
vi.mock("@/app/modules/maps/hooks/useLeafletMap", () => ({
  useLeafletMap: () => fakeMap,
}));

const remove = vi.fn();
const addTo = vi.fn();
const marker = vi.fn(() => ({ addTo, remove }));
const divIcon = vi.fn((options: unknown) => options);
vi.mock("leaflet", () => ({
  marker: (...args: unknown[]) => marker(...(args as [])),
  divIcon: (options: unknown) => divIcon(options),
}));

import { useFormPositionMarker } from "./useFormPositionMarker";

type Position = { lat: number; lng: number } | null;

function render(position: Position) {
  return renderHook(({ at }: { at: Position }) => useFormPositionMarker(at), {
    initialProps: { at: position },
  });
}

describe("useFormPositionMarker (TD-149)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addTo.mockImplementation(function (this: unknown) {
      return this;
    });
  });

  it("draws nothing while the form holds no position", async () => {
    render(null);

    // Nothing to wait for: the absence is immediate and stays so.
    await Promise.resolve();
    expect(marker).not.toHaveBeenCalled();
  });

  it("draws a non-interactive marker at the form's position", async () => {
    render({ lat: 375, lng: 250 });

    await waitFor(() => expect(addTo).toHaveBeenCalledWith(fakeMap));
    expect(marker).toHaveBeenCalledWith(
      [375, 250],
      expect.objectContaining({ interactive: false, keyboard: false })
    );
  });

  it("moves the marker when the position changes", async () => {
    const hook = render({ lat: 375, lng: 250 });
    await waitFor(() => expect(addTo).toHaveBeenCalledTimes(1));

    hook.rerender({ at: { lat: 100, lng: 900 } });

    await waitFor(() => expect(addTo).toHaveBeenCalledTimes(2));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(marker).toHaveBeenLastCalledWith([100, 900], expect.anything());
  });

  it("removes the marker when the form no longer holds a position", async () => {
    const hook = render({ lat: 375, lng: 250 });
    await waitFor(() => expect(addTo).toHaveBeenCalledTimes(1));

    hook.rerender({ at: null });

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("removes the marker on unmount", async () => {
    const hook = render({ lat: 375, lng: 250 });
    await waitFor(() => expect(addTo).toHaveBeenCalledTimes(1));

    hook.unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
