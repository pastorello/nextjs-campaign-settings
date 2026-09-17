import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const { unplacePlace } = vi.hoisted(() => ({ unplacePlace: vi.fn() }));
vi.mock("@/app/lib/data/maps/unplacePlace", () => ({ default: unplacePlace }));

import { usePlacePopover } from "./usePlacePopover";
import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";
import type { POI } from "@/app/modules/maps/types/poi";

type Props = Parameters<typeof usePlacePopover>[0];

const child = { id: 5, title: "Kang" } as NavigableChild;
const poi = { id: "client-1", title: "Faro" } as POI;

function render(overrides: Partial<Props> = {}) {
  const props: Props = {
    parentId: 1,
    isMeasuring: false,
    onDescend: vi.fn(),
    onPlacesChanged: vi.fn(),
    ...overrides,
  };
  const hook = renderHook((p: Props) => usePlacePopover(p), {
    initialProps: props,
  });
  return { ...hook, props };
}

describe("usePlacePopover (TD-127)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    unplacePlace.mockResolvedValue({ ok: true });
  });

  it("opens on a zone or a landmark, the landmark with its row id (TD-108)", () => {
    const { result } = render();

    act(() => result.current.handlePlaceClick(child));
    expect(result.current.target).toEqual({ kind: "zone", place: child });

    act(() => result.current.handlePOIClick(poi, 42));
    expect(result.current.target).toEqual({ kind: "poi", poi, poiId: 42 });

    act(() => result.current.close());
    expect(result.current.target).toBeNull();
  });

  it("keeps the activated element for a keyboard open, and forgets it on a click (TD-133)", () => {
    const { result } = render();
    const marker = document.createElement("div");

    act(() => result.current.handlePOIClick(poi, 42, marker));
    expect(result.current.returnFocusTo).toBe(marker);

    act(() => result.current.handlePlaceClick(child));
    expect(result.current.returnFocusTo).toBeNull();

    act(() => result.current.handlePlaceClick(child, marker));
    expect(result.current.returnFocusTo).toBe(marker);
  });

  it("stays shut while the measure tool owns map clicks", () => {
    const { result } = render({ isMeasuring: true });

    act(() => result.current.handlePlaceClick(child));
    act(() => result.current.handlePOIClick(poi, 42));

    expect(result.current.target).toBeNull();
  });

  it("closes when the DM moves to another map", () => {
    const { result, rerender, props } = render();
    act(() => result.current.handlePlaceClick(child));

    rerender({ ...props, parentId: 2 });

    expect(result.current.target).toBeNull();
  });

  it("descends through 'Apri mappa' and closes", () => {
    const { result, props } = render();
    act(() => result.current.handlePlaceClick(child));

    act(() => result.current.handleOpenMap(child));

    expect(props.onDescend).toHaveBeenCalledWith(child);
    expect(result.current.target).toBeNull();
  });

  it("un-places, then refetches and closes", async () => {
    const { result, props } = render();
    act(() => result.current.handlePlaceClick(child));

    await act(() => result.current.handleUnplace(child));

    expect(unplacePlace).toHaveBeenCalledWith({ id: 5 });
    expect(props.onPlacesChanged).toHaveBeenCalledTimes(1);
    expect(result.current.target).toBeNull();
  });

  it("keeps the popover open and says so when un-placing fails", async () => {
    unplacePlace.mockResolvedValue({ ok: false });
    const { result, props } = render();
    act(() => result.current.handlePlaceClick(child));

    await act(() => result.current.handleUnplace(child));

    expect(props.onPlacesChanged).not.toHaveBeenCalled();
    expect(result.current.target).not.toBeNull();
    expect(toast.error).toHaveBeenCalledWith("placeUnplaceFailed");
  });

  it("refetches and closes once a place is deleted", () => {
    const { result, props } = render();
    act(() => result.current.handlePlaceClick(child));

    act(() => result.current.handlePlaceDeleted());

    expect(props.onPlacesChanged).toHaveBeenCalledTimes(1);
    expect(result.current.target).toBeNull();
  });
});
