import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchUnplacedPlaces } = vi.hoisted(() => ({
  fetchUnplacedPlaces: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchUnplacedPlaces", () => ({
  default: fetchUnplacedPlaces,
}));

import { useUnplacedPlaces } from "./useUnplacedPlaces";

function place(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 5,
    title: "Regno di Kang",
    kind: "region" as const,
    parentId: 1,
    parentTitle: "Terra",
    ...overrides,
  };
}

describe("useUnplacedPlaces (SPEC-017 T8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchUnplacedPlaces.mockResolvedValue([]);
  });

  it("asks for the whole campaign, with no map to scope it to", async () => {
    renderHook(() => useUnplacedPlaces());

    await waitFor(() => expect(fetchUnplacedPlaces).toHaveBeenCalledTimes(1));
    // The per-parent argument is gone: that scoping is what made a place
    // under the wrong parent unreachable from every other map.
    expect(fetchUnplacedPlaces).toHaveBeenCalledWith();
  });

  it("returns the pool as read, without filtering it again", async () => {
    const rows = [place(), place({ id: 6, title: "Skreebars", kind: "city" })];
    fetchUnplacedPlaces.mockResolvedValue(rows);

    const { result } = renderHook(() => useUnplacedPlaces());

    await waitFor(() => expect(result.current).toEqual(rows));
  });

  it("refetches when refetchToken changes, e.g. after a placement", async () => {
    const { rerender } = renderHook(
      ({ token }: { token: number }) => useUnplacedPlaces(token),
      { initialProps: { token: 0 } }
    );
    await waitFor(() => expect(fetchUnplacedPlaces).toHaveBeenCalledTimes(1));

    rerender({ token: 1 });

    await waitFor(() => expect(fetchUnplacedPlaces).toHaveBeenCalledTimes(2));
  });

  it("re-reads when the map in view changes — the tree can move while the DM is elsewhere", async () => {
    const { rerender } = renderHook(
      ({ map }: { map: number }) => useUnplacedPlaces(0, map),
      { initialProps: { map: 1 } }
    );
    await waitFor(() => expect(fetchUnplacedPlaces).toHaveBeenCalledTimes(1));

    // Deleting a place sends its landmarks up to the grandparent without
    // coordinates (SPEC-010 rule 2), so the pool gains rows on the map the
    // DM is bounced back to. Still not a scope: the read takes no argument.
    rerender({ map: 2 });

    await waitFor(() => expect(fetchUnplacedPlaces).toHaveBeenCalledTimes(2));
    expect(fetchUnplacedPlaces).toHaveBeenLastCalledWith();
  });

  it("stays empty and logs when the read fails, rather than throwing into the map", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchUnplacedPlaces.mockRejectedValue(new Error("connection reset"));

    const { result } = renderHook(() => useUnplacedPlaces());

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(result.current).toEqual([]);
  });

  it("ignores a response that lands after unmount", async () => {
    let resolve: ((rows: unknown[]) => void) | undefined;
    fetchUnplacedPlaces.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );

    const { unmount } = renderHook(() => useUnplacedPlaces());
    unmount();
    resolve?.([place()]);

    // Nothing to assert on the state — the point is that setting it after
    // unmount would warn, and the cancelled flag is what prevents it.
    await waitFor(() => expect(fetchUnplacedPlaces).toHaveBeenCalledTimes(1));
  });
});
